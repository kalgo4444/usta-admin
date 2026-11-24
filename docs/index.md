# Usta Platform — Admin Dashboard: To'liq reja
 
> Manba: `https://usta-platform-nwtz.onrender.com/v3/api-docs` (OpenAPI)
> Base URL: `https://usta-platform-nwtz.onrender.com/api/v1`
> Auth: `Authorization: Bearer <accessToken>` (JWT)
 
---
 
## 1. Maqsad
 
Platforma administratori uchun veb-panel. U quyidagilarni boshqaradi:
 
- Masterlarni tekshirish va tasdiqlash (verification)
- Foydalanuvchilarni bloklash va blokdan chiqarish
- Buyurtmalarni kuzatish va nizolarni (dispute) hal qilish
- Shikoyatlarni ko'rib chiqish
- Katalog (kategoriyalar va xizmatlar)
- Moliya: komissiyalar, invoice'lar, to'lovlar, reconciliation
 
---
 
## 2. Muhim cheklovlar va kuzatuvlar
 
| # | Kuzatuv | Ta'siri |
|---|---|---|
| 1 | Admin uchun alohida login yo'q, kirish SMS OTP orqali | Login: telefon → kod → `user.roles` ichida `ADMIN` borligini tekshirish |
| 2 | ADMIN rolini API orqali olib bo'lmaydi (`/me/roles` faqat CUSTOMER/MASTER) | Admin bazada qo'lda yaratiladi |
| 3 | Statistika endpointi yo'q | KPI'lar list endpointlarning `totalElements`'idan olinadi (`size=1`) |
| 4 | `/auth/refresh` refresh tokenni har safar almashtiradi | Refresh faqat bir marta, navbat (queue) bilan chaqirilishi kerak |
| 5 | Render bepul tarifi: cold start 30–60 s | Uzoq timeout, retry va "server uyg'onmoqda" holati kerak |
| 6 | Hujjat URL'lari presigned, vaqt o'tib eskiradi | Master tafsiloti har ochilganda qayta yuklanadi, URL'lar keshlanmaydi |
| 7 | Xizmat va kategoriyalar o'chirilmaydi | Faqat `status=INACTIVE` |
| 8 | ADMIN'ni bloklab bo'lmaydi | Ro'yxatda ADMIN uchun Block tugmasi yashiriladi |
| 9 | CORS | Dashboard domeni backend'da ruxsat etilgan bo'lishi kerak |
 
---
 
## 3. Texnologiyalar
 
