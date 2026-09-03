# 🏥 EarthCone Home Nursing - Official Client Handover & Documentation

Welcome to the digital platform build for **EarthCone Home Nursing (Bengaluru)**. This package has been built to commercial enterprise standards, designed for fast client onboarding, reliable WhatsApp lead generation, and multi-platform hosting.

---

## 📦 What Is Included In This Package

```
earthcone-home-nursing/
├── public/                 # Production-optimized front-end assets
│   ├── css/                # Custom design system & responsive styling
│   ├── js/                 # Chatbot widget & core app logic
│   ├── logos/              # Brand logos & favicon
│   └── index.html          # High-converting one-page application
├── db/                     # SQLite Database Engine
│   └── database.js         # Schema, table setup, persistent queries
├── api/                    # Serverless APIs
│   └── inquiry.js          # Cloud lead handler (Vercel/Netlify/Node)
├── docs/                   # Client documentation & quick-start guides
│   └── CLIENT_HANDOVER.md  # Client user manual
├── server.js               # Standalone production Node.js/Express server
├── package.json            # NPM dependencies & deployment scripts
├── vercel.json             # 1-Click Zero-Config Vercel deployment
├── .env.example            # Environment variables configuration template
└── README.md               # Developer & hosting documentation
```

---

## 🚀 How to Run & Deploy

### Option 1: Zero-Config Cloud Hosting (Vercel / Netlify / Render)
1. Push this folder to a GitHub repository or drag & drop onto [Vercel](https://vercel.com).
2. The included `vercel.json` and `api/inquiry.js` will automatically configure routing, SSL, and serverless functions without any manual setup.

### Option 2: Run via Node.js Server (Self-Hosted / VPS / AWS EC2)
```bash
# 1. Install dependencies
npm install

# 2. Start the production server
npm start
```
The server will boot on `http://localhost:3000`.

### 📊 Accessing Captured Sales Leads
View all captured customer inquiries, phone numbers, and estimate requests via the protected admin endpoint:
```
http://localhost:3000/api/leads?key=earthcone-admin-2024
```
*(Key can be configured in `.env` via `ADMIN_API_KEY`)*

### Option 3: Static Web Hosting (cPanel / Apache / Nginx / Hostinger)
- Simply point the web root to the `public/` directory or upload the contents of `public/` directly to your `public_html` folder.

---

## 📞 Business Configuration & Contacts

All business details are centralized in the application:
- **Business Name:** EarthCone Home Nursing
- **Helpline Phone:** `+91 9931450495`
- **WhatsApp API:** `+91 9931450495`
- **Email:** `earthconehomenursing@gmail.com`
- **Location:** Kalyan Nagar, Bengaluru, Karnataka - 560043

---

## 💼 Selling & Commercial Value Points For Client Pitch

When handing over this solution to the client, highlight these key revenue-generating features:

1. **Instant WhatsApp Conversion Engine:**
   Every form submission and service button automatically generates a structured WhatsApp message with patient details, shift requirements, and locality to ensure near-zero drop-off rates.
2. **Local SEO & South Bangalore Focus:**
   Optimized specifically for high-intent medical queries around Kalyan Nagar, JP Nagar, HSR Layout, Koramangala, Jayanagar, and Bannerghatta Road.
3. **Mobile-First Responsive UX:**
   Designed with sticky emergency call ribbons, pulsating WhatsApp quick triggers, and sub-second load times on 4G/5G mobile networks.
4. **Zero Maintenance Burden:**
   Requires no complex CMS or database overhead; runs anywhere from low-cost shared hosting to enterprise cloud CDN.
