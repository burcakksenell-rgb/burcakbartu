'use client'

export type RsvpStatus = 'confirmed' | 'declined' | 'pending' | 'maybe'

export interface Guest {
  id: string
  name: string
  phone: string
  status: RsvpStatus
  partySize: number
  note: string
  token: string
  sentAt: string | null
  respondedAt: string | null
  ownerId: string
  tableId: string | null
}

export interface TableItem {
  id: string
  name: string
  seats: number
  x: number
  y: number
  colorIdx: number
}

export interface AdminUser {
  id: string
  displayName: string
  password: string
  color: string
}

export interface WeddingSettings {
  name1: string
  name2: string
  date: string
  time: string
  venue: string
  address: string
  mapUrl: string
  deadline: string
  maxParty: number
  siteUrl: string
  waTemplate: string
  inviteImagePath: string
}

// ─── DEFAULTS ────────────────────────────────────────────────
export const DEFAULT_ADMINS: AdminUser[] = [
  { id: 'bartu',  displayName: 'Bartu',  password: 'bartu2026',  color: '#C5A97A' },
  { id: 'burcak', displayName: 'Burçak', password: 'burcak2026', color: '#A8C5A0' },
]

export const DEFAULT_SETTINGS: WeddingSettings = {
  name1: 'Bartu', name2: 'Burçak',
  date: '2026-07-25', time: '19:00',
  venue: 'River Garden', address: 'Paşamandıra, Beykoz, İstanbul',
  mapUrl: 'https://maps.google.com/?q=River+Garden+Beykoz+Istanbul',
  deadline: '2026-06-20', maxParty: 5, siteUrl: '',
  waTemplate: 'Merhaba {AD} 🤍\n\nBizi bu güzel günde yanınızda görmek isteriz. Davetiye ve katılımını tek linkten yönetebilirsin:\n\n{LINK}\n\nLinke tıkladığında her şey açılacak; yanıtın bize çok değerli.\n\nSevgiyle,\n{name1} & {name2}',
  inviteImagePath: '/invitations/davetiye.jpg',
}

export const DEFAULT_TABLES: TableItem[] = [
  { id: 't1', name: 'Masa 1', seats: 8, x: 40,  y: 40,  colorIdx: 0 },
  { id: 't2', name: 'Masa 2', seats: 8, x: 220, y: 40,  colorIdx: 1 },
  { id: 't3', name: 'Masa 3', seats: 8, x: 400, y: 40,  colorIdx: 2 },
  { id: 't4', name: 'Masa 4', seats: 8, x: 130, y: 220, colorIdx: 3 },
  { id: 't5', name: 'Masa 5', seats: 8, x: 320, y: 220, colorIdx: 4 },
]

export const SAMPLE_GUESTS: Guest[] = [
  { id:'g1',  name:'Zeynep Yılmaz',      phone:'+90 532 111 2233', status:'confirmed', partySize:2, note:'',                   token:'zyn001', sentAt:'2026-05-01', respondedAt:'2026-05-03', ownerId:'bartu',  tableId:null },
  { id:'g2',  name:'Murat Arslan',        phone:'+90 533 444 5566', status:'confirmed', partySize:2, note:'',                   token:'mrt002', sentAt:'2026-05-02', respondedAt:'2026-05-04', ownerId:'bartu',  tableId:null },
  { id:'g3',  name:'Ahmet Kaya',          phone:'+90 545 222 3344', status:'pending',   partySize:0, note:'',                   token:'ahm003', sentAt:'2026-05-03', respondedAt:null,          ownerId:'bartu',  tableId:null },
  { id:'g4',  name:'Burak & Ece Öztürk', phone:'+90 544 888 9900', status:'confirmed', partySize:3, note:'',                   token:'brk004', sentAt:'2026-05-04', respondedAt:'2026-05-05', ownerId:'bartu',  tableId:null },
  { id:'g5',  name:'Fatma Çetin',         phone:'+90 531 555 6677', status:'declined',  partySize:0, note:'Seyahatte olacağım', token:'ftm005', sentAt:'2026-05-03', respondedAt:'2026-05-06', ownerId:'bartu',  tableId:null },
  { id:'g6',  name:'Can Duman',           phone:'+90 532 999 0011', status:'pending',   partySize:0, note:'',                   token:'can006', sentAt:null,         respondedAt:null,          ownerId:'bartu',  tableId:null },
  { id:'g7',  name:'Selin Demir',         phone:'+90 533 777 8899', status:'confirmed', partySize:1, note:'Vejetaryen yemek',   token:'sln007', sentAt:'2026-05-02', respondedAt:'2026-05-05', ownerId:'burcak', tableId:null },
  { id:'g8',  name:'Ayşe Kocaman',        phone:'+90 530 111 2233', status:'pending',   partySize:0, note:'',                   token:'ays008', sentAt:null,         respondedAt:null,          ownerId:'burcak', tableId:null },
  { id:'g9',  name:'Emre Şahin',          phone:'+90 536 333 4455', status:'maybe',     partySize:2, note:'İş durumuma bağlı',  token:'emr009', sentAt:'2026-05-05', respondedAt:'2026-05-07', ownerId:'burcak', tableId:null },
  { id:'g10', name:'Naz Yıldız',          phone:'+90 536 666 7788', status:'confirmed', partySize:1, note:'',                   token:'naz010', sentAt:'2026-05-05', respondedAt:'2026-05-06', ownerId:'burcak', tableId:null },
  { id:'g11', name:'Hande Arslan',        phone:'+90 542 123 4567', status:'confirmed', partySize:2, note:'',                   token:'hnd011', sentAt:'2026-05-06', respondedAt:'2026-05-08', ownerId:'burcak', tableId:null },
  { id:'g12', name:'Kerem Aydın',         phone:'+90 543 987 6543', status:'declined',  partySize:0, note:'Yurt dışında',       token:'krm012', sentAt:'2026-05-06', respondedAt:'2026-05-07', ownerId:'burcak', tableId:null },
]

