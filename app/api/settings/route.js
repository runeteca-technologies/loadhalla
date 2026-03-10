export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/settings — fetch organization details
export async function GET(request) {
  const { createClient } = await import('@supabase/supabase-js');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .limit(1)
      .single();

    if (error) throw error;

    return Response.json(data);
  } catch (error) {
    console.error('GET /api/settings error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/settings — update organization details
export async function PATCH(request) {
  const { createClient } = await import('@supabase/supabase-js');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    const body = await request.json();
    const allowedFields = ['name', 'email', 'phone'];
    const updates = Object.fromEntries(
      Object.entries(body).filter(([key]) => allowedFields.includes(key))
    );

    const { data, error } = await supabase
      .from('organizations')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', body.id)
      .select()
      .single();

    if (error) throw error;

    return Response.json(data);
  } catch (error) {
    console.error('PATCH /api/settings error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
