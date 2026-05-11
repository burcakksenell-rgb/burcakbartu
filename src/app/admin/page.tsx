'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  exportGuestsCSV, buildLink, buildWAMessage,
  getStats, generateToken, STATUS_CONFIG, TABLE_COLORS, DEFAULT_SETTINGS,
  type Guest, type RsvpStatus, type WeddingSettings, type AdminUser, type TableItem,
} from '@/lib/data'
import { INVITE_IMG } from '@/lib/config'

export const runtime = 'nodejs'

type NavKey = 'dashboard' | 'guests' | 'whatsapp' | 'tables' | 'preview' | 'settings'

export default function AdminPage() {
  const router = useRouter()
  const [admin, setAdmin] = useState<AdminUser | null>(null)
  const [allGuests, setAllGuests] = useState<Guest[]>([])
  const [tables, setTables] = useState<TableItem[]>([])
  const [settings, setSettings] = useState<WeddingSettings>(DEFAULT_SETTINGS)
  const [localSettings, setLocalSettings] = useState<WeddingSettings>(DEFAULT_SETTINGS)
  const [admins, setAdmins] = useState<AdminUser[]>([])
  const [nav, setNav] = useState<NavKey>('dashboard')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [modal, setModal] = useState<null | 'add' | 'wa' | 'delete' | 'editTable'>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [waGuest, setWaGuest] = useState<Guest | null>(null)
  const [form, setForm] = useState({ name: '', phone: '', status: 'pending' as RsvpStatus, partySize: '2', note: '' })
  const [toast, setToast] = useState({ show: false, msg: '' })
  const [tableForm, setTableForm] = useState({ id: '', name: '', seats: '8', colorIdx: 0 })
  const [dragGuestId, setDragGuestId] = useState<string | null>(null)
  const [tableCounter, setTableCounter] = useState(6)
  const [bootstrap, setBootstrap] = useState(true)

  const showToast = (msg: string) => {
    setToast({ show: true, msg })
    setTimeout(() => setToast({ show: false, msg: '' }), 2600)
  }

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/wedding/state', { credentials: 'include', cache: 'no-store' })
        if (res.status === 401) {
          router.push('/login')
          return
        }
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          showToast(typeof err.error === 'string' ? err.error : 'Veri yüklenemedi · .env / Supabase')
          router.push('/login')
          return
        }
        const json = await res.json()
        if (cancelled) return
        const me = (json.admins as AdminUser[]).find(x => x.id === json.currentAdminId)
        if (!me) {
          router.push('/login')
          return
        }
        setAdmin(me)
        setAllGuests(json.guests || [])
        setSettings(json.settings)
        setLocalSettings(json.settings)
        setAdmins(json.admins || [])
        setTables(json.tables || [])
        setTableCounter((json.tables?.length || 0) + 1)
      } catch {
        showToast('Sunucuya bağlanılamadı · ortam değişkenleri ve Supabase key')
        router.push('/login')
      } finally {
        if (!cancelled) setBootstrap(false)
      }
    })()
    return () => { cancelled = true }
  }, [router])

  const persist = useCallback(async (g: Guest[], s: WeddingSettings, a: AdminUser[], t: TableItem[]) => {
    setAllGuests(g); setSettings(s); setAdmins(a); setTables(t)
    try {
      const res = await fetch('/api/wedding/state', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guests: g, settings: s, admins: a, tables: t }),
      })
      const errBody = await res.json().catch(() => ({}))
      if (!res.ok) {
        showToast(typeof errBody.error === 'string' ? errBody.error : 'Supabase kaydı başarısız')
        return false
      }
      return true
    } catch {
      showToast('Ağ hatası — kayıt yapılamadı')
      return false
    }
  }, [showToast])

  const logout = async () => {
    await fetch('/api/admin/session', { method: 'DELETE', credentials: 'include' })
    router.push('/login')
  }

  if (bootstrap || !admin) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: 'var(--mt)' }}>
      Yükleniyor...
    </div>
  )

  const myGuests = allGuests.filter(g => g.ownerId === admin.id)
  const confirmedGuests = myGuests.filter(g => g.status === 'confirmed' && g.partySize > 0)
  const st = getStats(myGuests)
  const siteUrl = settings.siteUrl || (typeof window !== 'undefined' ? window.location.origin : '')

  const filtered = myGuests.filter(g => {
    const q = search.toLowerCase()
    return (!q || g.name.toLowerCase().includes(q) || g.phone.includes(q)) &&
           (statusFilter === 'all' || g.status === statusFilter)
  })

  // ── Guest CRUD ──
  const openAdd = () => { setEditId(null); setForm({ name: '', phone: '', status: 'pending', partySize: '2', note: '' }); setModal('add') }
  const openEdit = (g: Guest) => { setEditId(g.id); setForm({ name: g.name, phone: g.phone, status: g.status, partySize: String(g.partySize || 0), note: g.note || '' }); setModal('add') }
  const saveGuest = async () => {
    if (!form.name.trim() || !form.phone.trim()) { showToast('Ad ve telefon zorunlu!'); return }
    let updated: Guest[]
    if (editId) {
      updated = allGuests.map(g => g.id === editId ? { ...g, ...form, partySize: parseInt(form.partySize) || 0 } : g)
    } else {
      updated = [{ id: 'g' + Date.now(), name: form.name, phone: form.phone, status: form.status, partySize: parseInt(form.partySize) || 0, note: form.note, token: generateToken(), sentAt: null, respondedAt: null, ownerId: admin!.id, tableId: null }, ...allGuests]
    }
    const ok = await persist(updated, settings, admins, tables)
    if (!ok) return
    if (editId) showToast(`${form.name} güncellendi ✓`)
    else showToast(`${form.name} eklendi ✓`)
    setModal(null)
  }
  const deleteGuest = async () => {
    const ok = await persist(allGuests.filter(g => g.id !== deleteId), settings, admins, tables)
    if (!ok) return
    setModal(null); showToast('Misafir silindi')
  }
  const markSent = async (id: string) => {
    const ok = await persist(allGuests.map(g => g.id === id ? { ...g, sentAt: new Date().toISOString().slice(0, 10) } : g), settings, admins, tables)
    if (!ok) return
    showToast('Gönderildi ✓')
  }
  const copy = (txt: string, msg = 'Kopyalandı!') => navigator.clipboard.writeText(txt).then(() => showToast(msg)).catch(() => showToast('Kopyalanamadı'))
  const toWhatsAppPhone = (raw: string) => {
    const digits = raw.replace(/\D/g, '')
    if (!digits) return ''
    if (digits.startsWith('90')) return digits
    if (digits.startsWith('0')) return `90${digits.slice(1)}`
    return digits
  }

  // ── Tables ──
  const seatedAt = (tId: string) => allGuests.filter(g => g.tableId === tId).reduce((s, g) => s + (g.partySize || 0), 0)
  const initials = (name: string) => name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  const guestColor = (g: Guest) => TABLE_COLORS[(g.id.charCodeAt(1) || 0) % TABLE_COLORS.length]

  const onTableDrop = async (e: React.DragEvent, tId: string) => {
    e.preventDefault()
    if (!dragGuestId) return
    const g = allGuests.find(x => x.id === dragGuestId)
    const t = tables.find(x => x.id === tId)
    if (!g || !t) return
    if (seatedAt(tId) + g.partySize > t.seats) { showToast(`${t.name} dolu! (${seatedAt(tId)}/${t.seats})`); return }
    const ok = await persist(allGuests.map(x => x.id === dragGuestId ? { ...x, tableId: tId } : x), settings, admins, tables)
    if (ok) setDragGuestId(null)
  }
  const unassignGuest = async (gId: string) => {
    await persist(allGuests.map(x => x.id === gId ? { ...x, tableId: null } : x), settings, admins, tables)
  }
  const addTable = async () => {
    const id = 't' + Date.now().toString(36)
    const newT: TableItem = { id, name: `Masa ${tableCounter}`, seats: 8, x: 40 + (tables.length % 3) * 180, y: 40 + Math.floor(tables.length / 3) * 200, colorIdx: tables.length % TABLE_COLORS.length }
    const ok = await persist(allGuests, settings, admins, [...tables, newT])
    if (ok) setTableCounter(c => c + 1)
  }
  const removeTable = async (id: string) => {
    await persist(allGuests.map(g => g.tableId === id ? { ...g, tableId: null } : g), settings, admins, tables.filter(t => t.id !== id))
  }
  const openEditTable = (t: TableItem) => { setTableForm({ id: t.id, name: t.name, seats: String(t.seats), colorIdx: t.colorIdx }); setModal('editTable') }
  const saveTableEdit = async () => {
    const updated = tables.map(t => t.id === tableForm.id ? { ...t, name: tableForm.name, seats: parseInt(tableForm.seats) || 8, colorIdx: tableForm.colorIdx } : t)
    const ok = await persist(allGuests, settings, admins, updated)
    if (ok) setModal(null)
  }
  const autoAssign = async () => {
    let g = [...allGuests]
    confirmedGuests.filter(x => !x.tableId).forEach(guest => {
      const t = tables.find(t => seatedAt(t.id) + guest.partySize <= t.seats)
      if (t) g = g.map(x => x.id === guest.id ? { ...x, tableId: t.id } : x)
    })
    const ok = await persist(g, settings, admins, tables)
    if (ok) showToast('Otomatik yerleştirme tamamlandı ✓')
  }
  const exportSeating = () => {
    const lines = ['Masa Düzeni — Bartu & Burçak', '='.repeat(40), '']
    tables.forEach(t => {
      const sg = allGuests.filter(g => g.tableId === t.id)
      lines.push(`${t.name} (${seatedAt(t.id)}/${t.seats} koltuk)`)
      sg.forEach(g => lines.push(`  • ${g.name} (${g.partySize} kişi)`))
      lines.push('')
    })
    const un = confirmedGuests.filter(g => !g.tableId)
    if (un.length) { lines.push('Yerleştirilmeyenler:'); un.forEach(g => lines.push(`  • ${g.name}`)) }
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/plain' })); a.download = 'masa-duzeni.txt'; a.click()
  }

  const Badge = ({ status }: { status: RsvpStatus }) => {
    const s = STATUS_CONFIG[status] || STATUS_CONFIG.pending
    return <span className={`badge ${s.cls}`}>{s.label}</span>
  }

  const navLinks: { key: NavKey; label: string; icon: React.ReactNode }[] = [
    { key: 'dashboard', label: 'Özet',       icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> },
    { key: 'guests',    label: 'Misafirler', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
    { key: 'whatsapp',  label: 'WhatsApp',   icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
    { key: 'tables',    label: 'Masalar',    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg> },
    { key: 'preview',   label: 'Davetiye',   icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> },
    { key: 'settings',  label: 'Ayarlar',    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> },
  ]

  const placed = confirmedGuests.filter(g => g.tableId).reduce((s, g) => s + g.partySize, 0)
  const totalConfirmed = confirmedGuests.reduce((s, g) => s + g.partySize, 0)

  return (
    <div className="admin-layout">
      {/* SIDEBAR */}
      <nav className="sidebar">
        <div className="sb-brand">
          <div className="t1">Düğün Admin</div>
          <div className="t2" style={{ color: admin.color }}>● {admin.displayName}</div>
        </div>
        <div className="sb-nav">
          {navLinks.map(l => (
            <button key={l.key} className={`sb-link${nav === l.key ? ' active' : ''}`} onClick={() => setNav(l.key)}>
              {l.icon}{l.label}
            </button>
          ))}
        </div>
        <div className="sb-foot">
          <span style={{ display: 'block', marginBottom: 6 }}>{myGuests.length} misafir</span>
          <button onClick={logout} style={{ background: 'none', border: '1px solid rgba(255,255,255,.2)', color: 'rgba(255,255,255,.4)', borderRadius: 5, padding: '4px 10px', fontSize: 10, cursor: 'pointer' }}>
            Çıkış Yap
          </button>
        </div>
      </nav>

      <div className="admin-main">

        {/* ── DASHBOARD ── */}
        {nav === 'dashboard' && (
          <div>
            <div className="topbar">
              <div>
                <h1>Merhaba, {admin.displayName} 👋</h1>
                <div className="sub">{myGuests.length} davetli · {st.confirmed} katılıyor · {st.attendees} toplam kişi</div>
              </div>
              <button className="abtn abtn-p" onClick={() => { setNav('guests'); openAdd() }}>+ Misafir Ekle</button>
            </div>
            <div style={{ background: '#F0FBF4', border: '1px solid #B8E6C4', borderRadius: 9, padding: '13px 16px', marginBottom: 20, display: 'flex', gap: 12, alignItems: 'flex-start', fontSize: 12, color: '#2A6B3A', lineHeight: 1.65 }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>📱</span>
              <div><strong>WhatsApp:</strong> &ldquo;WA Aç&rdquo; butonuna bastığında <strong>senin telefonunda</strong> WhatsApp açılır, mesaj hazır gelir, sadece Gönder&apos;e basarsın. Mesaj <strong>senin numaranla</strong> gider.</div>
            </div>
            <div className="kpi-grid">
              {[
                { l: 'Davetlilerim',  v: st.total,     s: 'kişi',                      ac: true },
                { l: 'Katılıyor',     v: st.confirmed, s: `${st.attendees} kişi toplam`        },
                { l: 'Bekliyor',      v: st.pending,   s: 'yanıt yok'                          },
                { l: 'Katılamıyor',   v: st.declined,  s: 'kişi'                               },
                { l: 'Belki',         v: st.maybe,     s: 'kişi'                               },
                { l: 'Masaya Atandı', v: placed,       s: `${totalConfirmed - placed} bekliyor`},
              ].map(k => (
                <div key={k.l} className={`kpi-card${k.ac ? ' accent' : ''}`}>
                  <div className="kpi-l">{k.l}</div>
                  <div className="kpi-v">{k.v}</div>
                  <div className="kpi-s">{k.s}</div>
                </div>
              ))}
            </div>
            <div className="prog-wrap">
              <div style={{ fontSize: 12, color: 'var(--mt)' }}>
                Yanıt oranı &nbsp;<strong style={{ color: 'var(--dp)' }}>{st.total ? Math.round(((st.confirmed + st.declined + st.maybe) / st.total) * 100) : 0}%</strong>
              </div>
              <div className="prog-track">
                {([['#3B6D11', st.confirmed], ['#E24B4A', st.declined], ['#1D9E75', st.maybe]] as [string, number][]).map(([c, n]) => (
                  <div key={c} className="prog-bar" style={{ width: `${st.total ? Math.round((n / st.total) * 100) : 0}%`, background: c }} />
                ))}
              </div>
              <div className="prog-leg">
                {[['#3B6D11', 'Katılıyor', st.confirmed], ['#E24B4A', 'Katılamıyor', st.declined], ['#1D9E75', 'Belki', st.maybe], ['#C5A97A', 'Bekliyor', st.pending]].map(([c, l, n]) => (
                  <span key={String(l)}><span className="prog-dot" style={{ background: String(c) }} />{l}: {n}</span>
                ))}
              </div>
            </div>
            <div className="card">
              <div className="card-head">
                <span>Son Yanıtlar</span>
                <button className="abtn abtn-o" style={{ fontSize: 10, padding: '5px 10px' }} onClick={() => setNav('guests')}>Tümünü Gör →</button>
              </div>
              <table>
                <thead><tr><th>İsim</th><th>Durum</th><th>Kişi</th><th>Not</th></tr></thead>
                <tbody>
                  {myGuests.filter(g => g.respondedAt).slice(0, 6).map(g => (
                    <tr key={g.id}><td className="g-nm">{g.name}</td><td><Badge status={g.status} /></td><td style={{ color: 'var(--mt)', textAlign: 'center' }}>{g.partySize || '—'}</td><td style={{ fontSize: 11, color: 'var(--mt)', maxWidth: 160 }}>{g.note || '—'}</td></tr>
                  ))}
                  {myGuests.filter(g => g.respondedAt).length === 0 && (
                    <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--mt)', padding: 20 }}>Henüz yanıt yok</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── GUESTS ── */}
        {nav === 'guests' && (
          <div>
            <div className="topbar">
              <div><h1>Misafirlerim</h1><div className="sub">{filtered.length}/{myGuests.length} misafir · {st.confirmed} katılıyor · {st.attendees} toplam kişi</div></div>
              <button className="abtn abtn-p" onClick={openAdd}>+ Misafir Ekle</button>
            </div>
            <div className="toolbar">
              <div className="search-wrap">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="İsim veya telefon ara..." />
              </div>
              <select className="filter-sel" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="all">Tüm Durumlar</option>
                <option value="confirmed">Katılıyor</option>
                <option value="pending">Bekliyor</option>
                <option value="declined">Katılamıyor</option>
                <option value="maybe">Belki</option>
              </select>
              <button className="abtn abtn-o" onClick={() => exportGuestsCSV(myGuests, tables)}>↓ CSV</button>
            </div>
            <div className="card">
              <table>
                <thead><tr><th>İsim &amp; Telefon</th><th>Durum</th><th>Kişi</th><th>Masa</th><th>Not</th><th>Gönderildi</th><th>İşlemler</th></tr></thead>
                <tbody>
                  {filtered.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--mt)', padding: 24 }}>Misafir bulunamadı</td></tr>}
                  {filtered.map(g => {
                    const tbl = g.tableId ? tables.find(t => t.id === g.tableId) : null
                    return (
                      <tr key={g.id}>
                        <td><div className="g-nm">{g.name}</div><div className="g-ph">{g.phone}</div></td>
                        <td><Badge status={g.status} /></td>
                        <td style={{ textAlign: 'center', color: 'var(--mt)' }}>{g.partySize || '—'}</td>
                        <td style={{ fontSize: 11, color: 'var(--mt)' }}>{tbl?.name || '—'}</td>
                        <td style={{ fontSize: 11, color: 'var(--mt)', maxWidth: 130 }}>{g.note || '—'}</td>
                        <td style={{ textAlign: 'center' }}>
                          {g.sentAt ? <span style={{ fontSize: 10, color: '#3B6D11' }}>✓ {g.sentAt}</span> : <span style={{ fontSize: 10, color: 'var(--mt)' }}>—</span>}
                        </td>
                        <td>
                          <button className="ab" onClick={() => openEdit(g)} title="Düzenle">✎</button>
                          <button className="ab wa" onClick={() => { setWaGuest(g); setModal('wa') }} title="WhatsApp">W</button>
                          <button className="ab" onClick={() => copy(buildLink(g.token, siteUrl), 'RSVP linki kopyalandı!')} title="Link kopyala">🔗</button>
                          <button className="ab del" onClick={() => { setDeleteId(g.id); setModal('delete') }} title="Sil">✕</button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── WHATSAPP ── */}
        {nav === 'whatsapp' && (
          <div>
            <div className="topbar"><div><h1>WhatsApp Gönder</h1><div className="sub">Mesajlar senin telefonundan gider</div></div></div>
            <div style={{ background: '#F0FBF4', border: '1px solid #B8E6C4', borderRadius: 9, padding: '13px 16px', marginBottom: 18 }}>
              <div style={{ fontWeight: 600, color: '#2A6B3A', fontSize: 12, marginBottom: 8 }}>Nasıl Çalışır?</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[['1️⃣', '"WA Aç" butonuna bas', 'Telefonunda WhatsApp açılır'], ['2️⃣', 'Mesaj hazır gelir', 'Sadece metin + kişisel link'], ['3️⃣', 'Gönder\'e bas', 'Senin numaranla gider'], ['4️⃣', 'Misafir linke tıklar', 'Davetiye ve RSVP açılır']].map(([n, t, d]) => (
                  <div key={n} style={{ display: 'flex', gap: 8 }}><span style={{ fontSize: 14 }}>{n}</span><div><div style={{ fontSize: 11, fontWeight: 600, color: '#2A6B3A' }}>{t}</div><div style={{ fontSize: 11, color: '#4A8A5A' }}>{d}</div></div></div>
                ))}
              </div>
              <p style={{ fontSize: 11, color: '#4A8A5A', marginTop: 10, marginBottom: 0 }}>Instagram veya başka uygulamalar için mesaj kutusundan <strong>Mesajı Kopyala</strong> deyip yapıştırabilirsin.</p>
            </div>
            <div className="s-card" style={{ marginBottom: 16 }}>
              <h3>Mesaj Şablonu</h3>
              <textarea rows={6} value={settings.waTemplate} onChange={e => setSettings(s => ({ ...s, waTemplate: e.target.value }))}
                style={{ width: '100%', padding: 11, border: '1.5px solid var(--br)', borderRadius: 6, fontSize: 12, color: 'var(--dp)', background: 'var(--bl)', resize: 'vertical', lineHeight: 1.7, outline: 'none' }} />
              <p style={{ fontSize: 10, color: 'var(--mt)', marginTop: 6 }}>
                <strong>{'{AD}'}</strong> = misafir adı &nbsp;·&nbsp; <strong>{'{LINK}'}</strong> = kişisel davet/RSVP linki (WhatsApp, Instagram DM vb.) &nbsp;·&nbsp;
                <strong>{'{name1}'}</strong> / <strong>{'{name2}'}</strong> = çift isimleri &nbsp;·&nbsp; <strong>{'{IMAGE}'}</strong> <em>isteğe bağlı</em>
              </p>
              <button className="abtn abtn-p" style={{ marginTop: 10 }} onClick={() => void (async () => {
                const ok = await persist(allGuests, settings, admins, tables)
                if (ok) showToast('Şablon kaydedildi ✓')
              })()}>Şablonu Kaydet</button>
            </div>
            <div className="card">
              <table>
                <thead><tr><th>İsim</th><th>Telefon</th><th>Durum</th><th>Gönderildi</th><th>İşlemler</th></tr></thead>
                <tbody>
                  {myGuests.map(g => (
                    <tr key={g.id}>
                      <td className="g-nm">{g.name}</td>
                      <td style={{ fontSize: 11, color: 'var(--mt)' }}>{g.phone}</td>
                      <td><Badge status={g.status} /></td>
                      <td style={{ textAlign: 'center' }}>{g.sentAt ? <span style={{ fontSize: 10, color: '#3B6D11' }}>✓ {g.sentAt}</span> : <span style={{ fontSize: 10, color: 'var(--mt)' }}>—</span>}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <button className="abtn abtn-g" style={{ fontSize: 10, padding: '5px 9px', marginRight: 4 }} onClick={() => { setWaGuest(g); setModal('wa') }}>WA Aç</button>
                        <button className="abtn abtn-o" style={{ fontSize: 10, padding: '5px 8px', marginRight: 4 }} onClick={() => copy(buildLink(g.token, siteUrl), 'Link kopyalandı!')}>Link</button>
                        {!g.sentAt && <button className="abtn abtn-o" style={{ fontSize: 10, padding: '5px 8px', color: '#3B6D11', borderColor: '#3B6D11' }} type="button" onClick={() => void markSent(g.id)}>✓ Gönderildi</button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TABLES ── */}
        {nav === 'tables' && (
          <div>
            <div className="topbar">
              <div><h1>Masa Düzeni</h1><div className="sub">Katılan misafirleri masalara yerleştir · {placed}/{totalConfirmed} kişi yerleştirildi</div></div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button className="abtn abtn-o" type="button" onClick={() => void addTable()}>+ Masa Ekle</button>
                <button className="abtn abtn-o" type="button" onClick={() => void autoAssign()}>⚡ Otomatik</button>
                <button className="abtn abtn-o" onClick={exportSeating}>↓ Dışa Aktar</button>
              </div>
            </div>
            <div className="tables-layout">
              {/* Guest Panel */}
              <div className="tables-panel">
                <div className="tables-panel-head">
                  <h3>Katılan Misafirler</h3>
                  <p>Sürükle → masaya bırak · {confirmedGuests.filter(g => !g.tableId).length} yerleştirilmedi</p>
                </div>
                <div className="guest-chip-list">
                  {confirmedGuests.map(g => {
                    const assigned = !!g.tableId
                    const c = guestColor(g)
                    return (
                      <div key={g.id}
                        className={`guest-chip${assigned ? ' is-assigned' : ''}`}
                        draggable={!assigned}
                        onDragStart={e => { setDragGuestId(g.id); e.dataTransfer.effectAllowed = 'move' }}
                        onDragEnd={() => setDragGuestId(null)}>
                        <div className="g-avatar" style={{ background: c.bg, color: c.text }}>{initials(g.name)}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--dp)' }}>{g.name}</div>
                          <div style={{ fontSize: 10, color: 'var(--mt)' }}>{g.partySize} kişi{assigned ? ' · ' + (tables.find(t => t.id === g.tableId)?.name || '?') : ''}</div>
                        </div>
                      </div>
                    )
                  })}
                  {confirmedGuests.length === 0 && <p style={{ fontSize: 12, color: 'var(--mt)', padding: 12, textAlign: 'center' }}>Henüz katılan misafir yok</p>}
                </div>
                <div className="tables-stats">
                  <span>{placed} yerleştirildi</span>
                  <span>{totalConfirmed} toplam</span>
                </div>
              </div>

              {/* Canvas */}
              <div className="tables-canvas-wrap">
                <div className="tables-canvas">
                  {tables.map(t => {
                    const c = TABLE_COLORS[t.colorIdx % TABLE_COLORS.length]
                    const s = seatedAt(t.id)
                    const full = s >= t.seats
                    const seatedGs = allGuests.filter(g => g.tableId === t.id)
                    return (
                      <div key={t.id} className="table-node" style={{ left: t.x, top: t.y }}>
                        <div className="table-circle"
                          style={{ width: 120, height: 120, background: c.bg, borderColor: full ? '#E24B4A' : c.border }}
                          onDragOver={e => { e.preventDefault(); (e.currentTarget as HTMLElement).style.borderStyle = 'dashed' }}
                          onDragLeave={e => { (e.currentTarget as HTMLElement).style.borderStyle = 'solid' }}
                          onDrop={e => { (e.currentTarget as HTMLElement).style.borderStyle = 'solid'; onTableDrop(e, t.id) }}>
                          <span className="table-name" style={{ color: c.text }}>{t.name}</span>
                          <span className="table-count" style={{ color: c.text }}>{s}/{t.seats} koltuk</span>
                          <span className="seat-badge" style={{ color: full ? '#A32D2D' : 'var(--mt)', borderColor: full ? '#F7C1C1' : 'var(--bd)' }}>{s}/{t.seats}</span>
                        </div>
                        <div className="seated-names">
                          {seatedGs.map(g => (
                            <div key={g.id} className="mini-tag" onClick={() => unassignGuest(g.id)} title="Kaldır">
                              {g.name.split(' ')[0]}{g.partySize > 1 ? ` +${g.partySize - 1}` : ''} <span style={{ fontSize: 8 }}>✕</span>
                            </div>
                          ))}
                        </div>
                        <div className="table-actions">
                          <button className="table-btn" onClick={() => openEditTable(t)}>Düzenle</button>
                          <button className="table-btn" onClick={() => removeTable(t.id)}>Sil</button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── PREVIEW ── */}
        {nav === 'preview' && (
          <div>
            <div className="topbar"><div><h1>Davetiye Önizleme</h1><div className="sub">Misafirlerin gördüğü sayfa</div></div></div>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'flex-start' }}>
              <div style={{ background: 'var(--wh)', border: '1px solid var(--bd)', borderRadius: 9, padding: 16, flex: '0 0 300px' }}>
                <div className="phone-frame">
                  <div className="phone-bar">
                    {['#ff5f56', '#febc2e', '#27c840'].map(c => <div key={c} className="phone-dot" style={{ background: c }} />)}
                    <div className="phone-url">{siteUrl || 'senindomain.com'}/rsvp?g=zyn001</div>
                  </div>
                  <img src={INVITE_IMG} style={{ width: '100%', display: 'block' }} alt="davetiye önizleme" />
                  <div style={{ padding: 14, textAlign: 'center' }}>
                    <div style={{ fontFamily: 'Georgia,serif', fontSize: 18, color: 'var(--dp)' }}>{settings.name1} <span style={{ fontStyle: 'italic', color: 'var(--gd)' }}>&</span> {settings.name2}</div>
                    <div style={{ fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase' as const, color: 'var(--tp)', margin: '7px 0' }}>25 Temmuz 2026 · Cumartesi</div>
                    <div style={{ background: 'var(--dp)', color: '#FAF8F3', borderRadius: 6, padding: 10, fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase' as const }}>Katılım Durumumu Bildir</div>
                  </div>
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 220 }}>
                <div style={{ background: 'var(--bl)', border: '1px solid var(--br)', borderRadius: 9, padding: 14 }}>
                  <div style={{ fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase' as const, color: 'var(--tp)', marginBottom: 6 }}>Örnek RSVP Linki</div>
                  <div style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--dp)', wordBreak: 'break-all', background: 'var(--wh)', padding: '8px 10px', borderRadius: 5, border: '1px solid var(--br)' }}>
                    {buildLink('zyn001', siteUrl)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── SETTINGS ── */}
        {nav === 'settings' && (
          <div>
            <div className="topbar"><div><h1>Ayarlar</h1><div className="sub">Düğün bilgilerini ve şifreni güncelle</div></div></div>
            <div className="s-card">
              <h3>Etkinlik Bilgileri</h3>
              <div className="s-grid">
                {[['Tarih', 'date', 'date'], ['Saat', 'time', 'time']].map(([l, k, t]) => (
                  <div key={k} className="mf"><label>{l}</label><input type={t} value={(localSettings as any)[k] || ''} onChange={e => setLocalSettings(s => ({ ...s, [k]: e.target.value }))} /></div>
                ))}
              </div>
              {[['Mekan', 'venue'], ['Adres', 'address'], ['Google Maps URL', 'mapUrl']].map(([l, k]) => (
                <div key={k} className="mf"><label>{l}</label><input value={(localSettings as any)[k] || ''} onChange={e => setLocalSettings(s => ({ ...s, [k]: e.target.value }))} placeholder={k === 'mapUrl' ? 'https://maps.google.com/...' : ''} /></div>
              ))}
              <div className="mf">
                <label>Site URL — Vercel deploy adresin (RSVP linkleri için)</label>
                <input value={localSettings.siteUrl || ''} onChange={e => setLocalSettings(s => ({ ...s, siteUrl: e.target.value }))} placeholder="https://bartuburcak.vercel.app" />
              </div>
            </div>
            <div className="s-card">
              <h3>Admin girişi</h3>
              <p style={{ fontSize: 12, color: 'var(--mt)', lineHeight: 1.65 }}>
                Bartu ya da Burçak seçilir; ikisi için de <strong>aynı tek şifre</strong> geçerlidir (varsayılan <code style={{ fontSize: 11 }}>burcak2026</code>).
                Canlı ortamda değiştirmek için Vercel’de <code style={{ fontSize: 11 }}>WEDDING_ADMIN_PASSWORD</code> tanımlayın ve yeniden deploy edin.
              </p>
            </div>
            <button className="abtn abtn-p" onClick={() => void (async () => {
              const ok = await persist(allGuests, localSettings, admins, tables)
              if (ok) {
                setSettings(localSettings); showToast('Ayarlar kaydedildi ✓')
              }
            })()}>
              Ayarları Kaydet
            </button>
          </div>
        )}
      </div>

      {/* ADD/EDIT MODAL */}
      {modal === 'add' && (
        <div className="modal-ovl open" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal-box">
            <h3>{editId ? 'Misafiri Düzenle' : 'Yeni Misafir Ekle'}</h3>
            <div className="mgrid">
              <div className="mf"><label>Ad Soyad *</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Zeynep Yılmaz" /></div>
              <div className="mf"><label>Telefon *</label><input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+90 532 xxx xx xx" /></div>
            </div>
            <div className="mgrid">
              <div className="mf"><label>Durum</label>
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as RsvpStatus }))}>
                  <option value="pending">Bekliyor</option><option value="confirmed">Katılıyor</option>
                  <option value="declined">Katılamıyor</option><option value="maybe">Belki</option>
                </select>
              </div>
              <div className="mf"><label>Kişi Sayısı</label><input type="number" value={form.partySize} onChange={e => setForm(f => ({ ...f, partySize: e.target.value }))} /></div>
            </div>
            <div className="mf"><label>Not</label><textarea value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} rows={2} placeholder="İsteğe bağlı..." /></div>
            <div className="mact">
              <button className="abtn abtn-o" onClick={() => setModal(null)}>İptal</button>
              <button className="abtn abtn-p" type="button" onClick={() => void saveGuest()}>Kaydet</button>
            </div>
          </div>
        </div>
      )}

      {/* WA MODAL */}
      {modal === 'wa' && waGuest && (
        <div className="modal-ovl open" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal-box">
            <h3>WhatsApp Mesajı</h3>
            <p style={{ fontSize: 12, color: 'var(--mt)', marginBottom: 12 }}>{waGuest.name} · {waGuest.phone}</p>
            <div style={{ background: '#F0FBF4', border: '1px solid #B8E6C4', borderRadius: 7, padding: '10px 14px', marginBottom: 12, fontSize: 11, color: '#2A6B3A' }}>
              📱 Bu mesaj <strong>{admin.displayName}</strong>&apos;ın telefonundan gidecek
            </div>
            <div className="wa-chat-bg">
              <div className="wa-bubble">
                {buildWAMessage(waGuest, settings.waTemplate, siteUrl, settings)}
                <div className="wa-time">19:32 ✓✓</div>
              </div>
            </div>
            <div className="link-box"><div className="lb">RSVP Linki</div><div className="lu">{buildLink(waGuest.token, siteUrl)}</div></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button className="abtn abtn-g" style={{ width: '100%', padding: 13, fontSize: 13 }} onClick={() => void (async () => {
                const phone = toWhatsAppPhone(waGuest.phone)
                if (!phone) { showToast('Telefon numarası geçersiz'); return }
                window.open(`https://wa.me/${phone}?text=${encodeURIComponent(buildWAMessage(waGuest, settings.waTemplate, siteUrl, settings))}`, '_blank')
                await markSent(waGuest.id)
                setModal(null)
              })()}>WhatsApp&apos;ta Aç ↗</button>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="abtn abtn-o" style={{ flex: 1 }} onClick={() => copy(buildWAMessage(waGuest, settings.waTemplate, siteUrl, settings), 'Mesaj kopyalandı!')}>Mesajı Kopyala</button>
                <button className="abtn abtn-o" style={{ flex: 1 }} onClick={() => copy(buildLink(waGuest.token, siteUrl), 'Link kopyalandı!')}>Linki Kopyala</button>
              </div>
              <button className="abtn abtn-o" style={{ width: '100%' }} onClick={() => setModal(null)}>Kapat</button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {modal === 'delete' && (
        <div className="modal-ovl open" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal-box">
            <h3>Misafiri Sil</h3>
            <p style={{ fontSize: 13, color: 'var(--mt)', marginBottom: 20 }}>Bu misafiri silmek istediğinize emin misiniz?</p>
            <div className="mact">
              <button className="abtn abtn-o" onClick={() => setModal(null)}>İptal</button>
              <button className="abtn abtn-r" type="button" onClick={() => void deleteGuest()}>Evet, Sil</button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT TABLE MODAL */}
      {modal === 'editTable' && (
        <div className="modal-ovl open" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal-box">
            <h3>Masayı Düzenle</h3>
            <div className="mf"><label>Masa Adı</label><input value={tableForm.name} onChange={e => setTableForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div className="mf"><label>Koltuk Sayısı</label><input type="number" value={tableForm.seats} min="2" max="30" onChange={e => setTableForm(f => ({ ...f, seats: e.target.value }))} /></div>
            <div className="mf">
              <label>Renk</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
                {TABLE_COLORS.map((c, i) => (
                  <button key={i} onClick={() => setTableForm(f => ({ ...f, colorIdx: i }))}
                    style={{ width: 28, height: 28, borderRadius: '50%', background: c.bg, border: `2px solid ${tableForm.colorIdx === i ? c.border : 'var(--bd)'}`, cursor: 'pointer', transition: 'border .15s' }} />
                ))}
              </div>
            </div>
            <div className="mact">
              <button className="abtn abtn-o" onClick={() => setModal(null)}>İptal</button>
              <button className="abtn abtn-p" type="button" onClick={() => void saveTableEdit()}>Kaydet</button>
            </div>
          </div>
        </div>
      )}

      <div className={`toast${toast.show ? ' show' : ''}`}>{toast.msg}</div>
    </div>
  )
}
