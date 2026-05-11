'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { INVITE_IMG, WEDDING_CONFIG } from '@/lib/config'
import { loadDB, saveDB, STATUS_CONFIG, type RsvpStatus, type Guest } from '@/lib/data'

export const runtime = 'nodejs'

function RSVPContent() {
  const params = useSearchParams()
  const token = params.get('g') || ''
  const [guest, setGuest] = useState<Guest | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [step, setStep] = useState<'invite' | 'form' | 'confirm'>('invite')
  const [rsvpStatus, setRsvpStatus] = useState<RsvpStatus>('confirmed')
  const [partyCount, setPartyCount] = useState(2)
  const [note, setNote] = useState('')
  const cfg = WEDDING_CONFIG

  useEffect(() => {
    if (!token) { setNotFound(true); return }
    const { guests } = loadDB()
    const found = guests.find(g => g.token === token)
    if (!found) { setNotFound(true); return }
    setGuest(found)
    if (found.status !== 'pending') {
      setRsvpStatus(found.status)
      setPartyCount(found.partySize || 2)
      setNote(found.note || '')
    }
  }, [token])

  const submit = () => {
    const { guests, settings, admins, tables } = loadDB()
    const updated = guests.map(g => g.token === token
      ? { ...g, status: rsvpStatus, partySize: rsvpStatus === 'declined' ? 0 : partyCount, note, respondedAt: new Date().toISOString().slice(0, 10) }
      : g)
    saveDB(updated, settings, admins, tables)
    setStep('confirm')
  }

  if (notFound) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', flexDirection: 'column', gap: 12, color: 'var(--mt)', padding: 24, textAlign: 'center' }}>
      <div style={{ fontFamily: 'Georgia,serif', fontSize: 22, color: 'var(--dp)' }}>Davetiye Bulunamadı</div>
      <p style={{ fontSize: 13 }}>Bu link geçersiz veya süresi dolmuş olabilir.</p>
    </div>
  )

  if (!guest) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: 'var(--mt)' }}>Yükleniyor...</div>
  )

  if (step === 'invite') return (
    <div style={{ maxWidth: 480, margin: '0 auto' }}>
      <div className="g-hero">
        <img src={INVITE_IMG} alt="Düğün Davetiyesi" />
        <div className="g-names">{cfg.couple.name1} <span className="g-amp">&amp;</span> {cfg.couple.name2}</div>
        <div className="g-divider"><span /><em>✦</em><span /></div>
        <div className="g-date">{cfg.date} · {cfg.dayOfWeek} · {cfg.time}</div>
      </div>
      <div className="g-body">
        <p className="g-greeting">Sevgili {guest.name},</p>
        <p>Bu mutlu günümüzde sizleri de aramızda görmekten mutluluk duyarız.</p>
        <div className="venue-card">
          <div className="venue-label">Mekan</div>
          <div className="venue-name">{cfg.venue}</div>
          <div className="venue-addr">{cfg.address} · Saat {cfg.time}</div>
        </div>
        <div className="note-card">{cfg.note}</div>
        {guest.status !== 'pending' && (
          <div style={{ background: 'var(--bl)', border: '1px solid var(--br)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 12 }}>
            Mevcut yanıtınız: <span className={`badge ${STATUS_CONFIG[guest.status].cls}`} style={{ marginLeft: 4 }}>{STATUS_CONFIG[guest.status].label}</span>
            <span style={{ color: 'var(--tp)', marginLeft: 6 }}>(Değiştirebilirsiniz)</span>
          </div>
        )}
        <button className="btn-primary" onClick={() => setStep('form')}>
          {guest.status !== 'pending' ? 'Yanıtımı Güncelle' : 'Katılım Durumumu Bildir'}
        </button>
        <button className="btn-secondary" onClick={() => window.open(cfg.mapUrl, '_blank')}>Haritada Göster</button>
      </div>
    </div>
  )

  if (step === 'form') return (
    <div style={{ maxWidth: 480, margin: '0 auto' }}>
      <div className="rsvp-header">
        <h2>Katılım Bildirimi</h2>
        <p>{cfg.couple.name1} &amp; {cfg.couple.name2} · {cfg.date}</p>
      </div>
      <div className="rsvp-body">
        <span className="field-label">Katılım durumunuz</span>
        {(['confirmed', 'declined', 'maybe'] as RsvpStatus[]).map(s => {
          const m: Record<string, [string, string, string]> = {
            confirmed: ['💍', 'Katılıyorum', 'Orada olacağım'],
            declined:  ['💌', 'Katılamıyorum', 'Maalesef bulunamayacağım'],
            maybe:     ['🕊️', 'Belki', 'Henüz emin değilim'],
          }
          const [icon, title, sub] = m[s]
          return (
            <div key={s} className={`rsvp-option${rsvpStatus === s ? ' selected' : ''}`} onClick={() => setRsvpStatus(s)}>
              <div className="opt-icon">{icon}</div>
              <div className="opt-text"><div className="opt-title">{title}</div><div className="opt-sub">{sub}</div></div>
              <div className="opt-check">✓</div>
            </div>
          )
        })}

        {rsvpStatus !== 'declined' && (
          <div style={{ marginBottom: 22 }}>
            <span className="field-label">Kaç kişi geleceksiniz?</span>
            <div className="party-row">
              <button className="party-btn" onClick={() => setPartyCount(Math.max(1, partyCount - 1))}>−</button>
              <div className="party-label">Kişi sayısı</div>
              <div className="party-num">{partyCount}</div>
              <button className="party-btn" onClick={() => setPartyCount(Math.min(10, partyCount + 1))}>+</button>
            </div>
          </div>
        )}

        <span className="field-label">Notunuz (isteğe bağlı)</span>
        <textarea className="note-input" rows={3} value={note} onChange={e => setNote(e.target.value)} placeholder="Bir mesaj bırakmak ister misiniz?" />
        <button className="btn-primary" onClick={submit}>RSVP&apos;yi Gönder</button>
        <button className="btn-secondary" style={{ marginTop: 10 }} onClick={() => setStep('invite')}>← Geri Dön</button>
      </div>
    </div>
  )

  return (
    <div style={{ maxWidth: 480, margin: '0 auto' }}>
      <div className="confirm-page">
        <div className="confirm-icon">✦</div>
        <h2>Teşekkürler!</h2>
        <p>Katılım durumunuz kaydedildi. Sizi görmekten çok mutlu olacağız.</p>
        <div className="venue-card" style={{ width: '100%', textAlign: 'left', marginBottom: 18 }}>
          <div className="venue-label">Hatırlatma</div>
          <div className="venue-name">{cfg.date} — Saat {cfg.time}</div>
          <div className="venue-addr">{cfg.venue}, {cfg.address}</div>
        </div>
        <div style={{ background: 'var(--bl)', border: '1px solid var(--br)', borderRadius: 8, padding: '12px 16px', width: '100%', marginBottom: 16, textAlign: 'left' }}>
          <div style={{ fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase' as const, color: 'var(--tp)', marginBottom: 4 }}>Yanıtınız</div>
          <span className={`badge ${STATUS_CONFIG[rsvpStatus].cls}`}>{STATUS_CONFIG[rsvpStatus].label}</span>
          {rsvpStatus !== 'declined' && <span style={{ fontSize: 12, color: 'var(--mt)', marginLeft: 8 }}>{partyCount} kişi</span>}
        </div>
        <button className="btn-secondary" style={{ width: '100%' }} onClick={() => setStep('invite')}>Daveti Tekrar Görüntüle</button>
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
