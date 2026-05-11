import { NextResponse } from 'next/server'
import { readLoginOptions } from '@/lib/wedding-repository'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Şifresiz liste — hangi kullanıcı ile girileceği için. DB hata verse bile bartu/burçak seçenekleri döner. */
export async function GET() {
  const { admins, dbOk } = await readLoginOptions()
  return NextResponse.json({ admins, dbOk })
}