| Soha | Tanlov |
|---|---|
| Framework | Next.js (App Router) + TypeScript |
| Arxitektura | FSD (Feature-Sliced Design) |
| Server state | TanStack Query |
| HTTP | Axios (interceptor: token qo'shish, 401 → refresh queue) |
| API tiplari | `openapi-typescript` yoki `orval`, `/v3/api-docs`'dan generatsiya |
| UI | shadcn/ui + Tailwind CSS |
| Jadval | TanStack Table (server-side pagination/sort) |
| Formalar | React Hook Form + Zod |
| Grafiklar | Recharts |
| Sana | dayjs |
| i18n | next-intl (uz, ru) |
| Toast | sonner |
 
---
 
## 4. Papka strukturasi (FSD)
 
```
src/
├── app/                         # Next.js routes
│   ├── (auth)/login/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx           # Sidebar + Header + AdminGuard
│   │   ├── page.tsx             # Overview
│   │   ├── users/page.tsx
│   │   ├── masters/page.tsx
│   │   ├── masters/[id]/page.tsx
│   │   ├── orders/page.tsx
│   │   ├── orders/[id]/page.tsx
│   │   ├── complaints/page.tsx
│   │   ├── complaints/[id]/page.tsx
│   │   ├── catalog/categories/page.tsx
│   │   ├── catalog/services/page.tsx
│   │   ├── finance/invoices/page.tsx
│   │   ├── finance/commissions/page.tsx
│   │   ├── finance/ledger/page.tsx
│   │   ├── finance/reconciliation/page.tsx
│   │   └── system/page.tsx
│   └── providers.tsx
├── widgets/                     # Sidebar, Header, KpiCards, OrderTimeline, ChatViewer
├── features/                    # auth-otp, block-user, approve-master, reject-master,
│                                # resolve-dispute, take-complaint, close-complaint,
│                                # category-form, service-form, settle-invoice, close-weeks
├── entities/                    # user, master, order, complaint, category, service,
│                                # commission, invoice (api + model + ui)
└── shared/
    ├── api/                     # axios instance, refresh queue, generated types
    ├── config/                  # env, routes
    ├── lib/                     # formatMoney, formatPhone, formatDate, statusColors
    └── ui/                      # DataTable, StatusBadge, ConfirmDialog, ReasonDialog
```
 
---
 
## 5. Autentifikatsiya
 
### Oqim
 
1. `POST /auth/otp/request` `{ phone }` → `expiresInSeconds`, `resendAfterSeconds`, `codeLength`
2. Kod kiritish (uzunligi `codeLength` bo'yicha), "Qayta yuborish" tugmasi uchun taymer
3. `POST /auth/otp/verify` `{ phone, code }` → `TokenResponse`
4. `user.roles.includes('ADMIN')` bo'lmasa → `POST /auth/logout` qilib, "Ruxsat yo'q" xabarini ko'rsatish
5. Tokenlarni saqlash va `/` ga yo'naltirish
 
### Token saqlash
 
- Variant A (tavsiya): Next.js route handler orqali `refreshToken`'ni httpOnly cookie'da saqlash, `accessToken`'ni xotirada
- Variant B (oddiy): ikkala tokenni ham `localStorage`'da saqlash (XSS xavfi bor)
 
### Refresh queue
 
- 401 kelganda bitta `POST /auth/refresh` chaqiriladi, qolgan so'rovlar navbatda kutadi
- Muvaffaqiyatli bo'lsa navbatdagi so'rovlar qayta yuboriladi
- Xato bo'lsa logout qilinib, `/login`'ga yo'naltiriladi
- `accessTokenExpiresAt`'ga qarab muddati tugashidan oldin proaktiv refresh qilish mumkin
 
### Guard
 
- `(dashboard)/layout.tsx` ichida `GET /me` chaqiriladi va `ADMIN` roli tekshiriladi
- `status === 'BLOCKED'` bo'lsa logout
 
---
 
## 6. Sahifalar (batafsil)
 
### 6.1 Overview (`/`)
 
**KPI kartalar** (har biri `size=1` so'rovidan olingan `totalElements`):
 
| Karta | So'rov | Bosilganda |
|---|---|---|
| Tasdiqlash kutayotgan masterlar | `GET /admin/masters?status=PENDING&size=1` | `/masters?status=PENDING` |
| Ochiq nizolar | `GET /admin/orders?status=DISPUTED&size=1` | `/orders?status=DISPUTED` |
| Ochiq shikoyatlar | `GET /admin/complaints?status=OPEN&size=1` | `/complaints?status=OPEN` |
| Ko'rib chiqilayotgan shikoyatlar | `GET /admin/complaints?status=IN_REVIEW&size=1` | `/complaints?status=IN_REVIEW` |
| Faol buyurtmalar | `status=SEARCHING`, `ACCEPTED`, `IN_PROGRESS` | `/orders` |
| Bloklangan userlar | `GET /admin/users?status=BLOCKED&size=1` | `/users?status=BLOCKED` |
 
**Reconciliation vidjeti:** `GET /admin/finance/reconciliation` (oxirgi 7 kun). `ok=true` bo'lsa yashil, aks holda `mismatches.length` qizilda ko'rsatiladi.
 
**So'nggi faoliyat:** oxirgi 5 ta DISPUTED buyurtma va oxirgi 5 ta OPEN shikoyat.
 
---
 
### 6.2 Users (`/users`)
 
**Endpoint:** `GET /admin/users?phone=&role=&status=&page=&size=&sort=`
 
**Filtrlar:** telefon (qisman, debounce 400 ms), rol (CUSTOMER / MASTER / ADMIN), status (ACTIVE / BLOCKED)
 
**Ustunlar:** Telefon · Rollar (badge) · Status · Blok sababi · Oxirgi kirish · Ro'yxatdan o'tgan sana · Amallar
 
**Amallar:**
- **Block:** `POST /admin/users/{id}/block` `{ reason* ≤500 }`. Sabab kiritiladigan modal ochiladi. Ogohlantirish: userning barcha sessiyalari tugatiladi. ADMIN uchun tugma ko'rinmaydi.
- **Unblock:** `POST /admin/users/{id}/unblock`, tasdiqlash dialogi bilan
 
**Qo'shimcha:** MASTER rolli userda "Master profili" havolasi (`/masters/{id}`), CUSTOMER'da "Buyurtmalari" havolasi (`/orders?customerId={id}`)
 
---
 
### 6.3 Masters (`/masters`, `/masters/[id]`)
 
**Ro'yxat:** `GET /admin/masters?status=&page=&size=&sort=`
 
- Status bo'yicha tablar: PENDING (default) · APPROVED · REJECTED · NOT_SUBMITTED · Hammasi
- Ustunlar: Avatar + ism · Telefon · Tajriba (yil) · Reyting (`ratingAvg` / `ratingCount`) · Status · Yuborilgan sana (`submittedAt`) · Faol
 
**Tafsilot:** `GET /admin/masters/{id}` → `phone`, `profile`, `documents[]`
 
- Profil: ism, bio, tajriba, ish radiusi, `workLocation` (xaritada ko'rsatish, Leaflet/OSM), reyting, sanalar
- Hujjatlar galereyasi: `PASSPORT`, `SELFIE`, `CERTIFICATE`, `OTHER` turlari bo'yicha guruhlanadi. Rasmlar lightbox'da, PDF yangi tabda ochiladi.
- Qo'shimcha ma'lumot (public endpointlar): `GET /masters/{id}/services`, `/portfolio`, `/reviews`
- Tegishli buyurtmalar: `GET /admin/orders?masterId={id}`
- Moliya havolasi: `/finance/ledger?masterId={id}`
 
**Amallar:**
- **Approve:** `POST /admin/masters/{id}/approve` (faqat PENDING holatda)
- **Reject:** `POST /admin/masters/{id}/reject` `{ reason* ≤1000 }` (PENDING yoki APPROVED holatda). Tayyor sabablar ro'yxati beriladi ("Pasport rasmi aniq emas", "Selfi mos kelmaydi" va h.k.), ularni tahrirlash mumkin.
 
**Holatlar oqimi:**
```
NOT_SUBMITTED → (master yuboradi) → PENDING → APPROVED
                                       ↓         ↓
                                    REJECTED ←───┘
REJECTED → (master hujjatlarni qayta yuklab yuboradi) → PENDING
```
 
---
 
### 6.4 Orders (`/orders`, `/orders/[id]`)
 
**Ro'yxat:** `GET /admin/orders?status=&customerId=&masterId=&serviceId=&page=&size=&sort=`
 
- Filtrlar: status, xizmat (select, `GET /admin/catalog/services` orqali), masterId, customerId (URL parametri sifatida)
- "Nizolar" tezkor tabi: `status=DISPUTED`
- Ustunlar: ID (qisqa) · Status · Xizmat · Manzil · Rejalashtirilgan vaqt · Boshlang'ich narx · Yakuniy narx · Master · Yaratilgan sana
 
**Status ranglari:**
 
| Status | Rang |
|---|---|
| CREATED, SEARCHING | ko'k |
| ACCEPTED, IN_PROGRESS | sariq |
| COMPLETED, COMMISSION, REVIEWED | yashil |
| CANCELLED, EXPIRED | kulrang |
| DISPUTED | qizil |
 
**Tafsilot:** `GET /admin/orders/{id}` → `order`, `customer`, `commissionAmount`, `offers[]`
 
- Asosiy ma'lumot: xizmat, tavsif, manzil, sanalar, narxlar, komissiya
- Mijoz va master kartalari (profillarga havola bilan)
- **Timeline:** `order.history[]` (`from → to`, kim o'zgartirgan, sabab, vaqt)
- **Offerlar jadvali:** master, status, masofa, yuborilgan / tugash / javob berilgan vaqt
- **Ilovalar:** rasm va videolar (`attachments[]`)
- **Chat:** `GET /admin/orders/{orderId}/chat/messages?before=&limit=100`. Faqat o'qish uchun, "eskiroqlarini yuklash" tugmasi bilan (cursor = oxirgi xabar `id`). Xabarlar `senderId` bo'yicha mijoz yoki master sifatida ajratiladi.
- Tegishli shikoyatlar: `GET /admin/complaints?orderId={id}`
 
**Nizoni hal qilish** (faqat `status=DISPUTED` bo'lganda):
`POST /admin/orders/{id}/resolve`
```json
{ "resolution": "COMPLETED | CANCELLED", "note": "≤500", "price": 0 }
```
- `COMPLETED` tanlansa va buyurtmada narx bo'lmasa, `price` majburiy
- Formada ogohlantirish: COMPLETED tanlansa komissiya hisoblanadi
 
---
 
### 6.5 Complaints (`/complaints`, `/complaints/[id]`)
 
**Ro'yxat:** `GET /admin/complaints?status=&orderId=&againstUserId=&authorId=&page=&size=&sort=`
 
- Tablar: OPEN (default) · IN_REVIEW · RESOLVED · REJECTED
- Ustunlar: Sabab (QUALITY / NO_SHOW / PRICE / BEHAVIOR / FRAUD / OTHER) · Dispute belgisi · Buyurtma · Muallif · Kimga qarshi · Status · Sana
 
**Tafsilot:** `GET /admin/complaints/{id}` → `complaint`, `orderStatus`, `assignedTo`, `complaintsAgainstUser`
 
- `complaintsAgainstUser` > 2 bo'lsa ogohlantirish beriladi ("Bu userga qarshi N ta shikoyat")
- Buyurtma tafsilotiga va chatiga havola
 
**Oqim:**
```
OPEN → (take) → IN_REVIEW → (close) → RESOLVED | REJECTED
```
 
**Amallar:**
- **Take:** `POST /admin/complaints/{id}/take` (OPEN holatda)
- **Close:** `POST /admin/complaints/{id}/close`
```json
{ "result": "RESOLVED | REJECTED", "note": "≤2000", "orderResolution": "COMPLETED | CANCELLED", "price": 0 }
```
- `orderResolution` maydoni faqat buyurtma DISPUTED holatda bo'lsa ko'rsatiladi
- Natijadan keyin kerak bo'lsa userni bloklash uchun tezkor tugma (`/users`)
 
---
 
### 6.6 Catalog
 
#### Kategoriyalar (`/catalog/categories`)
 
- `GET /admin/catalog/categories` flat ro'yxat qaytaradi, frontend'da `parentId` orqali daraxtga yig'iladi
- Daraxt ko'rinishi: ochish/yopish, `sortOrder` bo'yicha tartib, INACTIVE kategoriyalar xira ko'rinadi
- **Yaratish:** `POST /admin/catalog/categories`
- **Tahrirlash:** `PUT /admin/catalog/categories/{id}` (ko'chirish, nomini o'zgartirish, faolsizlantirish)
 
**Forma (CategoryRequest):**
 
| Maydon | Validatsiya |
|---|---|
| `name.uz` * | ≤120 |
| `name.ru`, `name.en` | ixtiyoriy |
| `slug` * | ≤80, `^[a-z0-9]+(-[a-z0-9]+)*$` (`name.uz`'dan avtomatik yaratish mumkin) |
| `parentId` | select (null = root). O'zini yoki o'z avlodini tanlashga ruxsat berilmaydi |
| `icon` | ≤255 |
| `sortOrder` | 0–100000 |
| `status` | ACTIVE / INACTIVE |
 
#### Xizmatlar (`/catalog/services`)
 
- `GET /admin/catalog/services?categoryId=` (chapda kategoriya filtri)
- Ustunlar: Nomi (uz) · Slug · Kategoriya · Tartib · Status · Yangilangan sana
- **Yaratish:** `POST /admin/catalog/services`, **tahrirlash:** `PUT /admin/catalog/services/{id}`
- **Forma (ServiceRequest):** `categoryId*`, `name{uz*,ru,en}`, `slug*`, `description{uz,ru,en}` (har biri ≤2000), `sortOrder`, `status`
- Til tablari: uz / ru / en
 
---
 
### 6.7 Finance
 
#### Invoice'lar (`/finance/invoices`)
 
- `GET /admin/finance/invoices?period=&masterId=`
- `period` uchun hafta tanlagich (dushanba sanasi)
- Ustunlar: Master · Hafta · Buyurtmalar soni · Hisoblangan (accrued) · Invoice qilingan · To'langan · Qarz (`invoiced − paid`) · To'lov muddati (`dueDate`)
- Muddati o'tgan va to'lanmaganlar qizil rangda
- **To'lovni qayd etish:** `POST /admin/finance/settlements`
```json
{ "masterId": "uuid", "period": "YYYY-MM-DD", "amount": 0, "reference": "≤128" }
```
  - `amount` to'lanmagan qoldiqqa teng bo'lishi shart, forma avtomatik to'ldiradi
  - Faqat INVOICED hafta uchun
- **Haftalarni yopish:** `POST /admin/finance/invoices/close`. Tasdiqlash bilan; natijadagi map toast'da ko'rsatiladi. Odatda tizim buni har soatda o'zi qiladi.
 
#### Komissiyalar (`/finance/commissions`)
 
- `GET /admin/finance/commissions?masterId=&period=&status=&page=&size=&sort=`
- Statuslar: ACCRUED · INVOICED · PAID · CANCELLED
- Ustunlar: Buyurtma · Master · Asosiy summa · Stavka (%) · Komissiya · Hafta · Status · Sanalar
 
#### Ledger (`/finance/ledger`)
 
- `GET /admin/finance/transactions?masterId=*&page=&size=&sort=`. `masterId` majburiy, shuning uchun avval master tanlanadi (`/admin/masters` orqali qidiruv)
- Turlar: COMMISSION_CHARGE · COMMISSION_REVERSAL · COMMISSION_PAYMENT · ADJUSTMENT
- Summa ishorasi rang bilan ko'rsatiladi
 
#### Reconciliation (`/finance/reconciliation`)
 
- `GET /admin/finance/reconciliation?from=&to=` (`to` eksklyuziv, default oxirgi 7 kun)
- Natija: `ok`, buyurtmalar soni, `totalOrderCommission`, `totalReported`, `totalLedger`
- `mismatches[]` jadvali: buyurtma (havola) · master · buyurtma statusi · buyurtma komissiyasi · hisobotdagi komissiya · ledger net. Farqli katakchalar ajratib ko'rsatiladi.
 
---
 
### 6.8 System (`/system`)
 
- Server meta ma'lumoti: `GET /public/meta` (versiya, server vaqti)
- **Qidiruv indeksini qayta qurish:** `POST /admin/search/reindex`. Ikki bosqichli tasdiqlash bilan, natija ko'rsatiladi.
 
---
 
## 7. Umumiy komponentlar (`shared/ui`)
 
| Komponent | Vazifasi |
|---|---|
| `DataTable` | Server-side pagination (`page` 0 dan boshlanadi), sort (`field,DIR`), loading skeleton, bo'sh holat |
| `useTableParams` | Filtr, page va sort'ni URL search params bilan sinxronlash |
| `StatusBadge` | Barcha enum'lar uchun rang va matn |
| `ConfirmDialog` | Qaytarib bo'lmaydigan amallar uchun |
| `ReasonDialog` | Block, reject va resolve uchun sabab kiritish (belgilar hisoblagichi bilan) |
| `MoneyText` | `formatMoney` (UZS, bo'sh joy bilan ajratish) |
| `PhoneText` | `+998 90 123 45 67` formati |
| `CopyId` | UUID'ni qisqa ko'rsatish va nusxalash |
| `ErrorState` | API xatosi (`code` / `message`) va "Qayta urinish" tugmasi |
 
---
 
## 8. API qatlami
 
```ts
// shared/api/client.ts
const api = axios.create({ baseURL: env.API_URL + '/api/v1', timeout: 60_000 });
 
api.interceptors.request.use(cfg => {
  const t = tokenStore.access;
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  cfg.headers['Accept-Language'] = locale.current; // uz | ru
  return cfg;
});
 
let refreshing: Promise<string> | null = null;
api.interceptors.response.use(undefined, async err => {
  const original = err.config;
  if (err.response?.status !== 401 || original._retry) throw err;
  original._retry = true;
  refreshing ??= refreshTokens().finally(() => (refreshing = null));
  const access = await refreshing;           // xato bo'lsa → logout
  original.headers.Authorization = `Bearer ${access}`;
  return api(original);
});
```
 
**Query key konvensiyasi:**
```ts
['admin', 'users', params]
['admin', 'masters', params] / ['admin', 'master', id]
['admin', 'orders', params]  / ['admin', 'order', id]
['admin', 'complaints', params] / ['admin', 'complaint', id]
['admin', 'categories'] / ['admin', 'services', { categoryId }]
['admin', 'finance', 'invoices', params] ...
```
 
Mutatsiyadan keyin tegishli ro'yxat va tafsilot invalidate qilinadi, overview KPI'lari ham yangilanadi.
 
**Tiplarni generatsiya qilish:**
```bash
npx openapi-typescript https://usta-platform-nwtz.onrender.com/v3/api-docs -o src/shared/api/schema.d.ts
```
 
---
 
## 9. Xatolarni boshqarish
 
| Holat | Xatti-harakat |
|---|---|
| 401 | Refresh queue → muvaffaqiyatsiz bo'lsa logout |
| 403 | "Ruxsat yo'q" sahifasi |
| 404 | "Topilmadi" bo'sh holati |
| 409 (masalan, holat allaqachon o'zgargan) | Toast va ma'lumotni qayta yuklash |
| 400 / validatsiya | Xatolarni forma maydonlariga bog'lash |
| Timeout / tarmoq xatosi | "Server uyg'onmoqda…" banneri va avtomatik retry (2 marta) |
 
---
 
## 10. Bosqichlar va muddatlar
 
| Bosqich | Ishlar | Muddat |
|---|---|---|
| **0. Setup** | Next.js, Tailwind, shadcn, FSD papkalar, ESLint/Prettier, env | 0.5 kun |
| **1. Asos** | Tip generatsiyasi, axios + refresh queue, OTP login, AdminGuard, layout (sidebar, header, logout) | 1.5 kun |
| **2. Shared UI** | DataTable, useTableParams, StatusBadge, dialoglar, formatterlar | 1 kun |
| **3. Masters** | Ro'yxat (tablar), tafsilot, hujjatlar galereyasi, approve/reject | 1.5 kun |
| **4. Users** | Ro'yxat va filtrlar, block/unblock | 1 kun |
| **5. Orders** | Ro'yxat, tafsilot (timeline, offerlar, chat, ilovalar), dispute resolve | 2.5 kun |
| **6. Complaints** | Ro'yxat, tafsilot, take/close oqimi | 1.5 kun |
| **7. Catalog** | Kategoriya daraxti va formasi, xizmatlar ro'yxati va formasi | 2 kun |
| **8. Finance** | Invoice'lar va settlement, komissiyalar, ledger, reconciliation | 2.5 kun |
| **9. Overview + System** | KPI kartalar, reconciliation vidjeti, so'nggi faoliyat, reindex | 1 kun |
| **10. Sayqal** | i18n (uz/ru), dark mode, responsive, bo'sh va xato holatlari, deploy | 1.5 kun |
| | **Jami** | **~16.5 kun (≈ 3 hafta)** |
 
---
 
## 11. Qabul qilish mezonlari (har bosqich uchun)
 
- [ ] ADMIN bo'lmagan user dashboard'ga kira olmaydi
- [ ] Access token muddati tugaganda user sezmaydi (refresh ishlaydi), refresh token eskirganda login'ga qaytaradi
- [ ] Barcha jadvallarda pagination, sort va filtr URL'da saqlanadi (sahifa yangilanganda yo'qolmaydi)
- [ ] Har bir mutatsiyadan keyin toast chiqadi va ro'yxat yangilanadi
- [ ] Qaytarib bo'lmaydigan amallar (block, reject, resolve, settle, close weeks, reindex) tasdiqlash so'raydi
- [ ] Sabab maydonlarida belgilar chegarasi ko'rsatiladi (500 / 1000 / 2000)
- [ ] Cold start paytida tushunarli holat ko'rsatiladi
- [ ] Master hujjatlari har doim yangi presigned URL bilan ochiladi
 
---
 
## 12. Backend'ga so'rovlar (tavsiya)
 
| # | So'rov | Sabab |
|---|---|---|
| 1 | `GET /admin/stats` | Overview'ni bitta so'rovda olish (hozir 6–8 ta so'rov) |
| 2 | `GET /admin/users/{id}` | User tafsiloti sahifasi uchun |
| 3 | `admin/orders` ga `from`/`to` va `q` (qidiruv) filtrlari | Sana va matn bo'yicha qidirish uchun |
| 4 | Review moderatsiyasi (yashirish/o'chirish) | Hozir endpoint yo'q |
| 5 | Admin harakatlari audit log'i | Kim nimani qachon qilgani |
| 6 | Statistika uchun vaqt bo'yicha agregatsiya (kunlik buyurtmalar, daromad) | Overview'dagi grafiklar uchun |
| 7 | Bir nechta ADMIN bo'lsa, `assignedTo` uchun admin ismi | Shikoyatlarda kim ko'rib chiqayotganini ko'rsatish |
| 8 | CORS'ga dashboard domenini qo'shish | Deploy uchun |
 
---
 
## 13. Enum'lar ma'lumotnomasi
 
| Enum | Qiymatlar |
|---|---|
| UserRole | CUSTOMER, MASTER, ADMIN |
| UserStatus | ACTIVE, BLOCKED |
| VerificationStatus | NOT_SUBMITTED, PENDING, APPROVED, REJECTED |
| DocumentType | PASSPORT, SELFIE, CERTIFICATE, OTHER |
| OrderStatus | CREATED, SEARCHING, ACCEPTED, IN_PROGRESS, COMPLETED, COMMISSION, REVIEWED, CANCELLED, EXPIRED, DISPUTED |
| OfferStatus | PENDING, ACCEPTED, REJECTED, EXPIRED, CANCELLED |
| ComplaintReason | QUALITY, NO_SHOW, PRICE, BEHAVIOR, FRAUD, OTHER |
| ComplaintStatus | OPEN, IN_REVIEW, RESOLVED, REJECTED |
| DisputeResolution | COMPLETED, CANCELLED |
| CloseResult | RESOLVED, REJECTED |
| CatalogStatus | ACTIVE, INACTIVE |
| TransactionType | COMMISSION_CHARGE, COMMISSION_REVERSAL, COMMISSION_PAYMENT, ADJUSTMENT |
| CommissionStatus | ACCRUED, INVOICED, PAID, CANCELLED |
 
---
 
## 14. Admin endpointlar to'liq ro'yxati
 
| Method | Path | Sahifa |
|---|---|---|
| POST | `/auth/otp/request` | Login |
| POST | `/auth/otp/verify` | Login |
| POST | `/auth/refresh` | (interceptor) |
| POST | `/auth/logout` | Header |
| GET | `/me` | Guard |
| GET | `/admin/users` | Users |
| POST | `/admin/users/{id}/block` | Users |
| POST | `/admin/users/{id}/unblock` | Users |
| GET | `/admin/masters` | Masters |
| GET | `/admin/masters/{id}` | Master tafsiloti |
| POST | `/admin/masters/{id}/approve` | Master tafsiloti |
| POST | `/admin/masters/{id}/reject` | Master tafsiloti |
| GET | `/admin/orders` | Orders |
| GET | `/admin/orders/{id}` | Order tafsiloti |
| GET | `/admin/orders/{orderId}/chat/messages` | Order tafsiloti |
| POST | `/admin/orders/{id}/resolve` | Order tafsiloti |
| GET | `/admin/complaints` | Complaints |
| GET | `/admin/complaints/{id}` | Complaint tafsiloti |
| POST | `/admin/complaints/{id}/take` | Complaint tafsiloti |
| POST | `/admin/complaints/{id}/close` | Complaint tafsiloti |
| GET | `/admin/catalog/categories` | Kategoriyalar |
| POST | `/admin/catalog/categories` | Kategoriyalar |
| PUT | `/admin/catalog/categories/{id}` | Kategoriyalar |
| GET | `/admin/catalog/services` | Xizmatlar |
| POST | `/admin/catalog/services` | Xizmatlar |
| PUT | `/admin/catalog/services/{id}` | Xizmatlar |
| GET | `/admin/finance/invoices` | Invoice'lar |
| POST | `/admin/finance/settlements` | Invoice'lar |
| POST | `/admin/finance/invoices/close` | Invoice'lar |
| GET | `/admin/finance/commissions` | Komissiyalar |
| GET | `/admin/finance/transactions` | Ledger |
| GET | `/admin/finance/reconciliation` | Reconciliation, Overview |
| POST | `/admin/search/reindex` | System |
| GET | `/public/meta` | System |
| GET | `/masters/{id}/services` | Master tafsiloti (qo'shimcha) |
| GET | `/masters/{id}/portfolio` | Master tafsiloti (qo'shimcha) |
| GET | `/masters/{id}/reviews` | Master tafsiloti (qo'shimcha) |