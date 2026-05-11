/** Tek admin giriş şifresi (Bartu / Burçak seçimi için aynı). */
export function getAdminLoginPassword(): string {
  const p = process.env.WEDDING_ADMIN_PASSWORD
  return p != null && p.trim() !== '' ? p.trim() : 'burcak2026'
}

export function matchesAdminLoginPassword(candidate: string): boolean {
  return candidate === getAdminLoginPassword()
}

/** Çerez HMAC için aynı giz — ayrı env gerekmez. */
export function getAdminCookieSecret(): string {
  return `${getAdminLoginPassword()}::wedding-admin-cookie-v1`
}
