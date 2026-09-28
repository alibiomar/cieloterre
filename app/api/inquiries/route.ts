import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { rateLimit, clientIp, isHoneypotTripped } from '@/lib/rate-limit'

const inquirySchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(320),
  message: z.string().trim().min(1).max(4000),
  phone: z.string().trim().max(40).optional(),
  propertyId: z.string().uuid().nullable().optional(),
})

export async function POST(request: Request) {
  const raw = await request.json().catch(() => null)
  // Honeypot: real visitors never populate this hidden field. Bots that
  // blindly fill every input do — silently accept without writing anything.
  if (isHoneypotTripped(raw)) return NextResponse.json({ ok: true })

  const ip = clientIp(request)
  const limit = rateLimit(`inquiry:${ip}`, 5, 10 * 60 * 1000)
  if (!limit.ok) return NextResponse.json({ error: 'Trop de demandes envoyées. Réessayez plus tard.' }, { status: 429 })

  const parsed = inquirySchema.safeParse(raw)
  if (!parsed.success) return NextResponse.json({ error: 'Informations invalides' }, { status: 400 })
  const body = parsed.data
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  let ownerId: string | null = null
  if (body.propertyId) {
    const { data: property } = await (supabase.from('properties') as any).select('agent_id, owner_id').eq('id', body.propertyId).maybeSingle()
    ownerId = property?.owner_id ?? property?.agent_id ?? null
  }
  const { error } = await (supabase.from('inquiries') as any).insert({ user_id: user?.id ?? null, created_by: user?.id ?? null, owner_id: ownerId, property_id: body.propertyId ?? null, name: body.name, email: body.email, phone: body.phone ?? null, message: body.message })
  if (error) return NextResponse.json({ error: 'Impossible d’enregistrer votre demande' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
