import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  try {
    // Slack sends button clicks as URL-encoded form data
    const body = await request.text()
    const params = new URLSearchParams(body)
    const payload = JSON.parse(params.get('payload'))

    // Extract the action and lead ID
    const action = payload.actions[0]
    const leadId = action.value
    const approved = action.action_id === 'approve_lead'
    const userName = payload.user.name

    console.log(`${userName} ${approved ? 'approved' : 'skipped'} lead ${leadId}`)

    // Update lead status in Supabase
    const { error } = await supabase
      .from('leads')
      .update({
        status: approved ? 'qualified' : 'disqualified',
      })
      .eq('id', leadId)

    if (error) {
      console.error('Supabase update error:', error)
      return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 })
    }

    // Update the Slack message to confirm the action
    await fetch(payload.response_url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        replace_original: true,
        text: approved
          ? `✅ Lead approved by ${userName}`
          : `❌ Lead skipped by ${userName}`,
      }),
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Approval route error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}