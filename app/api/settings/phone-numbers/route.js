export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/settings/phone-numbers — fetch all phone numbers for org
export async function GET(request) {
  const { createClient } = await import('@supabase/supabase-js');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    const { data, error } = await supabase
      .from('phone_numbers')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw error;

    return Response.json(data);
  } catch (error) {
    console.error('GET /api/settings/phone-numbers error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/settings/phone-numbers — toggle is_active
export async function PATCH(request) {
  const { createClient } = await import('@supabase/supabase-js');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    const { id, is_active } = await request.json();

    const { data, error } = await supabase
      .from('phone_numbers')
      .update({ is_active })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return Response.json(data);
  } catch (error) {
    console.error('PATCH /api/settings/phone-numbers error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
