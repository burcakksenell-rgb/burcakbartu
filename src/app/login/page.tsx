'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { loadDB } from '@/lib/data'

export const runtime = 'nodejs'

export default function LoginPage() {
  const router = useRouter()
  const [selected, setSelected] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { admins } = loadDB()

  const login = () => {
    const admin = admins.find(a => a.id === selected)
    if (!admin) { setError('Lütfen bir kullanıcı seçin'); return }
    if (admin.password !== password) { setError('Şifre yanlış'); setPassword(''); return }
    setLoading(true)
    localStorage.setItem('weddingAdminId', admin.id)
    router.push('/admin')
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--iv)', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 360, background: 'var(--wh)', border: '1px solid var(--bd)', borderRadius: 14, padding: '36px 28px', textAlign: 'center' }}>
        <div style={{ fontFamily: 'Georgia,serif', fontSize: 24, color: 'var(--dp)', marginBottom: 4 }}>Düğün Admin</div>
        <div style={{ fontSize: 12, color: 'var(--mt)', marginBottom: 32 }}>Bartu &amp; Burçak · 25 Temmuz 2026</div>

        <div style={{ marginBottom: 16, textAlign: 'left' }}>
          <label style={{ display: 'block', fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase' as const, color: 'var(--tp)', marginBottom: 8 }}>Kim giriş yapıyor?</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {admins.map(a => (
              <button key={a.id} onClick={() => { setSelected(a.id); setError('') }}
                style={{ padding: '13px 8px', border: `2px solid ${selected === a.id ? a.color : 'var(--bd)'}`, borderRadius: 8, background: selected === a.id ? `${a.color}22` : 'var(--iv)', cursor: 'pointer', fontSize: 15, fontWeight: 500, color: 'var(--dp)', transition: 'all .15s', fontFamily: 'Georgia,serif' }}>
                {a.displayName}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 16, textAlign: 'left' }}>
          <label style={{ display: 'block', fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase' as const, color: 'var(--tp)', marginBottom: 6 }}>Şifre</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && login()} placeholder="••••••••"
            style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--br)', borderRadius: 6, fontSize: 14, color: 'var(--dp)', background: 'var(--wh)', outline: 'none' }} />
        </div>

        {error && <p style={{ fontSize: 12, color: '#A32D2D', marginBottom: 12 }}>{error}</p>}

        <button onClick={login} disabled={loading}
          style={{ width: '100%', padding: 13, background: 'var(--dp)', color: '#FAF8F3', border: 'none', borderRadius: 6, fontSize: 13, letterSpacing: '.06em', cursor: 'pointer', opacity: loading ? .7 : 1 }}>
          {loading ? 'Yükleniyor...' : 'Giriş Yap'}
        </button>

        <p style={{ marginTop: 20, fontSize: 11, color: 'var(--mt)', lineHeight: 1.7 }}>
          Her kişi sadece kendi listesini görür.<br />
          Mesajlar kendi telefonundan gider.
        </p>
      </div>
    </div>
  )
}
