# Usta Platform — Admin Dashboard: To'liq reja

> Manba: `https://usta-platform-nwtz.onrender.com/v3/api-docs` (OpenAPI)
> Base URL: `https://usta-platform-nwtz.onrender.com/api/v1`
> Auth: `Authorization: Bearer <accessToken>` (JWT)
> API versiyasi: **2026-11-26** (🆕 — yangi, ♻️ — o'zgargan)

---

## 1. Maqsad

Platforma administratori uchun veb-panel. U quyidagilarni boshqaradi:

- Masterlarni tekshirish va tasdiqlash (verification)
- Foydalanuvchilarni bloklash, blokdan chiqarish va o'chirish
- Buyurtmalarni kuzatish va nizolarni (dispute) hal qilish
- Shikoyatlarni ko'rib chiqish
- Katalog (kategoriyalar va xizmatlar, ularning ikonka va rasmlari)
- Moliya: komissiyalar, invoice'lar, to'lovlar, reconciliation
- Adminlar va ularning huquqlari (faqat super admin)
- Tizim: qidiruv indeksi, yetkazilmagan eventlar (outbox)

---

## 2. Muhim cheklovlar va kuzatuvlar

| #   | Kuzatuv                                                                                                                       | Ta'siri                                                                                           |
| --- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| 1   | Admin uchun alohida login yo'q, kirish SMS OTP orqali                                                                         | Login: telefon → kod → `user.roles` ichida `ADMIN` yoki `SUPER_ADMIN` borligini tekshirish        |
| 2   | Super admin server sozlamasi (`SUPER_ADMIN_PHONES`) orqali belgilanadi; boshqa adminlarni u `/admin/admins` orqali tayinlaydi | ADMIN rolini `/me/roles` orqali olib bo'lmaydi; birinchi super admin backend'da sozlanadi         |
| 3   | Har bir admin endpointi alohida huquq (`permissions`) talab qiladi                                                            | Menyu, sahifalar va tugmalar `user.permissions` bo'yicha ko'rsatiladi (§5.4)                      |
| 4   | Statistika endpointi yo'q                                                                                                     | KPI'lar list endpointlarning `totalElements`'idan olinadi (`size=1`)                              |
| 5   | `/auth/refresh` refresh tokenni har safar almashtiradi                                                                        | Refresh faqat bir marta, navbat (queue) bilan chaqirilishi kerak                                  |
| 6   | `401 TOKEN_OUTDATED`: admin huquqi o'zgarganda eski token yaroqsiz bo'ladi                                                    | Logout qilinmaydi: refresh qilinib, so'rov takrorlanadi (yangi token yangi huquqlar bilan keladi) |
| 7   | `403 USER_BLOCKED` har qanday so'rovda kelishi mumkin (bloklangan yoki o'chirilgan hisob)                                     | Sessiya tozalanib, login'ga yo'naltiriladi                                                        |
| 8   | Render bepul tarifi: cold start 30–60 s                                                                                       | Uzoq timeout, retry va "server uyg'onmoqda" holati kerak                                          |
| 9   | Hujjat, `imageUrl`, `avatarUrl` va chat `imageUrl` havolalari presigned (15 daqiqa)                                           | Tafsilot har ochilganda qayta yuklanadi, URL'lar keshlanmaydi va saqlanmaydi                      |
| 10  | Kategoriya va xizmatlarni o'chirish mumkin (arxivlash), `CATALOG` + `DELETE` huquqi kerak                                     | O'chirilganlar admin ro'yxatida chiqmaydi; vaqtincha yashirish uchun `status=INACTIVE`            |
| 11  | ADMIN'ni faqat super admin bloklaydi/blokdan chiqaradi/o'chiradi; SUPER_ADMIN'ni hech kim                                     | Tugmalar joriy adminning roli va maqsadli userning roliga qarab yashiriladi                       |
| 12  | Matn maydonlarida boshqaruv va ko'rinmas belgilar (`U+202E`, `U+200B` va h.k.) → `400 VALIDATION_FAILED`                      | Yuborishdan oldin matnlar tozalanadi (trim + ko'rinmas belgilarni olib tashlash)                  |
| 13  | Ro'yxatlarda noto'g'ri `?sort=` maydoni → `400 BAD_REQUEST`                                                                   | Faqat ma'lum ustunlar bo'yicha sort qilinadi                                                      |
| 14  | Cheklovlar: `429` + `Retry-After` sarlavhasi va `retryAfterSeconds`                                                           | Taymer bilan xabar ko'rsatiladi (asosan OTP'da)                                                   |
| 15  | Xato `title` endi `{0}` o'rinbosarlarisiz                                                                                     | Matnga emas, `code`'ga tayaniladi                                                                 |
| 16  | CORS                                                                                                                          | Dashboard domeni backend'da ruxsat etilgan bo'lishi kerak                                         |

---

## 3. Texnologiyalar

