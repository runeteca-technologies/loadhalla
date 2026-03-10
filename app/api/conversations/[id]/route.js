export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request, context) {
  const { createClient } = await import('@supabase/supabase-js');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    const params = await context.params;
    const id = params.id;

    const { data: conversation, error: convoError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', id)
      .single();

    if (convoError) throw convoError;

    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true });

    if (msgError) throw msgError;

    return Response.json({ ...conversation, messages });
  } catch (error) {
    console.error('GET /api/conversations/[id] error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}