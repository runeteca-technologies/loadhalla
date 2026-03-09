export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/loads — fetch all load opportunities for the org
export async function GET(request) {
  const { createClient } = await import('@supabase/supabase-js');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    const { data, error } = await supabase
      .from('load_opportunities')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return Response.json(data);
  } catch (error) {
    console.error('GET /api/loads error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
