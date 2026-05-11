import 'server-only'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { AdminUser, Guest, TableItem, WeddingSettings } from '@/lib/data'

function getClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY ortam değişkenleri gerekli')
  }
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

function guestFromRow(row: {
  id: string
  name: string
  phone: string
  status: string
  party_size: number
  note: string
  token: string
  sent_at: string | null
  responded_at: string | null
  owner_id: string
  table_id: string | null
}): Guest {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    status: row.status as Guest['status'],
    partySize: row.party_size,
    note: row.note || '',
    token: row.token,
    sentAt: row.sent_at,
    respondedAt: row.responded_at,
    ownerId: row.owner_id,
    tableId: row.table_id,
  }
}

function guestToInsert(g: Guest) {
  return {
    id: g.id,
    name: g.name,
    phone: g.phone,
    status: g.status,
    party_size: g.partySize,
    note: g.note || '',
    token: g.token,
    sent_at: g.sentAt,
    responded_at: g.respondedAt,
    owner_id: g.ownerId,
    table_id: g.tableId,
  }
}

function adminFromRow(row: { id: string; display_name: string; password: string; color: string }): AdminUser {
  return { id: row.id, displayName: row.display_name, password: row.password, color: row.color }
}

function adminToInsert(a: AdminUser) {
  return { id: a.id, display_name: a.displayName, password: a.password, color: a.color }
}

function tableFromRow(row: { id: string; name: string; seats: number; pos_x: number; pos_y: number; color_idx: number }): TableItem {
  return { id: row.id, name: row.name, seats: row.seats, x: Number(row.pos_x), y: Number(row.pos_y), colorIdx: row.color_idx }
}

function tableToInsert(t: TableItem) {
  return { id: t.id, name: t.name, seats: t.seats, pos_x: t.x, pos_y: t.y, color_idx: t.colorIdx }
}

function settingsFromRow(row: {
  name1: string
  name2: string
  date: string
  time: string
  venue: string
  address: string
  map_url: string
  deadline: string
  max_party: number
  site_url: string
  wa_template: string
  invite_image_path: string
}): WeddingSettings {
  return {
    name1: row.name1,
    name2: row.name2,
    date: row.date,
    time: row.time,
    venue: row.venue,
    address: row.address,
    mapUrl: row.map_url,
    deadline: row.deadline,
    maxParty: row.max_party,
    siteUrl: row.site_url || '',
    waTemplate: row.wa_template || '',
    inviteImagePath: row.invite_image_path || '/invitations/davetiye.jpg',
  }
}

function settingsToUpdate(s: WeddingSettings) {
  return {
    id: 1,
    name1: s.name1,
    name2: s.name2,
    date: s.date,
    time: s.time,
    venue: s.venue,
    address: s.address,
    map_url: s.mapUrl,
    deadline: s.deadline,
    max_party: s.maxParty,
    site_url: s.siteUrl,
    wa_template: s.waTemplate,
    invite_image_path: s.inviteImagePath,
    updated_at: new Date().toISOString(),
  }
}

export type FullWeddingState = {
  guests: Guest[]
  settings: WeddingSettings
  admins: AdminUser[]
  tables: TableItem[]
}

export async function readLoginOptions() {
  const supabase = getClient()
  const { data, error } = await supabase.from('wedding_admins').select('id, display_name, color').order('id')
  if (error) throw new Error(error.message)
  return (data ?? []).map(r => ({ id: r.id, displayName: r.display_name, color: r.color }))
}

export async function readFullState(): Promise<FullWeddingState> {
  const supabase = getClient()
  const [guestsRes, adminsRes, tablesRes, settingsRes] = await Promise.all([
    supabase.from('wedding_guests').select('*').order('name'),
    supabase.from('wedding_admins').select('*').order('id'),
    supabase.from('seating_tables').select('*').order('name'),
    supabase.from('wedding_settings').select('*').eq('id', 1).maybeSingle(),
  ])
  if (guestsRes.error) throw new Error(guestsRes.error.message)
  if (adminsRes.error) throw new Error(adminsRes.error.message)
  if (tablesRes.error) throw new Error(tablesRes.error.message)
  if (settingsRes.error) throw new Error(settingsRes.error.message)

  const settingsRow = settingsRes.data
  if (!settingsRow) throw new Error('wedding_settings satırı bulunamadı')

  return {
    guests: (guestsRes.data ?? []).map(guestFromRow),
    admins: (adminsRes.data ?? []).map(adminFromRow),
    tables: (tablesRes.data ?? []).map(tableFromRow),
    settings: settingsFromRow(settingsRow),
  }
}

