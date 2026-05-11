import { NextResponse } from 'next/server'
import { fetchGuestPublicBundle, updateGuestRsvp } from '@/lib/wedding-repository'
import type { RsvpStatus } from '@/lib/data'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get('token')?.trim() || ''
  if (!token) return NextResponse.json({ error: 'token zorunlu' }, { status: 400 })
  try {
    const bundle = await fetchGuestPublicBundle(token)
    if (!bundle) return NextResponse.json({ error: 'bulunamadı' }, { status: 404 })
    const { guest, settings, tables, mates } = bundle
    return NextResponse.json({ guest, settings, tables, mates })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Sunucu hatası'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

const STATUSES = new Set(['confirmed', 'declined', 'pending', 'maybe'])

export async function PATCH(req: Request) {
  try {
    const body = await req.json()
    const token = typeof body?.token === 'string' ? body.token.trim() : ''
    const status = body?.status as RsvpStatus
    const partySize = typeof body?.partySize === 'number' ? body.partySize : Number(body?.partySize)
    if (!token || !STATUSES.has(status)) {
      return NextResponse.json({ error: 'Geçersiz parametreler' }, { status: 400 })
    }
    if (Number.isNaN(partySize) || partySize < 0) {
      return NextResponse.json({ error: 'Kişi sayısı geçersiz' }, { status: 400 })
    }
    const updated = await updateGuestRsvp(token, {
      status,
      partySize: status === 'declined' ? 0 : partySize,
    })
    if (!updated) return NextResponse.json({ error: 'Davetiye bulunamadı' }, { status: 404 })
    return NextResponse.json({ guest: updated })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Kayıt başarısız'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
