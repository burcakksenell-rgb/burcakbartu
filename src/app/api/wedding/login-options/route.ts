import { NextResponse } from 'next/server'
import { readLoginOptions } from '@/lib/wedding-repository'

export const runtime = 'nodejs'

/** Şifresiz liste — hangi kullanıcı ile girileceği için. */
export async function GET() {
  try {
    const admins = await readLoginOptions()
    return NextResponse.json({ admins })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Okuma hatası'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