| Soha         | Tanlov                                                            |
| ------------ | ----------------------------------------------------------------- |
| Framework    | Next.js (App Router) + TypeScript                                 |
| Arxitektura  | FSD (Feature-Sliced Design)                                       |
| Server state | TanStack Query                                                    |
| HTTP         | Axios (interceptor: token qo'shish, 401 → refresh queue)          |
| API tiplari  | `openapi-typescript` yoki `orval`, `/v3/api-docs`'dan generatsiya |
| UI           | shadcn/ui + Tailwind CSS                                          |
| Jadval       | TanStack Table (server-side pagination/sort)                      |
| Formalar     | React Hook Form + Zod                                             |
| Grafiklar    | Recharts                                                          |
| Sana         | dayjs                                                             |
| i18n         | next-intl (uz, ru)                                                |
| Toast        | sonner                                                            |

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
│   │   ├── admins/page.tsx      # 🆕 faqat SUPER_ADMIN
│   │   └── system/page.tsx
│   └── providers.tsx
├── widgets/                     # Sidebar, Header, KpiCards, OrderTimeline, ChatViewer
├── features/                    # auth-otp, block-user, delete-user, approve-master, reject-master,
│                                # resolve-dispute, take-complaint, close-complaint,
│                                # category-form, service-form, delete-category, delete-service,
│                                # catalog-media (rasm/ikonka), settle-invoice, close-weeks,
│                                # appoint-admin, edit-admin-permissions, remove-admin, retry-outbox
├── entities/                    # user, admin, master, order, complaint, category, service,
│                                # commission, invoice, outbox (api + model + ui)
└── shared/
    ├── api/                     # axios instance, refresh queue, generated types
    ├── config/                  # env, routes, permissions
    ├── lib/                     # formatMoney, formatPhone, formatDate, statusColors, sanitizeText
    └── ui/                      # DataTable, StatusBadge, ConfirmDialog, ReasonDialog, Can, ImageUpload
```

---

## 5. Autentifikatsiya

### 5.1 Oqim

1. `POST /auth/otp/request` `{ phone }` → `expiresInSeconds`, `resendAfterSeconds`, `codeLength`. Cheklov: 60 s oraliq, raqamga soatiga 5, sutkasiga 10 SMS (oshsa `429`)
2. Kod kiritish (uzunligi `codeLength` bo'yicha), "Qayta yuborish" tugmasi uchun taymer
3. `POST /auth/otp/verify` `{ phone, code }` → `TokenResponse` (`user.roles`, `user.permissions`). Sutkasiga 15 ta noto'g'ri kod (oshsa `429`)
4. `user.roles` ichida `ADMIN` ham, `SUPER_ADMIN` ham bo'lmasa → `POST /auth/logout` qilib, "Ruxsat yo'q" xabarini ko'rsatish
5. Tokenlarni saqlash va `/` ga yo'naltirish

### 5.2 Token saqlash

- Variant A (tavsiya): Next.js route handler orqali `refreshToken`'ni httpOnly cookie'da saqlash, `accessToken`'ni xotirada
- Variant B (oddiy): ikkala tokenni ham `localStorage`'da saqlash (XSS xavfi bor)
- Logout: `POST /auth/logout` `{ refreshToken*, pushToken? }` (`pushToken` faqat mobil ilovalar uchun, panelda yuborilmaydi)

### 5.3 Refresh queue

- 401 kelganda (shu jumladan `TOKEN_OUTDATED`) bitta `POST /auth/refresh` chaqiriladi, qolgan so'rovlar navbatda kutadi
- Muvaffaqiyatli bo'lsa navbatdagi so'rovlar qayta yuboriladi
- Xato bo'lsa (`INVALID_REFRESH_TOKEN`, `REFRESH_TOKEN_REUSED`) logout qilinib, `/login`'ga yo'naltiriladi
- `accessTokenExpiresAt`'ga qarab muddati tugashidan oldin proaktiv refresh qilish mumkin
- Refresh'dan keyin `user.permissions` yangilanadi (menyu darhol o'zgaradi)

### 5.4 Guard va huquqlar

- `(dashboard)/layout.tsx` ichida `GET /me` chaqiriladi: `roles` ichida `ADMIN` yoki `SUPER_ADMIN`, `status === 'ACTIVE'`
- `status` `BLOCKED` yoki `DELETED` bo'lsa, yoki istalgan so'rovga `403 USER_BLOCKED` kelsa → logout
- `GET /me` → `permissions[]`. SUPER_ADMIN barcha huquqlarga ega

| Huquq         | Ochadigan bo'lim / amal                                          |
| ------------- | ---------------------------------------------------------------- |
| `USERS`       | Users (ro'yxat, block/unblock)                                   |
| `MASTERS`     | Masters (ro'yxat, tafsilot, approve/reject)                      |
| `CATALOG`     | Catalog (kategoriyalar, xizmatlar, rasm va ikonkalar)            |
| `ORDERS`      | Orders (ro'yxat, tafsilot, chat, dispute resolve)                |
| `FINANCE`     | Finance (invoice, settlement, komissiya, ledger, reconciliation) |
| `COMPLAINTS`  | Complaints (take/close) + buyurtma chatini o'qish                |
| `SYSTEM`      | System (reindex, outbox)                                         |
| `DELETE`      | O'chirish tugmalari (`USERS` yoki `CATALOG` bilan birga)         |
| `SUPER_ADMIN` | Admins bo'limi + hammasi                                         |

- Sidebar bandlari, route'lar va tugmalar huquq bo'yicha yashiriladi; huquqsiz sahifaga URL orqali kirilsa "Ruxsat yo'q" holati
- Buyurtma chati `ORDERS` yoki `COMPLAINTS` bilan ochiladi

---

## 6. Sahifalar (batafsil)

### 6.1 Overview (`/`)

**KPI kartalar** (har biri `size=1` so'rovidan olingan `totalElements`; karta faqat tegishli huquq bo'lsa ko'rsatiladi):

| Karta                            | So'rov                                          | Huquq        | Bosilganda                     |
| -------------------------------- | ----------------------------------------------- | ------------ | ------------------------------ |
| Tasdiqlash kutayotgan masterlar  | `GET /admin/masters?status=PENDING&size=1`      | `MASTERS`    | `/masters?status=PENDING`      |
| Ochiq nizolar                    | `GET /admin/orders?status=DISPUTED&size=1`      | `ORDERS`     | `/orders?status=DISPUTED`      |
| Ochiq shikoyatlar                | `GET /admin/complaints?status=OPEN&size=1`      | `COMPLAINTS` | `/complaints?status=OPEN`      |
| Ko'rib chiqilayotgan shikoyatlar | `GET /admin/complaints?status=IN_REVIEW&size=1` | `COMPLAINTS` | `/complaints?status=IN_REVIEW` |
| Faol buyurtmalar                 | `status=SEARCHING`, `ACCEPTED`, `IN_PROGRESS`   | `ORDERS`     | `/orders`                      |
| Bloklangan userlar               | `GET /admin/users?status=BLOCKED&size=1`        | `USERS`      | `/users?status=BLOCKED`        |
| 🆕 Yetkazilmagan eventlar        | `GET /admin/outbox/dead` (massiv uzunligi)      | `SYSTEM`     | `/system`                      |

**Reconciliation vidjeti** (`FINANCE`): `GET /admin/finance/reconciliation` (oxirgi 7 kun). `ok=true` bo'lsa yashil, aks holda `mismatches.length` qizilda ko'rsatiladi.

**So'nggi faoliyat:** oxirgi 5 ta DISPUTED buyurtma va oxirgi 5 ta OPEN shikoyat.

---

### 6.2 Users (`/users`) — `USERS`

**Endpoint:** `GET /admin/users?phone=&role=&status=&page=&size=&sort=` ♻️

**Filtrlar:** telefon (qisman, debounce 400 ms), rol (CUSTOMER / MASTER / ADMIN / SUPER_ADMIN), status (ACTIVE / BLOCKED / DELETED)

- O'chirilgan userlar faqat `status=DELETED` tanlanganda chiqadi, ularda `phone` bo'sh, amallar yo'q

**Ustunlar:** Telefon · Rollar (badge) · Status · Blok sababi · Oxirgi kirish · Ro'yxatdan o'tgan sana · Amallar

**Amallar:**

- **Block** ♻️: `POST /admin/users/{id}/block` `{ reason* ≤500 }`. Sabab kiritiladigan modal ochiladi. Ogohlantirish: userning barcha sessiyalari tugatiladi.
  - ADMIN qatorida tugma faqat SUPER_ADMIN'ga ko'rinadi (`403 ADMIN_REQUIRES_SUPER_ADMIN`)
  - SUPER_ADMIN qatorida tugma hech qachon ko'rinmaydi (`409 CANNOT_BLOCK_ADMIN`)
- **Unblock** ♻️: `POST /admin/users/{id}/unblock`, tasdiqlash dialogi bilan. ADMIN uchun faqat SUPER_ADMIN.
- **Delete** 🆕: `DELETE /admin/users/{id}` (`USERS` + `DELETE`) → `204`. Hisob anonimlashtiriladi, **qaytarib bo'lmaydi**: telefon, ism, manzillar, hujjat va rasmlar o'chiriladi; buyurtma va komissiya tarixi egasiz saqlanadi. Ikki bosqichli tasdiqlash (telefonni qayta yozish). Xatolar:

| Kod                          | Xabar                                         |
| ---------------------------- | --------------------------------------------- |
| `USER_HAS_ACTIVE_ORDERS`     | Boshlangan yoki nizodagi buyurtmasi bor       |
| `USER_HAS_DEBT`              | Ustaning komissiya qarzi bor (summa bilan)    |
| `CANNOT_DELETE_SELF`         | O'z hisobingizni o'chira olmaysiz             |
| `SUPER_ADMIN_IMMUTABLE`      | Super adminni o'chirib bo'lmaydi              |
| `USER_DELETED`               | Hisob allaqachon o'chirilgan                  |
| `ADMIN_REQUIRES_SUPER_ADMIN` | Adminni faqat super admin o'chira oladi (403) |

**Qo'shimcha:** MASTER rolli userda "Master profili" havolasi (`/masters/{id}`), CUSTOMER'da "Buyurtmalari" havolasi (`/orders?customerId={id}`)

---

### 6.3 Masters (`/masters`, `/masters/[id]`) — `MASTERS`

**Ro'yxat:** `GET /admin/masters?status=&page=&size=&sort=`

- Status bo'yicha tablar: PENDING (default, `sort=submittedAt,asc`) · APPROVED · REJECTED · NOT_SUBMITTED · Hammasi
- Ustunlar: Avatar + ism · Telefon · Tajriba (yil) · Reyting (`ratingAvg` / `ratingCount`) · Status · Yuborilgan sana (`submittedAt`) · Faol

**Tafsilot:** `GET /admin/masters/{id}` → `phone`, `profile`, `documents[]`

- Profil: ism, bio, tajriba, ish radiusi, `workLocation` (xaritada ko'rsatish, Leaflet/OSM), reyting, sanalar
- Hujjatlar galereyasi: `PASSPORT`, `SELFIE`, `CERTIFICATE`, `OTHER` turlari bo'yicha guruhlanadi. Rasmlar lightbox'da, PDF yangi tabda ochiladi.
- Qo'shimcha ma'lumot (public endpointlar): `GET /masters/{id}/services`, `/portfolio`, `/masters/{masterId}/reviews`
- Tegishli buyurtmalar: `GET /admin/orders?masterId={id}` (`ORDERS` bo'lsa)
- Moliya havolasi: `/finance/ledger?masterId={id}` (`FINANCE` bo'lsa)

**Amallar:**

- **Approve:** `POST /admin/masters/{id}/approve` (faqat PENDING holatda)
- **Reject:** `POST /admin/masters/{id}/reject` `{ reason* ≤1000 }` (PENDING yoki APPROVED holatda). Sabab ustaga ko'rsatiladi. Tayyor sabablar ro'yxati beriladi ("Pasport rasmi aniq emas", "Selfi mos kelmaydi" va h.k.), ularni tahrirlash mumkin.

**Holatlar oqimi:**

```
NOT_SUBMITTED → (master yuboradi) → PENDING → APPROVED
                                       ↓         ↓
                                    REJECTED ←───┘
REJECTED → (master hujjatlarni qayta yuklab yuboradi) → PENDING
```

Eslatma: tekshiruvga yuborilgan yoki tasdiqlangan ustada ism va avatar o'zgarmaydi (`IDENTITY_LOCKED`).

---

### 6.4 Orders (`/orders`, `/orders/[id]`) — `ORDERS`

**Ro'yxat:** `GET /admin/orders?status=&customerId=&masterId=&serviceId=&page=&size=&sort=`

- Filtrlar: status, xizmat (select, `GET /admin/catalog/services` orqali), masterId, customerId (URL parametri sifatida)
- "Nizolar" tezkor tabi: `status=DISPUTED&sort=updatedAt,asc`
- Ustunlar: ID (qisqa) · Status · Xizmat · Manzil · Rejalashtirilgan vaqt · Boshlang'ich narx · Yakuniy narx · Master · Yaratilgan sana
- O'chirilgan xizmat eski buyurtmalarda nomi bilan qoladi; o'chirilgan user ismi "Oʻchirilgan foydalanuvchi" yoki `null`

**Status ranglari:**

| Status                          | Rang    |
| ------------------------------- | ------- |
| CREATED, SEARCHING              | ko'k    |
| ACCEPTED, IN_PROGRESS           | sariq   |
| COMPLETED, COMMISSION, REVIEWED | yashil  |
| CANCELLED, EXPIRED              | kulrang |
| DISPUTED                        | qizil   |

**Tafsilot:** `GET /admin/orders/{id}` → `order`, `customer`, `commissionAmount`, `offers[]`

- Asosiy ma'lumot: xizmat, tavsif, manzil, sanalar, narxlar, komissiya
- Mijoz va master kartalari (profillarga havola bilan). `phone` faqat ish faol bo'lganda (ACCEPTED / IN_PROGRESS) keladi
- **Timeline:** `order.history[]` (`from → to`, kim o'zgartirgan, sabab, vaqt). Usta voz kechsa buyurtma `CANCELLED` emas, yana `SEARCHING` bo'ladi — timeline'da shunday ko'rinadi
- **Offerlar jadvali:** master, status, masofa, yuborilgan / tugash / javob berilgan vaqt
- **Ilovalar:** rasm va videolar (`attachments[]`)
- **Chat** ♻️: `GET /admin/orders/{orderId}/chat/messages?before=&limit=100` (`ORDERS` yoki `COMPLAINTS`). Faqat o'qish uchun, "eskiroqlarini yuklash" tugmasi bilan (cursor = oxirgi xabar `id`). Xabarlar `senderId` bo'yicha mijoz yoki master sifatida ajratiladi. Rasmli xabarda `imageUrl` bor, `content` bo'sh bo'lishi mumkin (15 daqiqalik havola). Chat har usta bilan alohida: usta almashsa tarix yangidan boshlanadi.
- Tegishli shikoyatlar: `GET /admin/complaints?orderId={id}` (`COMPLAINTS` bo'lsa)

**Nizoni hal qilish** ♻️ (faqat `status=DISPUTED` bo'lganda):
`POST /admin/orders/{id}/resolve`

```json
{ "resolution": "COMPLETED | CANCELLED", "note": "≤500", "price": 1 }
```

- `resolution` va `note` majburiy
- `COMPLETED` tanlansa va buyurtmada narx bo'lmasa, `price` majburiy (`PRICE_REQUIRED`); `price` kamida 1
- Formada ogohlantirish: COMPLETED tanlansa komissiya hisoblanadi

---

### 6.5 Complaints (`/complaints`, `/complaints/[id]`) — `COMPLAINTS`

**Ro'yxat:** `GET /admin/complaints?status=&orderId=&againstUserId=&authorId=&page=&size=&sort=`

- Tablar: OPEN (default, `sort=createdAt,asc`) · IN_REVIEW · RESOLVED · REJECTED
- Ustunlar: Sabab (QUALITY / NO_SHOW / PRICE / BEHAVIOR / FRAUD / OTHER) · Dispute belgisi · Buyurtma · Muallif · Kimga qarshi · Status · Sana

**Tafsilot:** `GET /admin/complaints/{id}` → `complaint`, `orderStatus`, `assignedTo`, `complaintsAgainstUser`

- `complaintsAgainstUser` > 2 bo'lsa ogohlantirish beriladi ("Bu userga qarshi N ta shikoyat")
- Buyurtma tafsilotiga va chatiga havola
- `assignedTo` (uuid): SUPER_ADMIN uchun `GET /admin/admins` ro'yxatidan telefon bilan ko'rsatiladi, boshqalarda "Siz" / qisqa ID

**Oqim:**

```
OPEN → (take) → IN_REVIEW → (close) → RESOLVED | REJECTED
```

**Amallar:**

- **Take:** `POST /admin/complaints/{id}/take` (OPEN holatda)
- **Close:** `POST /admin/complaints/{id}/close`

```json
{
	"result": "RESOLVED | REJECTED",
	"note": "≤2000",
	"orderResolution": "COMPLETED | CANCELLED",
	"price": 1
}
```

- `orderResolution` maydoni faqat buyurtma DISPUTED holatda bo'lsa ko'rsatiladi va majburiy (`ORDER_RESOLUTION_REQUIRED`)
- Natijadan keyin kerak bo'lsa userni bloklash uchun tezkor tugma (`/users`, `USERS` bo'lsa)

---

### 6.6 Catalog — `CATALOG`

#### Umumiy: ikonka va rasmlar 🆕

- **Tayyor ikonkalar:** `GET /public/catalog/icons` → `[{ key, name, url }]`. `key` kategoriya/xizmatning `icon` maydoniga yoziladi (to'plamda bo'lmasa `400 UNKNOWN_ICON`). Formada `IconPicker` (qidiruv bilan grid).
- **Ko'rsatish:** `iconUrl` — `/api/v1/public/catalog/icons/{key}.svg` ko'rinishidagi **nisbiy** yo'l (bir rangli SVG, `currentColor`, keshlanadi; API proxy orqali ochiladi) yoki admin yuklagan faylning **to'liq** havolasi. `null` bo'lsa standart ikonka. `customIcon=true` — admin yuklagan ikonka.
- **Yuklash:** `multipart/form-data`, maydon `file`. Fayl turi mazmunidan aniqlanadi, SVG qabul qilinmaydi, EXIF o'chiriladi. Frontend fayl turi, hajmi va o'lchamini oldindan tekshiradi:

| Maqsad       | Endpoint                               | Turlar          | Hajm   | O'lcham (px)     |
| ------------ | -------------------------------------- | --------------- | ------ | ---------------- |
| Rasm         | `PUT /admin/catalog/{type}/{id}/image` | JPEG, PNG, WEBP | 5 MB   | 200–4096         |
| O'z ikonkasi | `PUT /admin/catalog/{type}/{id}/icon`  | PNG, WEBP       | 512 KB | 48–1024, kvadrat |

- `{type}` = `categories` | `services`. Olib tashlash: `DELETE .../image`, `DELETE .../icon`. Hammasi yangilangan obyektni qaytaradi.
- Yuklash xatolari: `FILE_EMPTY`, `FILE_TOO_LARGE` (413), `FILE_TYPE_NOT_ALLOWED` (415), `IMAGE_INVALID`, `IMAGE_DIMENSIONS`, `IMAGE_NOT_SQUARE`
- `imageUrl` 15 daqiqalik havola — keshlanmaydi
- PUT'da `icon` (kalit) berilsa yuklangan ikonka o'chadi; `icon: null` bo'lsa yuklangani qoladi

#### Kategoriyalar (`/catalog/categories`)

- `GET /admin/catalog/categories` ♻️ flat ro'yxat qaytaradi (o'chirilganlar chiqmaydi), frontend'da `parentId` orqali daraxtga yig'iladi
- Javob: `id, parentId, slug, name{uz,ru,en,uzCyrl}, icon, iconUrl, customIcon, imageUrl, sortOrder, status, createdAt, updatedAt`
- Daraxt ko'rinishi: ochish/yopish, `sortOrder` bo'yicha tartib, ikonka, INACTIVE kategoriyalar xira ko'rinadi
- **Yaratish** ♻️: `POST /admin/catalog/categories`
- **Tahrirlash** ♻️: `PUT /admin/catalog/categories/{id}` (ko'chirish, nomini o'zgartirish, faolsizlantirish)
- **O'chirish** 🆕: `DELETE /admin/catalog/categories/{id}` (`CATALOG` + `DELETE`) → `204`
  1. Avval `cascade`'siz chaqiriladi
  2. Ichi bo'sh bo'lmasa `409 CATEGORY_NOT_EMPTY` (`categories`, `services` sonlari bilan) → dialog: "Ichida N ta kategoriya va M ta xizmat bor. Hammasi o'chadi"
  3. Tasdiqlansa `?cascade=true` — butun shox xizmatlari bilan o'chadi
- **Rasm / ikonka:** yuqoridagi umumiy qism bo'yicha (tahrirlash dialogida)

**Forma (CategoryRequest):**

| Maydon        | Validatsiya                                                                                                                                     |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `name.uz` *   | 2–120                                                                                                                                           |
| `name.ru` *   | 2–120                                                                                                                                           |
| `name.en` *   | 2–120                                                                                                                                           |
| `name.uzCyrl` | ≤120, ixtiyoriy (bo'sh bo'lsa lotinchadan avtomatik o'giriladi)                                                                                 |
| `slug` *      | ≤80, `^[a-z0-9]+(-[a-z0-9]+)*$` (`name.uz`'dan avtomatik yaratish mumkin), band bo'lsa `SLUG_TAKEN`                                             |
| `parentId`    | select (null = root). O'zini yoki o'z avlodini tanlashga ruxsat berilmaydi (`CATEGORY_CYCLE`), chuqurlik cheklangan (`CATEGORY_DEPTH_EXCEEDED`) |
| `icon`        | ≤255, faqat to'plamdagi kalit (`IconPicker`)                                                                                                    |
| `sortOrder`   | 0–100000                                                                                                                                        |
| `status`      | ACTIVE / INACTIVE                                                                                                                               |

#### Xizmatlar (`/catalog/services`)

- `GET /admin/catalog/services?categoryId=` ♻️ (chapda kategoriya filtri, o'chirilganlar chiqmaydi)
- Ustunlar: Ikonka · Rasm · Nomi (uz) · Slug · Kategoriya · Tartib · Status · Yangilangan sana
- **Yaratish** ♻️: `POST /admin/catalog/services`, **tahrirlash** ♻️: `PUT /admin/catalog/services/{id}`
- **O'chirish** 🆕: `DELETE /admin/catalog/services/{id}` (`CATALOG` + `DELETE`) → `204`. Ogohlantirish: "Ustalarning shu xizmatga narxlari ham o'chadi; eski buyurtmalar o'zgarmaydi"
- **Forma (ServiceRequest):** `categoryId*`, `name{uz*,ru*,en*,uzCyrl}` (2–120), `slug*`, `description{uz,ru,en,uzCyrl}` (har biri ≤2000), `icon` (to'plamdagi kalit), `sortOrder`, `status`
- Til tablari: uz / uz-Cyrl / ru / en

---

### 6.7 Finance — `FINANCE`

#### Invoice'lar (`/finance/invoices`)

- `GET /admin/finance/invoices?period=&masterId=` ♻️
- `period` uchun hafta tanlagich (dushanba sanasi, aks holda `INVALID_PERIOD`)
- Javob: `masterId, period, orders, accrued, invoiced, paid, onHold, due, dueDate`
- Ustunlar: Master · Hafta · Buyurtmalar soni · Hisoblangan (accrued) · Invoice qilingan · To'langan · Ushlab turilgan (`onHold`) · Qarz (`due`) · To'lov muddati (`dueDate`)
- Muddati o'tgan va `due > 0` bo'lganlar qizil rangda
- **To'lovni qayd etish** ♻️: `POST /admin/finance/settlements`

```json
{ "masterId": "uuid", "period": "YYYY-MM-DD", "amount": 0, "reference": "≤128" }
```

- `amount` hisobdagi `due`'ga teng bo'lishi shart (ortiqcha to'lov chegirilgan), forma avtomatik to'ldiradi
- Xatolar: `AMOUNT_MISMATCH` (to'g'ri summa xabarda), `NOTHING_TO_SETTLE`
- Faqat INVOICED hafta uchun
- **Haftalarni yopish:** `POST /admin/finance/invoices/close`. Tasdiqlash bilan; natijadagi map toast'da ko'rsatiladi. Idempotent, odatda tizim buni har soatda o'zi qiladi.

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

### 6.8 System (`/system`) — `SYSTEM`

- Server meta ma'lumoti: `GET /public/meta` (versiya, server vaqti)
- **Qidiruv indeksini qayta qurish:** `POST /admin/search/reindex`. Ikki bosqichli tasdiqlash bilan, natija (map) ko'rsatiladi. Odatda kerak emas — indeks eventlar orqali yangilanadi.
- **Yetkazilmagan eventlar** 🆕: `GET /admin/outbox/dead?limit=` → urinishlari tugagan ichki eventlar (eng eskisidan)
  - Ustunlar: `eventType` · `aggregateType` · `aggregateId` (CopyId) · `attempts` · `lastError` (qisqartirilgan, to'liq matn tooltip'da) · `createdAt`
  - Bo'sh bo'lsa yashil "Hammasi yetkazilgan" holati
- **Qayta navbatga qo'yish** 🆕: `POST /admin/outbox/dead/retry` — hammasini qayta navbatga qo'yadi (xato sababi bartaraf etilgandan keyin). Tasdiqlash bilan, natijadagi map toast'da, keyin ro'yxat yangilanadi.

---

### 6.9 Admins (`/admins`) 🆕 — faqat `SUPER_ADMIN`

**Ro'yxat:** `GET /admin/admins` → `[{ id, phone, superAdmin, permissions[], status, lastLoginAt, createdAt }]` (super adminlar bilan, pagination yo'q)

- Ustunlar: Telefon · Super admin belgisi · Huquqlar (chip'lar) · Status · Oxirgi kirish · Tayinlangan sana · Amallar
- Huquq nomlari: `GET /admin/admins/permissions` → `[{ code, name }]` (`name` `Accept-Language` tilida)
- `superAdmin=true` qatorlarida amallar yo'q (`409 SUPER_ADMIN_IMMUTABLE` — u server sozlamasi orqali belgilanadi)

**Amallar:**

- **Tayinlash:** `POST /admin/admins` `{ phone* ≤25, permissions* (kamida bittasi) }` → `201`. Telefon bo'yicha; hisob bo'lmasa yaratiladi. Forma: `PhoneInput` + huquqlar checkbox ro'yxati. Xato: `CANNOT_APPOINT_BLOCKED` (bloklangan userni admin qilib bo'lmaydi).
- **Huquqlarni o'zgartirish:** `PUT /admin/admins/{id}` `{ permissions* }` — to'liq almashtiriladi. Ogohlantirish: adminning eski tokeni darhol `401 TOKEN_OUTDATED` oladi (u sezmaydi, refresh orqali yangi huquqlar bilan davom etadi).
- **Adminlikni olib tashlash:** `DELETE /admin/admins/{id}` → `204`. Tasdiqlash bilan; mijoz/usta rollari qoladi.

---

## 7. Umumiy komponentlar (`shared/ui`)

| Komponent        | Vazifasi                                                                                            |
| ---------------- | --------------------------------------------------------------------------------------------------- |
| `DataTable`      | Server-side pagination (`page` 0 dan boshlanadi), sort (`field,DIR`), loading skeleton, bo'sh holat |
| `useTableParams` | Filtr, page va sort'ni URL search params bilan sinxronlash                                          |
| `StatusBadge`    | Barcha enum'lar uchun rang va matn                                                                  |
| `ConfirmDialog`  | Qaytarib bo'lmaydigan amallar uchun                                                                 |
| `ReasonDialog`   | Block, reject va resolve uchun sabab kiritish (belgilar hisoblagichi bilan)                         |
| `MoneyText`      | `formatMoney` (UZS, bo'sh joy bilan ajratish)                                                       |
| `PhoneText`      | `+998 90 123 45 67` formati                                                                         |
| `CopyId`         | UUID'ni qisqa ko'rsatish va nusxalash                                                               |
| `ErrorState`     | API xatosi (`code` / `message`) va "Qayta urinish" tugmasi                                          |
| 🆕 `Can`         | `permission` / `superAdmin` bo'yicha bolalarni ko'rsatish yoki yashirish (`usePermissions` hook)    |
| 🆕 `ImageUpload` | Fayl tanlash, preview, tur/hajm/o'lcham/kvadratlikni oldindan tekshirish, olib tashlash tugmasi     |
| 🆕 `IconPicker`  | `/public/catalog/icons` grid'i, qidiruv, tanlangan `key`                                            |
| 🆕 `CatalogIcon` | `iconUrl` (nisbiy SVG yoki to'liq havola) yoki standart ikonkani ko'rsatish                         |

---

## 8. API qatlami

```ts
// shared/api/client.ts
const api = axios.create({ baseURL: env.API_URL + '/api/v1', timeout: 60_000 });

api.interceptors.request.use(cfg => {
	const t = tokenStore.access;
	if (t) cfg.headers.Authorization = `Bearer ${t}`;
	cfg.headers['Accept-Language'] = locale.current; // uz | uz-Cyrl | ru | en
	return cfg;
});

let refreshing: Promise<string> | null = null;
api.interceptors.response.use(undefined, async err => {
	const original = err.config;
	if (err.response?.status === 403 && err.response.data?.code === 'USER_BLOCKED') {
		await logout(); // bloklangan yoki o'chirilgan hisob
		throw err;
	}
	// 401 UNAUTHORIZED va TOKEN_OUTDATED bir xil: refresh + takrorlash
	if (err.response?.status !== 401 || original._retry) throw err;
	original._retry = true;
	refreshing ??= refreshTokens().finally(() => (refreshing = null));
	const access = await refreshing; // xato bo'lsa → logout
	original.headers.Authorization = `Bearer ${access}`;
	return api(original);
});
```

**Fayl yuklash:** `FormData` ga `file` qo'shiladi, `Content-Type` axios'ga qoldiriladi (boundary uchun).

**Query key konvensiyasi:**

```ts
['admin', 'users', params]
['admin', 'masters', params] / ['admin', 'master', id]
['admin', 'orders', params]  / ['admin', 'order', id]
['admin', 'complaints', params] / ['admin', 'complaint', id]
['admin', 'categories'] / ['admin', 'services', { categoryId }]
['admin', 'finance', 'invoices', params] ...
['admin', 'admins'] / ['admin', 'permissions']   // 🆕
['admin', 'outbox', 'dead', { limit }]           // 🆕
['public', 'icons']                              // 🆕 (staleTime: Infinity)
```

Mutatsiyadan keyin tegishli ro'yxat va tafsilot invalidate qilinadi, overview KPI'lari ham yangilanadi. O'z huquqlari o'zgargan bo'lsa `/me` qayta olinadi.

**Tiplarni generatsiya qilish:**

```bash
npx openapi-typescript https://usta-platform-nwtz.onrender.com/v3/api-docs -o src/shared/api/schema.d.ts
```

---

## 9. Xatolarni boshqarish

Xatolar RFC 9457 (`application/problem+json`), har doim `code` bo'yicha ishlanadi.

| Holat                                                        | Xatti-harakat                                                   |
| ------------------------------------------------------------ | --------------------------------------------------------------- |
| 401 `UNAUTHORIZED` / `TOKEN_OUTDATED`                        | Refresh queue → muvaffaqiyatsiz bo'lsa logout                   |
| 401 `INVALID_REFRESH_TOKEN` / `REFRESH_TOKEN_REUSED`         | Logout, login'ga                                                |
| 403 `USER_BLOCKED`                                           | Sessiyani tozalash, login'ga                                    |
| 403 `ACCESS_DENIED` / `ADMIN_REQUIRES_SUPER_ADMIN`           | "Ruxsat yo'q" sahifasi yoki toast                               |
| 404                                                          | "Topilmadi" bo'sh holati                                        |
| 409 (masalan, holat allaqachon o'zgargan)                    | Toast va ma'lumotni qayta yuklash                               |
| 400 / `VALIDATION_FAILED`                                    | Xatolarni forma maydonlariga bog'lash                           |
| 413 `FILE_TOO_LARGE`, 415 `FILE_TYPE_NOT_ALLOWED`, `IMAGE_*` | Yuklash maydoni ostida xabar                                    |
| 429 `TOO_MANY_REQUESTS` / `OTP_*`                            | `Retry-After` / `retryAfterSeconds` bo'yicha taymer bilan xabar |
| Timeout / tarmoq xatosi                                      | "Server uyg'onmoqda…" banneri va avtomatik retry (2 marta)      |

---

## 10. Bosqichlar va muddatlar

| Bosqich                   | Ishlar                                                                                                               | Muddat                    |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| **0. Setup**              | Next.js, Tailwind, shadcn, FSD papkalar, ESLint/Prettier, env                                                        | 0.5 kun                   |
| **1. Asos**               | Tip generatsiyasi, axios + refresh queue, OTP login, AdminGuard, layout (sidebar, header, logout)                    | 1.5 kun                   |
| **2. Shared UI**          | DataTable, useTableParams, StatusBadge, dialoglar, formatterlar                                                      | 1 kun                     |
| **3. Masters**            | Ro'yxat (tablar), tafsilot, hujjatlar galereyasi, approve/reject                                                     | 1.5 kun                   |
| **4. Users**              | Ro'yxat va filtrlar, block/unblock                                                                                   | 1 kun                     |
| **5. Orders**             | Ro'yxat, tafsilot (timeline, offerlar, chat, ilovalar), dispute resolve                                              | 2.5 kun                   |
| **6. Complaints**         | Ro'yxat, tafsilot, take/close oqimi                                                                                  | 1.5 kun                   |
| **7. Catalog**            | Kategoriya daraxti va formasi, xizmatlar ro'yxati va formasi                                                         | 2 kun                     |
| **8. Finance**            | Invoice'lar va settlement, komissiyalar, ledger, reconciliation                                                      | 2.5 kun                   |
| **9. Overview + System**  | KPI kartalar, reconciliation vidjeti, so'nggi faoliyat, reindex                                                      | 1 kun                     |
| **10. Sayqal**            | i18n (uz/ru), dark mode, responsive, bo'sh va xato holatlari, deploy                                                 | 1.5 kun                   |
| **11. API 2026-11-26** 🆕 | Tiplarni qayta generatsiya; huquqlar (`Can`, sidebar, route guard); `TOKEN_OUTDATED`/`USER_BLOCKED`; Admins sahifasi | 1.5 kun                   |
|                           | Catalog: 3 til majburiy + `uzCyrl`, IconPicker, rasm/ikonka yuklash, kategoriya (cascade) va xizmat o'chirish        | 1.5 kun                   |
|                           | User delete; filtrlarga `SUPER_ADMIN`/`DELETED`; finance `onHold`/`due`; chat `imageUrl`; outbox; matn tozalash      | 1 kun                     |
|                           | **Jami**                                                                                                             | **~20.5 kun (≈ 4 hafta)** |

---

## 11. Qabul qilish mezonlari (har bosqich uchun)

- [ ] ADMIN yoki SUPER_ADMIN bo'lmagan user dashboard'ga kira olmaydi
- [ ] Access token muddati tugaganda user sezmaydi (refresh ishlaydi), refresh token eskirganda login'ga qaytaradi
- [ ] Huquqi o'zgargan admin (`TOKEN_OUTDATED`) sessiyadan chiqmaydi, menyusi yangi huquqlarga moslashadi
- [ ] `USER_BLOCKED` kelganda sessiya tozalanadi va login'ga yo'naltiriladi
- [ ] Huquqi yo'q bo'lim menyuda ko'rinmaydi va URL orqali ham ochilmaydi
- [ ] O'chirish tugmalari `DELETE` huquqisiz ko'rinmaydi; Admins bo'limi faqat SUPER_ADMIN'ga
- [ ] ADMIN qatorida Block/Unblock/Delete faqat SUPER_ADMIN'ga, SUPER_ADMIN qatorida hech kimga ko'rinmaydi
- [ ] Barcha jadvallarda pagination, sort va filtr URL'da saqlanadi (sahifa yangilanganda yo'qolmaydi)
- [ ] Har bir mutatsiyadan keyin toast chiqadi va ro'yxat yangilanadi
- [ ] Qaytarib bo'lmaydigan amallar (block, delete, reject, resolve, settle, close weeks, reindex, outbox retry, admin remove) tasdiqlash so'raydi
- [ ] Sabab maydonlarida belgilar chegarasi ko'rsatiladi (500 / 1000 / 2000)
- [ ] Fayl yuklashda tur, hajm va o'lcham serverga yuborishdan oldin tekshiriladi
- [ ] Yuborilayotgan matnlarda ko'rinmas/boshqaruv belgilari tozalanadi
- [ ] Cold start paytida tushunarli holat ko'rsatiladi
- [ ] Master hujjatlari va barcha `imageUrl`'lar har doim yangi presigned URL bilan ochiladi

---

## 12. Backend'ga so'rovlar (tavsiya)

| #   | So'rov                                                                   | Sabab                                                                            |
| --- | ------------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| 1   | `GET /admin/stats`                                                       | Overview'ni bitta so'rovda olish (hozir 6–8 ta so'rov)                           |
| 2   | `GET /admin/users/{id}`                                                  | User tafsiloti sahifasi uchun                                                    |
| 3   | `admin/orders` ga `from`/`to` va `q` (qidiruv) filtrlari                 | Sana va matn bo'yicha qidirish uchun                                             |
| 4   | Review moderatsiyasi (yashirish/o'chirish)                               | Hozir endpoint yo'q                                                              |
| 5   | Admin harakatlari audit log'i                                            | Kim nimani qachon qilgani (ayniqsa delete va huquq o'zgarishlari uchun)          |
| 6   | Statistika uchun vaqt bo'yicha agregatsiya (kunlik buyurtmalar, daromad) | Overview'dagi grafiklar uchun                                                    |
| 7   | `assignedTo` uchun admin telefoni/ismi (qisman hal: `/admin/admins`)     | `/admin/admins` faqat SUPER_ADMIN'ga ochiq; oddiy admin boshqa adminni ko'rmaydi |
| 8   | CORS'ga dashboard domenini qo'shish                                      | Deploy uchun                                                                     |
| 9   | `/admin/masters` ga ism bo'yicha qidiruv                                 | Master tanlagich hozir client-side qidiradi                                      |
| 10  | `GET /admin/outbox/dead` uchun jami son (yoki pagination)                | KPI kartasi uchun `limit`'siz to'liq ro'yxat olinmasligi uchun                   |

---

## 13. Enum'lar ma'lumotnomasi

| Enum               | Qiymatlar                                                                                                |
| ------------------ | -------------------------------------------------------------------------------------------------------- |
| UserRole ♻️        | CUSTOMER, MASTER, ADMIN, SUPER_ADMIN                                                                     |
| UserStatus ♻️      | ACTIVE, BLOCKED, DELETED                                                                                 |
| AdminPermission 🆕 | USERS, MASTERS, CATALOG, ORDERS, FINANCE, COMPLAINTS, SYSTEM, DELETE                                     |
| VerificationStatus | NOT_SUBMITTED, PENDING, APPROVED, REJECTED                                                               |
| DocumentType       | PASSPORT, SELFIE, CERTIFICATE, OTHER                                                                     |
| OrderStatus        | CREATED, SEARCHING, ACCEPTED, IN_PROGRESS, COMPLETED, COMMISSION, REVIEWED, CANCELLED, EXPIRED, DISPUTED |
| OfferStatus        | PENDING, ACCEPTED, REJECTED, EXPIRED, CANCELLED                                                          |
| ComplaintReason    | QUALITY, NO_SHOW, PRICE, BEHAVIOR, FRAUD, OTHER                                                          |
| ComplaintStatus    | OPEN, IN_REVIEW, RESOLVED, REJECTED                                                                      |
| DisputeResolution  | COMPLETED, CANCELLED                                                                                     |
| CloseResult        | RESOLVED, REJECTED                                                                                       |
| CatalogStatus      | ACTIVE, INACTIVE                                                                                         |
| TransactionType    | COMMISSION_CHARGE, COMMISSION_REVERSAL, COMMISSION_PAYMENT, ADJUSTMENT                                   |
| CommissionStatus   | ACCRUED, INVOICED, PAID, CANCELLED                                                                       |
| Accept-Language ♻️ | uz (standart), uz-Cyrl, ru, en                                                                           |

---

## 14. Admin endpointlar to'liq ro'yxati

| Method | Path                                       | Huquq                      | Sahifa                        |
| ------ | ------------------------------------------ | -------------------------- | ----------------------------- |
| POST   | `/auth/otp/request` ♻️                     | —                          | Login                         |
| POST   | `/auth/otp/verify` ♻️                      | —                          | Login                         |
| POST   | `/auth/refresh` ♻️                         | —                          | (interceptor)                 |
| POST   | `/auth/logout` ♻️                          | —                          | Header                        |
| GET    | `/me` ♻️                                   | —                          | Guard                         |
| GET    | `/admin/users` ♻️                          | `USERS`                    | Users                         |
| POST   | `/admin/users/{id}/block` ♻️               | `USERS`                    | Users                         |
| POST   | `/admin/users/{id}/unblock` ♻️             | `USERS`                    | Users                         |
| DELETE | `/admin/users/{id}` 🆕                     | `USERS` + `DELETE`         | Users                         |
| GET    | `/admin/masters`                           | `MASTERS`                  | Masters                       |
| GET    | `/admin/masters/{id}`                      | `MASTERS`                  | Master tafsiloti              |
| POST   | `/admin/masters/{id}/approve`              | `MASTERS`                  | Master tafsiloti              |
| POST   | `/admin/masters/{id}/reject`               | `MASTERS`                  | Master tafsiloti              |
| GET    | `/admin/orders`                            | `ORDERS`                   | Orders                        |
| GET    | `/admin/orders/{id}`                       | `ORDERS`                   | Order tafsiloti               |
| GET    | `/admin/orders/{orderId}/chat/messages` ♻️ | `ORDERS` yoki `COMPLAINTS` | Order tafsiloti               |
| POST   | `/admin/orders/{id}/resolve` ♻️            | `ORDERS`                   | Order tafsiloti               |
| GET    | `/admin/complaints`                        | `COMPLAINTS`               | Complaints                    |
| GET    | `/admin/complaints/{id}`                   | `COMPLAINTS`               | Complaint tafsiloti           |
| POST   | `/admin/complaints/{id}/take`              | `COMPLAINTS`               | Complaint tafsiloti           |
| POST   | `/admin/complaints/{id}/close`             | `COMPLAINTS`               | Complaint tafsiloti           |
| GET    | `/admin/catalog/categories` ♻️             | `CATALOG`                  | Kategoriyalar                 |
| POST   | `/admin/catalog/categories` ♻️             | `CATALOG`                  | Kategoriyalar                 |
| PUT    | `/admin/catalog/categories/{id}` ♻️        | `CATALOG`                  | Kategoriyalar                 |
| DELETE | `/admin/catalog/categories/{id}` 🆕        | `CATALOG` + `DELETE`       | Kategoriyalar                 |
| PUT    | `/admin/catalog/categories/{id}/image` 🆕  | `CATALOG`                  | Kategoriyalar                 |
| DELETE | `/admin/catalog/categories/{id}/image` 🆕  | `CATALOG`                  | Kategoriyalar                 |
| PUT    | `/admin/catalog/categories/{id}/icon` 🆕   | `CATALOG`                  | Kategoriyalar                 |
| DELETE | `/admin/catalog/categories/{id}/icon` 🆕   | `CATALOG`                  | Kategoriyalar                 |
| GET    | `/admin/catalog/services` ♻️               | `CATALOG`                  | Xizmatlar                     |
| POST   | `/admin/catalog/services` ♻️               | `CATALOG`                  | Xizmatlar                     |
| PUT    | `/admin/catalog/services/{id}` ♻️          | `CATALOG`                  | Xizmatlar                     |
| DELETE | `/admin/catalog/services/{id}` 🆕          | `CATALOG` + `DELETE`       | Xizmatlar                     |
| PUT    | `/admin/catalog/services/{id}/image` 🆕    | `CATALOG`                  | Xizmatlar                     |
| DELETE | `/admin/catalog/services/{id}/image` 🆕    | `CATALOG`                  | Xizmatlar                     |
| PUT    | `/admin/catalog/services/{id}/icon` 🆕     | `CATALOG`                  | Xizmatlar                     |
| DELETE | `/admin/catalog/services/{id}/icon` 🆕     | `CATALOG`                  | Xizmatlar                     |
| GET    | `/admin/finance/invoices` ♻️               | `FINANCE`                  | Invoice'lar                   |
| POST   | `/admin/finance/settlements` ♻️            | `FINANCE`                  | Invoice'lar                   |
| POST   | `/admin/finance/invoices/close`            | `FINANCE`                  | Invoice'lar                   |
| GET    | `/admin/finance/commissions`               | `FINANCE`                  | Komissiyalar                  |
| GET    | `/admin/finance/transactions`              | `FINANCE`                  | Ledger                        |
| GET    | `/admin/finance/reconciliation`            | `FINANCE`                  | Reconciliation, Overview      |
| POST   | `/admin/search/reindex`                    | `SYSTEM`                   | System                        |
| GET    | `/admin/outbox/dead` 🆕                    | `SYSTEM`                   | System, Overview              |
| POST   | `/admin/outbox/dead/retry` 🆕              | `SYSTEM`                   | System                        |
| GET    | `/admin/admins` 🆕                         | `SUPER_ADMIN`              | Admins                        |
| POST   | `/admin/admins` 🆕                         | `SUPER_ADMIN`              | Admins                        |
| GET    | `/admin/admins/permissions` 🆕             | `SUPER_ADMIN`              | Admins                        |
| PUT    | `/admin/admins/{id}` 🆕                    | `SUPER_ADMIN`              | Admins                        |
| DELETE | `/admin/admins/{id}` 🆕                    | `SUPER_ADMIN`              | Admins                        |
| GET    | `/public/meta`                             | —                          | System                        |
| GET    | `/public/catalog/icons` 🆕                 | —                          | Catalog (IconPicker)          |
| GET    | `/public/catalog/icons/{key}.svg` 🆕       | —                          | Catalog (ikonka ko'rsatish)   |
| GET    | `/masters/{id}/services`                   | —                          | Master tafsiloti (qo'shimcha) |
| GET    | `/masters/{id}/portfolio`                  | —                          | Master tafsiloti (qo'shimcha) |
| GET    | `/masters/{masterId}/reviews`              | —                          | Master tafsiloti (qo'shimcha) |
