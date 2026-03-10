export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/conversations — fetch all conversations with message counts
export async function GET(request) {
  const { createClient } = await import('@supabase/supabase-js');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        messages(count)
      `)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    return Response.json(data);
  } catch (error) {
    console.error('GET /api/conversations error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
