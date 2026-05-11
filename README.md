# 💍 Bartu & Burçak — Düğün RSVP

## GitHub'a Sıfırdan Yükleme

### 1. GitHub'da repo oluştur
1. [github.com/new](https://github.com/new) adresine git
2. Repository name: `bartu-burcak-wedding`
3. **Private** seç
4. "Initialize with README" işaretleme — boş bırак
5. **Create repository** butonuna bas

### 2. Dosyaları yükle
1. Yeni repo sayfasında **"uploading an existing file"** linkine tıkla
2. Bu ZIP'i aç — içindeki TÜM dosya ve klasörleri seç
3. GitHub'a sürükle-bırak et
4. En altta **"Commit changes"** butonuna bas

### 3. Vercel'e deploy et
1. [vercel.com](https://vercel.com) → **Continue with GitHub** ile giriş yap
2. **Add New → Project** → `bartu-burcak-wedding` reposunu seç
3. Framework: **Next.js** (otomatik algılanır)
4. **Deploy** butonuna bas → ~2 dakika bekle
5. Adresin hazır: `bartu-burcak-wedding.vercel.app`

### 4. Son ayar
- Admin paneli → **Ayarlar** → Site URL alanına Vercel adresini gir
- Kaydet → artık RSVP linkleri çalışıyor

---

## Giriş Bilgileri

| Kişi   | Şifre        |
|--------|--------------|
| Bartu  | `bartu2026`  |
| Burçak | `burcak2026` |

> Deploy sonrası Ayarlar > Şifremi Değiştir bölümünden güncelle!

---

## Sayfalar

| URL | Ne gösterir |
|-----|-------------|
| `/login` | Admin giriş ekranı |
| `/admin` | Admin paneli |
| `/rsvp?g=TOKEN` | Misafir davetiye sayfası |

---

## Test Linkleri (lokal)

```bash
npm install
npm run dev
```

- Admin: http://localhost:3000/login
- Misafir (Zeynep): http://localhost:3000/rsvp?g=zyn001
- Misafir (Selin): http://localhost:3000/rsvp?g=sln007

---

## WhatsApp Nasıl Çalışır?

1. Admin paneli → WhatsApp sekmesi → **WA Aç** butonuna bas
2. **Senin telefonunda** WhatsApp açılır, mesaj hazır gelir
3. Sadece **Gönder**'e bas — mesaj senin numaranla gider
4. Burçak da aynı siteye girerse kendi telefonundan gönderir

API yok · Otomasyon yok · 100% manuel

---

## Vercel Hatası Alırsan

Bu proje Vercel NOT_FOUND hatasını önceden çözdü:
- ✅ Görsel `public/invitations/davetiye.jpg` olarak — bundle'da değil
- ✅ Her sayfada `export const runtime = 'nodejs'`
- ✅ `tsconfig.json` path alias düzgün ayarlandı
- ✅ `next.config.js` standart `module.exports` kullanıyor
