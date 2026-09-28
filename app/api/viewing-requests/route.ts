import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit, clientIp, isHoneypotTripped } from '@/lib/rate-limit'

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  if (isHoneypotTripped(body)) return NextResponse.json({ ok: true })

  const ip = clientIp(request)
  const limit = rateLimit(`viewing:${ip}`, 5, 10 * 60 * 1000)
  if (!limit.ok) return NextResponse.json({ error: 'Trop de demandes envoyées. Réessayez plus tard.' }, { status: 429 })

  if (!body?.propertyId || !body?.name || !body?.email || !/^\S+@\S+\.\S+$/.test(body.email)) return NextResponse.json({ error: 'Informations invalides' }, { status: 400 })
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: property } = await (supabase.from('properties') as any).select('agent_id, owner_id').eq('id', body.propertyId).maybeSingle()
  const ownerId = property?.owner_id ?? property?.agent_id ?? null
  const { error } = await (supabase.from('viewing_requests') as any).insert({ user_id: user?.id ?? null, created_by: user?.id ?? null, owner_id: ownerId, property_id: body.propertyId, name: String(body.name).slice(0, 120), email: String(body.email).slice(0, 200), phone: body.phone ? String(body.phone).slice(0, 40) : null, requested_date: body.date || null, message: body.message ? String(body.message).slice(0, 2000) : null })
  if (error) return NextResponse.json({ error: 'Impossible d’enregistrer la demande de visite' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
