import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { readFullState, writeFullState, type FullWeddingState } from '@/lib/wedding-repository'
import { decodeAdminSession, WEDDING_SESSION_COOKIE } from '@/lib/wedding-session'
import type { AdminUser, Guest, TableItem, WeddingSettings } from '@/lib/data'

export const runtime = 'nodejs'

function getSessionAdminId(): string | null {
  const raw = cookies().get(WEDDING_SESSION_COOKIE)?.value
  return decodeAdminSession(raw)
}

export async function GET() {
  const adminId = getSessionAdminId()
  if (!adminId) return NextResponse.json({ error: 'Oturum yok' }, { status: 401 })
  try {
    const full = await readFullState()
    return NextResponse.json({ ...full, currentAdminId: adminId })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Sunucu hatası'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  const adminId = getSessionAdminId()
  if (!adminId) return NextResponse.json({ error: 'Oturum yok' }, { status: 401 })

  try {
    const body = await req.json()
    const guests = Array.isArray(body?.guests) ? (body.guests as Guest[]) : null
    const settings = body?.settings as WeddingSettings | undefined
    const admins = Array.isArray(body?.admins) ? (body.admins as AdminUser[]) : null
    const tables = Array.isArray(body?.tables) ? (body.tables as TableItem[]) : null
    if (!guests || !settings || !admins || !tables) {
      return NextResponse.json({ error: 'Geçersiz veri' }, { status: 400 })
    }
    const patch: FullWeddingState = { guests, settings, admins, tables }
    await writeFullState(patch)
    return NextResponse.json({ ok: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Kayıt başarısız'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