export async function writeFullState(state: FullWeddingState): Promise<void> {
  const supabase = getClient()
  const { guests, admins, tables, settings } = state

  const { error: admErr } = await supabase.from('wedding_admins').upsert(admins.map(adminToInsert), { onConflict: 'id' })
  if (admErr) throw new Error(admErr.message)

  const { data: guestRows, error: gErr } = await supabase.from('wedding_guests').select('id')
  if (gErr) throw new Error(gErr.message)
  const keepGuest = new Set(guests.map(g => g.id))
  const staleGuestIds = (guestRows ?? []).map(r => r.id).filter(id => !keepGuest.has(id))
  if (staleGuestIds.length) {
    const { error } = await supabase.from('wedding_guests').delete().in('id', staleGuestIds)
    if (error) throw new Error(error.message)
  }

  const { data: tableRows, error: tSelErr } = await supabase.from('seating_tables').select('id')
  if (tSelErr) throw new Error(tSelErr.message)
  const keepTable = new Set(tables.map(t => t.id))
  const staleTableIds = (tableRows ?? []).map(r => r.id).filter(id => !keepTable.has(id))
  if (staleTableIds.length) {
    const { error } = await supabase.from('seating_tables').delete().in('id', staleTableIds)
    if (error) throw new Error(error.message)
  }

  const { error: stErr } = await supabase.from('seating_tables').upsert(tables.map(tableToInsert), { onConflict: 'id' })
  if (stErr) throw new Error(stErr.message)

  const { error: gvErr } = await supabase.from('wedding_guests').upsert(guests.map(guestToInsert), { onConflict: 'id' })
  if (gvErr) throw new Error(gvErr.message)

  const { error: setErr } = await supabase.from('wedding_settings').upsert(settingsToUpdate(settings), { onConflict: 'id' })
  if (setErr) throw new Error(setErr.message)
}

export async function fetchGuestPublicBundle(tokenValue: string) {
  const supabase = getClient()
  const { data: guestRow, error: gErr } = await supabase.from('wedding_guests').select('*').eq('token', tokenValue).maybeSingle()
  if (gErr) throw new Error(gErr.message)
  if (!guestRow) return null

  const [{ data: tbls, error: tErr }, { data: stRow, error: sErr }] = await Promise.all([
    supabase.from('seating_tables').select('*').order('name'),
    supabase.from('wedding_settings').select('*').eq('id', 1).maybeSingle(),
  ])

  if (tErr) throw new Error(tErr.message)
  if (sErr) throw new Error(sErr.message)
  if (!stRow) throw new Error('Ayarlar yok')

  let matesRows: Guest[] = []
  if (guestRow.table_id) {
    const { data: mData, error: mErr } = await supabase.from('wedding_guests').select('*').eq('table_id', guestRow.table_id)
    if (mErr) throw new Error(mErr.message)
    matesRows = (mData ?? []).map(guestFromRow)
  }

  return {
    guest: guestFromRow(guestRow),
    settings: settingsFromRow(stRow),
    tables: (tbls ?? []).map(tableFromRow),
    mates: matesRows,
  }
}

export async function updateGuestRsvp(
  tokenValue: string,
  payload: { status: Guest['status']; partySize: number },
): Promise<Guest | null> {
  const supabase = getClient()
  const respondedAt = new Date().toISOString().slice(0, 10)
  const party = payload.status === 'declined' ? 0 : Math.max(1, Math.min(50, payload.partySize))
  const { data, error } = await supabase
    .from('wedding_guests')
    .update({
      status: payload.status,
      party_size: party,
      responded_at: respondedAt,
    })
    .eq('token', tokenValue)
    .select('*')
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) return null
  return guestFromRow(data)
}
