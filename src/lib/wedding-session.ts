import { createHmac, timingSafeEqual } from 'crypto'
import { getAdminCookieSecret } from '@/lib/admin-password'

export const WEDDING_SESSION_COOKIE = 'wedding_admin_session'

export function encodeAdminSession(adminId: string): string {
  const secret = getAdminCookieSecret()
  const sig = createHmac('sha256', secret).update(adminId).digest('hex')
  return `${adminId}:${sig}`
}

/** Geçersiz oturumsa null döner. */
export function decodeAdminSession(raw: string | undefined): string | null {
  if (!raw || !raw.includes(':')) return null
  const secret = getAdminCookieSecret()
  const sep = raw.indexOf(':')
  const adminId = raw.slice(0, sep)
  const sig = raw.slice(sep + 1)
  if (!adminId || adminId.length > 128 || !/^[a-zA-Z0-9_-]+$/.test(adminId) || sig.length !== 64) return null
  try {
    const exp = createHmac('sha256', secret).update(adminId).digest('hex')
    if (timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(exp, 'hex'))) return adminId
  } catch {
    /* length mismatch timingSafeEqual */
  }
  return null
}