export const STATUS_CONFIG = {
  confirmed: { label: 'Katılıyor',   bg: '#EAF3DE', color: '#3B6D11', cls: 'b-confirmed' },
  declined:  { label: 'Katılamıyor', bg: '#FCEBEB', color: '#A32D2D', cls: 'b-declined'  },
  pending:   { label: 'Bekliyor',    bg: '#FAEEDA', color: '#854F0B', cls: 'b-pending'   },
  maybe:     { label: 'Belki',       bg: '#E1F5EE', color: '#0F6E56', cls: 'b-maybe'     },
}

export const TABLE_COLORS = [
  { bg: '#E6F1FB', border: '#185FA5', text: '#185FA5' },
  { bg: '#EAF3DE', border: '#3B6D11', text: '#3B6D11' },
  { bg: '#FAEEDA', border: '#854F0B', text: '#854F0B' },
  { bg: '#FCEBEB', border: '#A32D2D', text: '#A32D2D' },
  { bg: '#E1F5EE', border: '#0F6E56', text: '#0F6E56' },
  { bg: '#EEEDFE', border: '#534AB7', text: '#534AB7' },
  { bg: '#FBEAF0', border: '#993556', text: '#993556' },
  { bg: '#FAECE7', border: '#993C1D', text: '#993C1D' },
]

export function buildLink(token: string, siteUrl: string) {
  const base = siteUrl ? siteUrl.replace(/\/$/, '') : (typeof window !== 'undefined' ? window.location.origin : '')
  return `${base}/rsvp?g=${token}`
}

export function buildWAMessage(guest: Guest, template: string, siteUrl: string, couple?: Pick<WeddingSettings, 'name1' | 'name2'>) {
  const base = siteUrl ? siteUrl.replace(/\/$/, '') : (typeof window !== 'undefined' ? window.location.origin : '')
  const imageUrl = `${base}/invitations/davetiye.jpg`
  const n1 = couple?.name1 ?? 'Bartu'
  const n2 = couple?.name2 ?? 'Burçak'
  return template
    .replace(/\{AD\}/g, guest.name)
    .replace(/\{LINK\}/g, buildLink(guest.token, siteUrl))
    .replace(/\{IMAGE\}/g, imageUrl)
    .replace(/\{name1\}/gi, n1)
    .replace(/\{name2\}/gi, n2)
}

export function getStats(guests: Guest[]) {
  return {
    total:      guests.length,
    confirmed:  guests.filter(g => g.status === 'confirmed').length,
    declined:   guests.filter(g => g.status === 'declined').length,
    pending:    guests.filter(g => g.status === 'pending').length,
    maybe:      guests.filter(g => g.status === 'maybe').length,
    attendees:  guests.reduce((s, g) => s + (g.partySize || 0), 0),
    sent:       guests.filter(g => g.sentAt).length,
    seated:     guests.filter(g => g.tableId !== null).reduce((s, g) => s + (g.partySize || 0), 0),
  }
}

export function seatedAtTable(guests: Guest[], tableId: string) {
  return guests.filter(g => g.tableId === tableId).reduce((s, g) => s + (g.partySize || 0), 0)
}

export function generateToken() {
  return 'g' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

export function exportGuestsCSV(guests: Guest[], tables: TableItem[]) {
  const rows = [
    ['Ad Soyad', 'Telefon', 'Durum', 'Kişi', 'Not', 'Token', 'Gönderildi', 'Yanıtladı', 'Admin', 'Masa'],
    ...guests.map(g => {
      const tbl = g.tableId ? tables.find(t => t.id === g.tableId)?.name || '' : ''
      return [g.name, g.phone, STATUS_CONFIG[g.status]?.label || g.status, g.partySize || 0, g.note || '', g.token, g.sentAt || '', g.respondedAt || '', g.ownerId, tbl]
    })
  ]
  const csv = '\uFEFF' + rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  a.download = 'misafirler.csv'
  a.click()
}
