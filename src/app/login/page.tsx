'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export const runtime = 'nodejs'

type LoginOpt = { id: string; displayName: string; color: string }

export default function LoginPage() {
  const router = useRouter()
  const [admins, setAdmins] = useState<LoginOpt[]>([])
  const [selected, setSelected] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loadingList, setLoadingList] = useState(true)
  const [loggingIn, setLoggingIn] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/wedding/login-options', { cache: 'no-store' })
        const data = await res.json()
        if (cancelled) return
        if (!res.ok) {
          setError(typeof data.error === 'string' ? data.error : 'Sunucuya bağlanılamadı')
          return
        }
        setAdmins(data.admins || [])
      } catch {
        if (!cancelled) setError('Sunucuya bağlanılamadı · .env yapılandırmasını kontrol edin')
      } finally {
        if (!cancelled) setLoadingList(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const login = async () => {
    const admin = admins.find(a => a.id === selected)
    if (!admin) {
      setError('Lütfen bir kullanıcı seçin')
      return
    }
    setLoggingIn(true)
    setError('')
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id: selected, password }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(typeof data.error === 'string' ? data.error : 'Giriş başarısız')
        setPassword('')
        setLoggingIn(false)
        return
      }
      router.push('/admin')
    } catch {
      setError('Bağlantı hatası')
      setLoggingIn(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--iv)', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 360, background: 'var(--wh)', border: '1px solid var(--bd)', borderRadius: 14, padding: '36px 28px', textAlign: 'center' }}>
        <div style={{ fontFamily: 'Georgia,serif', fontSize: 24, color: 'var(--dp)', marginBottom: 4 }}>Düğün Admin</div>
        <div style={{ fontSize: 12, color: 'var(--mt)', marginBottom: 32 }}>Bartu veya Burçak · Tek şifre: <strong>burcak2026</strong></div>

        {loadingList && <p style={{ fontSize: 12, color: 'var(--mt)' }}>Kullanıcılar yükleniyor...</p>}
        {!loadingList && admins.length === 0 && !error && <p style={{ fontSize: 12, color: 'var(--mt)' }}>Yönetici bulunamadı.</p>}

        <div style={{ marginBottom: 16, textAlign: 'left' }}>
          <label style={{ display: 'block', fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase' as const, color: 'var(--tp)', marginBottom: 8 }}>Kim giriş yapıyor?</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {admins.map(a => (
              <button key={a.id} type="button" onClick={() => { setSelected(a.id); setError('') }}
                style={{ padding: '13px 8px', border: `2px solid ${selected === a.id ? a.color : 'var(--bd)'}`, borderRadius: 8, background: selected === a.id ? `${a.color}22` : 'var(--iv)', cursor: 'pointer', fontSize: 15, fontWeight: 500, color: 'var(--dp)', transition: 'all .15s', fontFamily: 'Georgia,serif' }}>
                {a.displayName}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 16, textAlign: 'left' }}>
          <label style={{ display: 'block', fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase' as const, color: 'var(--tp)', marginBottom: 6 }}>Şifre</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && void login()} placeholder="••••••••"
            style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--br)', borderRadius: 6, fontSize: 14, color: 'var(--dp)', background: 'var(--wh)', outline: 'none' }} />
        </div>

        {error && <p style={{ fontSize: 12, color: '#A32D2D', marginBottom: 12 }}>{error}</p>}

        <button type="button" onClick={() => void login()} disabled={loggingIn || loadingList}
          style={{ width: '100%', padding: 13, background: 'var(--dp)', color: '#FAF8F3', border: 'none', borderRadius: 6, fontSize: 13, letterSpacing: '.06em', cursor: 'pointer', opacity: loadingList || loggingIn ? .7 : 1 }}>
          {loggingIn ? 'Yükleniyor...' : 'Giriş Yap'}
        </button>

        <p style={{ marginTop: 20, fontSize: 11, color: 'var(--mt)', lineHeight: 1.7 }}>
          Her kişi sadece kendi listesini görür.<br />
          RSVP yanıtları Supabase üzerinde saklanır.
        </p>
      </div>
    </div>
  )
}
