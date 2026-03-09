export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// PATCH /api/loads/[id] — update load status
export async function PATCH(request, { params }) {
  const { createClient } = await import('@supabase/supabase-js');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    const { status } = await request.json();
    const validStatuses = ['new', 'reviewed', 'booked', 'passed'];

    if (!validStatuses.includes(status)) {
      return Response.json({ error: 'Invalid status' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('load_opportunities')
      .update({ status })
      .eq('id', params.id)
      .select()
      .single();

    if (error) throw error;

    return Response.json(data);
  } catch (error) {
    console.error('PATCH /api/loads/[id] error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
