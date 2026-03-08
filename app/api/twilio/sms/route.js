export const runtime = 'nodejs';

import { createClient } from '@supabase/supabase-js';
import twilio from 'twilio';
import OpenAI from 'openai';

// Initialize services
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// ─── AI SYSTEM PROMPT ────────────────────────────────────────────
const SYSTEM_PROMPT = `You are a professional trucking dispatcher assistant for a carrier company. 
Your job is to collect load details from freight brokers via SMS in a friendly, professional manner.

You need to collect ALL of the following information:
1. Pickup location (city and state)
2. Delivery location (city and state)  
3. Pickup date and time
4. Delivery date and time
5. Commodity (what is being shipped)
6. Rate offered (in dollars)
7. Broker name and company

Rules:
- Keep messages SHORT and conversational - this is SMS not email
- Ask for one or two pieces of missing information at a time
- Be friendly but professional
- Once you have ALL details confirm them back to the broker
- When all details are confirmed respond with exactly: LOAD_CAPTURE_COMPLETE
- If the broker says they no longer have a load or it is taken respond with: LOAD_NO_LONGER_AVAILABLE
- Never make up or assume load details
- Always confirm the rate clearly`;

// ─── EXTRACT LOAD DATA FROM CONVERSATION ─────────────────────────
async function extractLoadData(messages) {
  const extractPrompt = `Based on this SMS conversation extract the load details as JSON.
  
Conversation:
${messages.map(m => `${m.direction === 'inbound' ? 'Broker' : 'Dispatcher'}: ${m.body}`).join('\n')}

Return ONLY a JSON object with these fields (use null if not found):
{
  "pickup_location": "",
  "delivery_location": "",
  "pickup_time": "",
  "delivery_time": "",
  "commodity": "",
  "rate": null,
  "rate_raw": "",
  "broker_name": "",
  "broker_company": ""
}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: extractPrompt }],
    response_format: { type: 'json_object' }
  });

  try {
    return JSON.parse(response.choices[0].message.content);
  } catch {
    return {};
  }
}

// ─── MAIN SMS HANDLER ─────────────────────────────────────────────
export async function POST(request) {
  try {
    const formData = await request.formData();
    const incomingMessage = formData.get('Body');
    const brokerPhone = formData.get('From');
    const ourPhone = formData.get('To');

    console.log(`SMS from ${brokerPhone}: ${incomingMessage}`);

    // Find the active conversation for this broker
    const { data: conversation, error: convoError } = await supabase
      .from('conversations')
      .select('*, organizations(*), phone_numbers(*)')
      .eq('broker_phone', brokerPhone)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (convoError || !conversation) {
      console.error('No active conversation found for:', brokerPhone);
      return new Response('', { status: 200 });
    }

    // Save the inbound message
    await supabase
      .from('messages')
      .insert({
        conversation_id: conversation.id,
        organization_id: conversation.organization_id,
        direction: 'inbound',
        body: incomingMessage
      });

    // Get full conversation history
    const { data: messageHistory } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: true });

    // Build message history for OpenAI
    const aiMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messageHistory.map(msg => ({
        role: msg.direction === 'inbound' ? 'user' : 'assistant',
        content: msg.body
      }))
    ];

    // Get AI response
    const aiResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: aiMessages,
      max_tokens: 300
    });

    const aiReply = aiResponse.choices[0].message.content.trim();

    // ─── LOAD CAPTURE COMPLETE ───────────────────────────────────
    if (aiReply.includes('LOAD_CAPTURE_COMPLETE')) {

      // Extract structured load data from conversation
      const loadData = await extractLoadData(messageHistory);

      // Save the load opportunity
      const { data: loadOpportunity } = await supabase
        .from('load_opportunities')
        .insert({
          organization_id: conversation.organization_id,
          conversation_id: conversation.id,
          ...loadData,
          broker_phone: brokerPhone,
          status: 'new',
          raw_conversation: messageHistory
            .map(m => `${m.direction === 'inbound' ? 'Broker' : 'AI'}: ${m.body}`)
            .join('\n')
        })
        .select()
        .single();

      // Mark conversation as completed
      await supabase
        .from('conversations')
        .update({ status: 'completed', ai_state: 'completed' })
        .eq('id', conversation.id);

      // Send confirmation to broker
      const confirmMessage = `Perfect, thank you! I've passed all the load details to our dispatch team. They'll be in touch shortly if we can cover it.`;

      await twilioClient.messages.create({
        body: confirmMessage,
        from: ourPhone,
        to: brokerPhone
      });

      // Save confirmation message
      await supabase
        .from('messages')
        .insert({
          conversation_id: conversation.id,
          organization_id: conversation.organization_id,
          direction: 'outbound',
          body: confirmMessage
        });

      // Create dispatcher notification
      await supabase
        .from('notifications')
        .insert({
          organization_id: conversation.organization_id,
          load_opportunity_id: loadOpportunity.id,
          type: 'new_load',
          message: `New load from ${brokerPhone}: ${loadData.pickup_location || 'Unknown'} → ${loadData.delivery_location || 'Unknown'} at $${loadData.rate || 'TBD'}`,
          sent_via: 'dashboard'
        });

      // Send SMS notification to dispatcher
      if (conversation.organizations?.phone) {
        await twilioClient.messages.create({
          body: `🚛 NEW LOAD CAPTURED\nFrom: ${brokerPhone}\nRoute: ${loadData.pickup_location || 'TBD'} → ${loadData.delivery_location || 'TBD'}\nRate: $${loadData.rate || 'TBD'}\nView: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard/loads`,
          from: ourPhone,
          to: conversation.organizations.phone
        });
      }

      console.log('Load captured successfully:', loadOpportunity?.id);
      return new Response('', { status: 200 });
    }

    // ─── LOAD NO LONGER AVAILABLE ────────────────────────────────
    if (aiReply.includes('LOAD_NO_LONGER_AVAILABLE')) {
      await supabase
        .from('conversations')
        .update({ status: 'abandoned' })
        .eq('id', conversation.id);

      return new Response('', { status: 200 });
    }

    // ─── NORMAL CONVERSATION CONTINUES ───────────────────────────
    await twilioClient.messages.create({
      body: aiReply,
      from: ourPhone,
      to: brokerPhone
    });

    // Save AI response
    await supabase
      .from('messages')
      .insert({
        conversation_id: conversation.id,
        organization_id: conversation.organization_id,
        direction: 'outbound',
        body: aiReply
      });

    // Update conversation state
    await supabase
      .from('conversations')
      .update({ 
        ai_state: 'collecting',
        updated_at: new Date().toISOString()
      })
      .eq('id', conversation.id);

    return new Response('', { status: 200 });

  } catch (error) {
    console.error('SMS handler error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}