import { createClient } from '@supabase/supabase-js';
import twilio from 'twilio';

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Initialize Twilio
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function POST(request) {
  try {
    // Parse the incoming Twilio webhook data
    const formData = await request.formData();
    const callerPhone = formData.get('From');
    const calledPhone = formData.get('To');
    const callStatus = formData.get('CallStatus');

    console.log(`Call from ${callerPhone} to ${calledPhone} - Status: ${callStatus}`);

    // Only respond to missed/no-answer calls
    if (callStatus !== 'no-answer' && callStatus !== 'busy') {
      return new Response('OK', { status: 200 });
    }

    // Find which organization owns this phone number
    const { data: phoneNumber, error: phoneError } = await supabase
      .from('phone_numbers')
      .select('*, organizations(*)')
      .eq('phone_number', calledPhone)
      .eq('is_active', true)
      .single();

    if (phoneError || !phoneNumber) {
      console.error('Phone number not found:', calledPhone);
      return new Response('Phone number not found', { status: 404 });
    }

    const organization = phoneNumber.organizations;

    // Check if a conversation already exists with this broker today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: existingConvo } = await supabase
      .from('conversations')
      .select('id')
      .eq('organization_id', organization.id)
      .eq('broker_phone', callerPhone)
      .gte('created_at', today.toISOString())
      .single();

    // Don't spam the same broker twice in one day
    if (existingConvo) {
      console.log('Conversation already exists today for this broker');
      return new Response('OK', { status: 200 });
    }

    // Create a new conversation record
    const { data: conversation, error: convoError } = await supabase
      .from('conversations')
      .insert({
        organization_id: organization.id,
        phone_number_id: phoneNumber.id,
        broker_phone: callerPhone,
        status: 'active',
        ai_state: 'greeting'
      })
      .select()
      .single();

    if (convoError) {
      console.error('Error creating conversation:', convoError);
      return new Response('Error creating conversation', { status: 500 });
    }

    // Send the initial SMS to the broker
    const initialMessage = `Hey! Sorry we missed your call. Do you have a load available? If so, please share the details and our dispatch team will get back to you shortly.`;

    const sentMessage = await twilioClient.messages.create({
      body: initialMessage,
      from: calledPhone,
      to: callerPhone
    });

    // Save the outbound message to the database
    await supabase
      .from('messages')
      .insert({
        conversation_id: conversation.id,
        organization_id: organization.id,
        direction: 'outbound',
        body: initialMessage,
        twilio_sid: sentMessage.sid
      });

    console.log(`SMS sent to ${callerPhone} - Message SID: ${sentMessage.sid}`);

    return new Response('OK', { status: 200 });

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}