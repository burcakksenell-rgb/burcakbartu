import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { WEDDING_SESSION_COOKIE } from '@/lib/wedding-session'

export const runtime = 'nodejs'

export async function DELETE() {
  cookies().delete({ name: WEDDING_SESSION_COOKIE, path: '/' })
  return NextResponse.json({ ok: true })
}
