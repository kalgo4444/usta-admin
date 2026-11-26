# Usta Admin

Usta chaqirish platformasining administrator paneli.

## Imkoniyatlar

- Ustalarni tekshirish: hujjatlarni ko'rish, tasdiqlash yoki rad etish
- Foydalanuvchilarni bloklash va o'chirish
- Buyurtmalarni kuzatish, chatni o'qish, nizolarni hal qilish
- Shikoyatlarni ko'rib chiqish
- Katalog: kategoriyalar, xizmatlar, rasm va ikonkalar
- Moliya: invoice'lar, komissiyalar, ledger, solishtirish
- Adminlar va ularning huquqlari (faqat super admin)
- Tizim: qidiruv indeksi, yetkazilmagan eventlar

Interfeys o'zbek va rus tillarida.

## Texnologiyalar

Next.js 16, React 19, TypeScript, Tailwind CSS 4, TanStack Query va Table, React Hook Form + Zod, next-intl.

## Ishga tushirish

```bash
cp .env.example .env   # API_URL = backend manzili
npm install
npm run dev            # http://localhost:4010 (port: .env dagi PORT)
```

Kirish SMS kod orqali. Faqat `ADMIN` yoki `SUPER_ADMIN` roli bor foydalanuvchi kira oladi.

## Buyruqlar

| Buyruq                              | Vazifasi                                     |
| ----------------------------------- | -------------------------------------------- |
| `npm run build`                     | Production build                             |
| `npm run lint`                      | ESLint                                       |
| `npm run typecheck`                 | TypeScript tekshiruvi                        |
| `npm run format`                    | Prettier                                     |
| `npm test`                          | Unit testlar (Vitest)                        |
| `npm run build && npm run test:e2e` | E2E testlar (Playwright, backend shart emas) |
| `API_URL=… npm run gen:api`         | API tiplarini qayta generatsiya qilish       |

## Docker

```bash
API_URL=https://<backend-manzili> docker compose up --build -d   # port: PORT, standart 4010
```

`API_URL` majburiy: usiz server ishga tushmaydi. Holatni tekshirish: `GET /api/health`.

## Tuzilma

Feature-Sliced Design, importlar faqat yuqoridan pastga:

```
src/app        route'lar va API proxy
src/views      sahifalar
src/widgets    yirik UI bloklar
src/features   foydalanuvchi amallari
src/entities   domen bo'yicha so'rovlar
src/shared     API client, UI kit, i18n, yordamchi funksiyalar
```

Brauzer backend'ga to'g'ridan-to'g'ri murojaat qilmaydi: so'rovlar Next.js proxy orqali o'tadi, refresh token faqat httpOnly cookie'da saqlanadi.

## Hujjatlar

- [docs/index.md](docs/index.md) — mahsulot rejasi va API
- [DESIGN.md](DESIGN.md) — UI qoidalari
- [AGENTS.md](AGENTS.md) — arxitektura va dasturlash qoidalari
