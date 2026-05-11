'use client'

import { useMemo, useRef, useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { type RsvpStatus, type Guest, type TableItem, type WeddingSettings } from '@/lib/data'



export const runtime = 'nodejs'

const GALLERY_KEY = 'weddingGuestGallery_v1'

type GuestStep = 'home' | 'attendance' | 'details' | 'table' | 'gallery'

const formatDate = (value: string) => {
  if (!value) return ''
  const d = new Date(`${value}T12:00:00`)
  if (Number.isNaN(d.getTime())) return value
  return new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' }).format(d)
}

function RSVPContent() {
  const params = useSearchParams()
  const token = params.get('g') || ''
  const [guest, setGuest] = useState<Guest | null>(null)
  const [seatMates, setSeatMates] = useState<Guest[]>([])
  const [settings, setSettings] = useState<WeddingSettings | null>(null)
  const [tables, setTables] = useState<TableItem[]>([])
  const [notFound, setNotFound] = useState(false)
  const [boot, setBoot] = useState(true)
  const [step, setStep] = useState<GuestStep>('home')
  const [rsvpStatus, setRsvpStatus] = useState<RsvpStatus>('confirmed')
  const [partyCount, setPartyCount] = useState(2)
  const [galleryPhotos, setGalleryPhotos] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const table = useMemo(
    () => tables.find(t => t.id === guest?.tableId) || null,
    [tables, guest?.tableId],
  )
  const tableMates = useMemo(() => {
    if (!table || !guest) return []
    return seatMates.filter(g => g.tableId === table.id && g.id !== guest.id && g.status === 'confirmed')
  }, [seatMates, table, guest])

  useEffect(() => {
    if (!token) {
      setNotFound(true)
      setBoot(false)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`/api/wedding/rsvp?token=${encodeURIComponent(token)}`, { cache: 'no-store' })
        if (!res.ok) {
          if (!cancelled) setNotFound(true)
          return
        }
        const data = await res.json()
        if (cancelled) return
        const found = data.guest as Guest
        setGuest(found)
        setSettings(data.settings as WeddingSettings)
        setTables(data.tables as TableItem[])
        setSeatMates(Array.isArray(data.mates) ? data.mates : [])
        if (found.status !== 'pending') {
          setRsvpStatus(found.status)
          setPartyCount(found.partySize || 2)
        }
        if (typeof window !== 'undefined') {
          const saved = localStorage.getItem(GALLERY_KEY)
          if (saved) {
            try {
              const parsed = JSON.parse(saved)
              if (Array.isArray(parsed)) setGalleryPhotos(parsed.filter((x: unknown) => typeof x === 'string'))
            } catch { /* skip */ }
          }
        }
      } catch {
        if (!cancelled) setNotFound(true)
      } finally {
        if (!cancelled) setBoot(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [token])

  const submitAttendance = async () => {
    if (!guest || !token) return
    try {
      const res = await fetch('/api/wedding/rsvp', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          status: rsvpStatus,
          partySize: rsvpStatus === 'declined' ? 0 : partyCount,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        window.alert(typeof data.error === 'string' ? data.error : 'Katılım kaydedilemedi. Tekrar deneyin.')
        return
      }
      const updatedGuest = data.guest as Guest
      setGuest(updatedGuest)
      try {
        const r2 = await fetch(`/api/wedding/rsvp?token=${encodeURIComponent(token)}`, { cache: 'no-store' })
        if (r2.ok) {
          const d2 = await r2.json()
          setSeatMates(Array.isArray(d2.mates) ? d2.mates : [])
        }
      } catch {
        /* ignore */
      }
      setStep('details')
    } catch {
      window.alert('Bağlantı hatası. Tekrar deneyin.')
    }
  }

  const uploadPhoto = (file?: File | null) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result !== 'string') return
      const next = [reader.result, ...galleryPhotos].slice(0, 24)
      setGalleryPhotos(next)
      localStorage.setItem(GALLERY_KEY, JSON.stringify(next))
    }
    reader.readAsDataURL(file)
  }

  if (notFound) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', flexDirection: 'column', gap: 12, color: 'var(--mt)', padding: 24, textAlign: 'center' }}>
      <div style={{ fontFamily: 'Georgia,serif', fontSize: 22, color: 'var(--dp)' }}>Davetiye Bulunamadı</div>
      <p style={{ fontSize: 13 }}>Bu link geçersiz veya süresi dolmuş olabilir.</p>
    </div>
  )

  if (boot || !guest || !settings) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: 'var(--mt)' }}>Yükleniyor...</div>
    )
  }

  const fullDate = formatDate(settings.date)
  const firstName = guest.name.split(' ')[0]
  const backTarget: Record<GuestStep, GuestStep | null> = { home: null, attendance: 'home', details: 'attendance', table: 'details', gallery: 'table' }

  return (
    <div className="guest-flow">
      <div className="gf-shell">
        <div className="gf-top">
          {backTarget[step] ? (
            <button className="gf-back" onClick={() => setStep(backTarget[step] as GuestStep)}>
              ← {step === 'attendance' ? 'Ana Sayfa' : 'Geri'}
            </button>
          ) : (
            <span />
          )}
        </div>

        {step === 'home' && (
          <div className="gf-section home">
            <div className="gf-heart">♥</div>
            <h1>Hoş geldin, <span>{firstName}</span></h1>
            <p>{settings.name1} &amp; {settings.name2} düğünü için seni aramızda görmekten mutluluk duyacağız</p>
            <div className="gf-meta">
              <div>📅 {fullDate}</div>
              <div>📍 {settings.venue}</div>
            </div>
            <button className="gf-primary" onClick={() => setStep('attendance')}>Katılımını Bildir</button>
            <small>Yanıtını iletmek sadece 30 saniye</small>
          </div>
        )}

        {step === 'attendance' && (
          <div className="gf-section">
            <h2>Katılım Durumu</h2>
            <p>Bize katılıp katılmayacağını bildir</p>

            <button className={`att-card ${rsvpStatus === 'confirmed' ? 'ok active' : ''}`} onClick={() => setRsvpStatus('confirmed')}>
              <span>✓</span> Katılıyorum
            </button>
            <button className={`att-card ${rsvpStatus === 'declined' ? 'no active' : ''}`} onClick={() => setRsvpStatus('declined')}>
              <span>✕</span> Katılamıyorum
            </button>
            <button className={`att-card ${rsvpStatus === 'maybe' ? 'maybe active' : ''}`} onClick={() => setRsvpStatus('maybe')}>
              <span>?</span> Belki
            </button>

            {rsvpStatus !== 'declined' && (
              <div className="gf-counter">
                <div>Kaç kişi katılacaksınız?</div>
                <div className="cnt-row">
                  <button onClick={() => setPartyCount(Math.max(1, partyCount - 1))}>−</button>
                  <strong>{partyCount}</strong>
                  <button onClick={() => setPartyCount(Math.min(10, partyCount + 1))}>+</button>
                </div>
              </div>
            )}
            <button className="gf-primary" onClick={submitAttendance}>Devam Et</button>
          </div>
        )}

        {step === 'details' && (
          <div className="gf-section">
            <h2>Düğün Bilgileri</h2>
            <p>Etkinlik detayları ve program</p>

            <div className="info-card">
              <h3>Mekan</h3>
              <strong>{settings.venue}</strong>
              <span>{settings.address}</span>
              <button onClick={() => window.open(settings.mapUrl, '_blank')}>Haritada Aç →</button>
            </div>
            <div className="info-card purple">
              <h3>Tarih</h3>
              <strong>{fullDate}</strong>
            </div>
            <div className="info-card">
              <h3>Dress Code</h3>
              <strong>Formal / Kokteyl</strong>
              <span>Zarif ve şık</span>
            </div>

            <div className="program-card">
              <h3>Program</h3>
              {[
                ['17:00', 'Davetli Girişi'],
                ['17:30', 'Kokteyl & Karşılama'],
                ['18:30', 'Nikah Töreni'],
                ['19:30', 'Akşam Yemeği'],
                ['21:00', 'Pasta ve Eğlence'],
              ].map(([time, label]) => (
                <div key={time} className="row"><strong>{time}</strong><span>{label}</span></div>
              ))}
            </div>

            <button className="gf-primary" onClick={() => setStep('table')}>Masa Görüntüle</button>
          </div>
        )}

        {step === 'table' && (
          <div className="gf-section">
            <h2>Masa Ataması</h2>
            <p>Düğündeki masa bilgileriniz</p>

            <div className="table-box">
              <div className="pin">📍</div>
              <span>Masanız</span>
              <strong>{table?.name || 'Henüz belli değil'}</strong>
              <small>{table ? `${table.seats} kişilik masa` : 'Masa ataması yakında paylaşılacak'}</small>
            </div>

            <h3 className="subhead">Masa Arkadaşlarınız</h3>
            <div className="mates">
              {tableMates.length === 0 && <div className="mate-row">Şu an sadece sen görünüyorsun</div>}
              {tableMates.map(m => (
                <div className="mate-row" key={m.id}>
                  <div className="avatar">{m.name.charAt(0).toUpperCase()}</div>
                  <div><strong>{m.name}</strong><span>{Math.max(1, m.partySize)} kişi</span></div>
                </div>
              ))}
            </div>

            <button className="gf-secondary" onClick={() => setStep('gallery')}>Fotoğraf Galerisine Git</button>
          </div>
        )}

        {step === 'gallery' && (
          <div className="gf-section">
            <h2>Fotoğraf Galerisi</h2>
            <p>Anılarınızı bizimle paylaşın</p>

            <div className="upload-card">
              <div className="cam">📷</div>
              <strong>Fotoğraf Yükle</strong>
              <span>Düğün anılarınızı bizimle paylaşın</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={e => uploadPhoto(e.target.files?.[0])}
              />
              <button onClick={() => fileInputRef.current?.click()}>Fotoğraf Seç</button>
            </div>

            <h3 className="subhead">Paylaşılan Fotoğraflar</h3>
            {galleryPhotos.length === 0 && (
              <div className="empty-photos">Henüz fotoğraf yüklenmedi · İlk fotoğrafı siz paylaşın!</div>
            )}
            {galleryPhotos.length > 0 && (
              <div className="photo-grid">
                {galleryPhotos.map((src, idx) => <img key={`${src}-${idx}`} src={src} alt={`Galeri fotoğrafı ${idx + 1}`} />)}
              </div>
            )}

            <button className="gf-secondary" onClick={() => setStep('home')}>Ana Sayfaya Dön</button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function RSVPPage() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: 'var(--mt)' }}>Yükleniyor...</div>}>
      <RSVPContent />
    </Suspense>
  )
}
