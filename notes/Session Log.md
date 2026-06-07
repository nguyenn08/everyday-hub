# Session Log

Running log of build sessions — newest first.

---

## 2025-06-07

### Data Ingestion
- Built `scripts/src/ingest-cleveland.ts` — queries OpenStreetMap's Overpass API (no key needed)
- Pulled **1,250 real Cleveland businesses** across Food, Nightlife, Beauty, Arts, Fitness, Wellness, Sports, Music
- Bookable venues get realistic price ranges; featured/trending flags distributed across feed

### QoL Features
- **Search** — animated search bar in header, real-time filtering across title/body/location/category/author
- **Sort** — Latest / Most Liked / Price Low→High / Price High→Low with reset button
- **Share** — Web Share API on each post card with clipboard fallback
- **Booking badge** — live count of upcoming bookings on nav tab

### Navigation Fix
- Replaced broken `as const` pattern in Layout.tsx with explicit render per tab
- Custom EH map pin SVG now renders correctly in Discover tab

### GitHub
- Created repo: [nguyenn08/everyday-hub](https://github.com/nguyenn08/everyday-hub)
- Connected via Replit GitHub integration + Octokit proxy

---

## Earlier Sessions

### Theme & Branding
- Dark navy background (`hsl(222, 58%, 13%)`), icy blue primary (`hsl(205, 65%, 68%)`)
- everyday HUB logo in header, custom EH pin in bottom nav
- All warm/orange colors replaced with icy blue

### Features Built
- Saved Places, Reviews (star ratings), Payment Methods — full DB schema → API → frontend
- Like button optimistic UI, bookmark with toast, comment section
- Bookings page with cancel confirmation dialog, past/upcoming split
- Profile page with Saved / Posts / Impact / Payment tabs

### Infrastructure
- pnpm monorepo: `artifacts/localscene` (Vite+React), `artifacts/api-server` (Express 5), `lib/db` (Drizzle), `lib/api-spec` (OpenAPI)
- Orval codegen from OpenAPI spec → React Query hooks
- PostgreSQL on Replit with Drizzle migrations
