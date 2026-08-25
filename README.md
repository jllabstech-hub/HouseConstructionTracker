# 🏡 House Construction Tracker (ఇంటి నిర్మాణ ఖర్చుల లెక్కల పుస్తకం)

A modern, full-featured web application designed for individual homeowners, civil contractors, and site supervisors in India to track every rupee spent during residential house construction — from initial plot pooja and foundation excavation to final painting, interiors, and house warming (Gruhapravesham).

---

## 🌟 Key Features

- **🌐 Complete Bilingual Support (English & Telugu / తెలుగు)**:
  - 1-tap instant language switcher in header and mobile drawer.
  - Complete localization of all 20 construction stages, trade terms, Telugu material names (సిమెంట్, ఇసుక, కంకర, స్టీల్), and worker roles (మేస్త్రీ, కూలీ, కార్పెంటర్).
- **🏗️ 20-Stage Sequential Construction Catalog**:
  - Organized strictly in real-world Indian construction chronological order (Plan & Approval → Site Prep → Excavation → Footing → Plinth Beam → Columns → Slab → Brickwork → Plastering → Plumbing → Electrical → Tiles → Woodwork → Painting → Gruhapravesham).
  - Quick stage filtering with bill counts and expense breakdowns.
- **🧱 Strict Separation of Materials vs. Labour**:
  - Material purchases and labour wages are kept strictly distinct even under the same work area.
  - Automatic calculation support for Daily Wages (Workers × Days × Daily Rate) and Square Feet Contract basis.
- **📁 Plans, Elevation & Blueprints Hub (`/documents`)**:
  - Drag-and-drop & native OS file browsing for 2D Floor Plans, Structural Drawings, Electrical/Plumbing CADs, and 3D Elevation renders.
  - Instant image and PDF document preview with categorized tagging and revision tracking.
- **📸 Receipt & Bill Photos**:
  - Drag & drop paper bills, cash receipts, and supplier GST invoices with instant thumbnail preview.
- **👥 Local Shops & Worker Directory (`/masters`)**:
  - Directory of suppliers and masons with phone numbers, 1-tap direct phone call (`tel:`) and WhatsApp chat (`wa.me/`) buttons.
- **📄 Downloadable PDF Reports & Official Statements (`/reports`)**:
  - Stage-wise audit statement, Material supplier passbook, Worker wage sheet, and Full Project Financial Summary.
- **🎯 1-Tap House Customization**:
  - Editable project name, plot location, and total budget limit with instant updates across all views.
- **📱 Fully Responsive**:
  - Optimized for desktop and mobile devices with fixed quick-action navigation and bottom drawer.

---

## 🚀 Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router, Turbopack, React 19, Server Actions)
- **Database & ORM**: SQLite / PostgreSQL via [Prisma ORM](https://www.prisma.io/)
- **Styling**: Tailwind CSS, Lucide Icons, Custom Construction Theme Palette
- **Authentication**: NextAuth.js
- **PDF Generation**: `@react-pdf/renderer`
- **Testing**: Playwright (E2E & automated multi-viewport audit), Vitest (Unit tests)

---

## 🛠️ Quick Start

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/jllabstech-hub/HouseConstructionTracker.git
cd HouseConstructionTracker
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Ensure `DATABASE_URL="file:./dev.db"` and `AUTH_SECRET` are set.

### 3. Setup Database & Seed Sample Project
```bash
npx prisma db push
npm run db:seed
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:7000](http://localhost:7000) in your browser.

- **Default User ID**: `admin`
- **Default Password**: `test123`

---

## 🧪 Testing & Code Quality

```bash
# Run unit & aggregation tests
npm run test

# Run Playwright end-to-end tests
npm run test:e2e

# Type checking
npx tsc --noEmit
```

---

## 📄 License
MIT License. Developed with ❤️ for homeowners and builders.
