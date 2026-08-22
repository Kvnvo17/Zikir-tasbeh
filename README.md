# Zikr & Tasbeh

Telegram bot + Mini App: zikr sanash, kunlik maqsad, reyting, haftalik mukofot
kampaniyalari, referal tizimi, eslatmalar va to'liq admin panel.

## Texnologiyalar

- **Backend:** Python 3.12, FastAPI, aiogram 3.x, SQLAlchemy 2.x (async), APScheduler
- **Database:** PostgreSQL (production), SQLite (lokal test uchun fallback)
- **Frontend (Mini App):** Vanilla HTML/CSS/JS, Telegram WebApp API
- **Deploy:** Docker, Render (`render.yaml`)

Bot va Mini App bitta FastAPI servisi ichida birga ishlaydi (`main.py`): bot
`polling` yoki `webhook` rejimida FastAPI lifespan ichida ishga tushadi.

## Loyihani lokal ishga tushirish

```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# .env faylini to'ldiring: BOT_TOKEN, SUPER_ADMIN_IDS va h.k.
# Lokal test uchun DATABASE_URL ni SQLite qatoriga almashtiring.

python -m database.seed   # standart zikrlar va yutuqlarni yaratadi
uvicorn main:app --reload --port 8000
```

Mini App: `http://localhost:8000/web/index.html`
Tutorial: `http://localhost:8000/tutorial/index.html`
Health check: `http://localhost:8000/health`

> **Eslatma:** Telegram Mini App faqat `https://` orqali to'liq ishlaydi
> (initData validatsiyasi va WebApp API ko'p funksiyalari uchun). Lokalda
> ngrok yoki shunga o'xshash tunnel ishlatib test qiling.

## Environment o'zgaruvchilari

`.env.example` faylida barcha kerakli o'zgaruvchilar tavsiflangan:

- `BOT_TOKEN`, `BOT_USERNAME` — BotFather'dan olinadi
- `DATABASE_URL` — PostgreSQL (`postgresql+asyncpg://...`) yoki SQLite
- `WEBAPP_URL`, `TUTORIAL_URL`, `API_BASE_URL` — deploy qilingan domenga qarab
- `SUPER_ADMIN_IDS` — vergul bilan ajratilgan Telegram ID'lar (asosiy adminlar)
- `ADMIN_SECRET_KEY` — admin panel tokenlarini imzolash uchun uzun tasodifiy satr
- `BOT_MODE` — `polling` (oddiy) yoki `webhook`

## Deploy (GitHub → Render)

1. Loyihani GitHub repositoriyasiga joylang (`.env` fayl **hech qachon**
   commit qilinmasin — `.gitignore` allaqachon buni oldini oladi).
2. Render'da "New Blueprint" orqali `render.yaml` faylini import qiling —
   bu web service va PostgreSQL bazasini avtomatik yaratadi.
3. Render dashboard'da quyidagi environment o'zgaruvchilarni qo'lda to'ldiring:
   `BOT_TOKEN`, `BOT_USERNAME`, `WEBAPP_URL`, `TUTORIAL_URL`, `API_BASE_URL`,
   `SUPER_ADMIN_IDS`.
   - `WEBAPP_URL` = `https://<sizning-domen>.onrender.com/web/index.html`
   - `TUTORIAL_URL` = `https://<sizning-domen>.onrender.com/tutorial/index.html`
   - `API_BASE_URL` = `https://<sizning-domen>.onrender.com`
4. Deploy tugagach, botga `/start` yuboring — start sahifasi va Mini App
   tugmalari ko'rinishi kerak.
5. Superadmin sifatida botga `/admin` yuboring — admin panelga kirish
   havolasini olasiz (token 12 soat amal qiladi).

## Admin panel

`/admin` buyrug'i orqali olingan havola admin dashboard'ni ochadi:
foydalanuvchilar, adminlar, zikrlar, zikr submissionlari, ommaviy chat,
yordamchi userlar, mukofot kartalari, mukofot kampaniyalari va sozlamalar
shu yerdan boshqariladi. Reklama (broadcast) yuborish uchun botga
`/broadcast` buyrug'ini yuboring.

## Loyiha tuzilmasi

```
zikr_tasbeh/
├── main.py                # FastAPI app + bot lifecycle + routing
├── bot/                   # aiogram handlerlar, keyboardlar, middleware
├── backend/                # config, database, models, schemas, API, servislar
├── admin/                 # admin permissions, dashboard servis, statik admin UI
├── scheduler/              # APScheduler joblari (eslatma, mukofot)
├── database/seed.py        # standart zikr/yutuqlarni urug'lash
├── web/                    # Telegram Mini App (HTML/CSS/JS)
└── tutorial/                # "O'rganish" Mini App sahifasi
```

## Xavfsizlik

- Har bir Mini App so'rovi `X-Telegram-Init-Data` header orqali serverda
  HMAC bilan tekshiriladi (`backend/security/telegram_auth.py`) — client
  yuborgan `telegram_id`ga hech qachon ko'r-ko'rona ishonilmaydi.
- Admin endpointlari imzolangan token (`X-Admin-Token`) talab qiladi.
- `BOT_TOKEN` va boshqa maxfiy ma'lumotlar faqat `.env` orqali beriladi va
  hech qachon frontendga chiqarilmaydi.
- Anti-cheat oddiy foydalanuvchining tez bosishini bloklamaydi; faqat
  g'ayritabiiy avtomatik naqshni aniqlab, uni faqat reyting/mukofot
  hisobidan chetlashtiradi (shaxsiy tasbeh hisobiga ta'sir qilmaydi).
