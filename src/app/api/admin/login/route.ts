import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { readLoginOptions } from '@/lib/wedding-repository'
import { matchesAdminLoginPassword } from '@/lib/admin-password'
import { encodeAdminSession, WEDDING_SESSION_COOKIE } from '@/lib/wedding-session'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const id = typeof body?.id === 'string' ? body.id : ''
    const password = typeof body?.password === 'string' ? body.password : ''
    if (!id || !password) return NextResponse.json({ error: 'Eksik bilgi' }, { status: 400 })

    const { admins } = await readLoginOptions()
    if (!admins.some(a => a.id === id)) {
      return NextResponse.json({ error: 'Şifre veya kullanıcı hatalı' }, { status: 401 })
    }

    if (!matchesAdminLoginPassword(password)) {
      return NextResponse.json({ error: 'Şifre veya kullanıcı hatalı' }, { status: 401 })
    }

    const token = encodeAdminSession(id)
    cookies().set(WEDDING_SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    })
    return NextResponse.json({ ok: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Giriş hatası'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
