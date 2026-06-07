# Feature Roadmap

## ✅ Built

### Core Feed
- [x] Post cards with like, comment, share, bookmark
- [x] Featured card (large hero format)
- [x] Trending section
- [x] Category filter tabs (Barbershop, Beauty, Wellness, Fitness, Events, Nightlife, Food, Sports, Arts, Music, News)
- [x] Real-time search (client-side, across title/body/location/category/author)
- [x] Sort by Latest / Most Liked / Price

### Social
- [x] Like / unlike posts (optimistic UI)
- [x] Comments with avatars
- [x] Share via Web Share API + clipboard fallback
- [x] Star reviews with body text

### Booking
- [x] Reserve spots on bookable posts
- [x] Bookings page with upcoming / past tabs
- [x] Booking badge on nav tab
- [x] Cancel booking with confirmation dialog

### Profile
- [x] Saved places tab
- [x] My posts tab
- [x] Impact stats (likes, reviews, places saved)
- [x] Payment methods (add/remove cards)

### Navigation
- [x] Custom EH map pin icon for Discover tab
- [x] Calendar tab
- [x] Bookings tab with live count badge
- [x] Profile tab

### Data
- [x] 1,250 real Cleveland businesses from OpenStreetMap
- [x] Re-runnable ingestion script (`pnpm --filter @workspace/scripts run ingest:cleveland`)

### Infrastructure
- [x] Deployed on Replit
- [x] GitHub repo: [nguyenn08/everyday-hub](https://github.com/nguyenn08/everyday-hub)
- [x] PostgreSQL database
- [x] OpenAPI-first contract with Orval-generated React Query hooks

---

## 🔜 Next Up

### High Priority
- [ ] Real photos — pull from Google Places API or Unsplash by category
- [ ] User authentication (login / sign up)
- [ ] Push notifications for booking reminders
- [ ] Add more cities (Detroit, Cincinnati, Columbus)

### Medium Priority
- [ ] Map view — see nearby businesses on a map
- [ ] Eventbrite integration — real local events (requires free API token)
- [ ] Business owner dashboard — claim listing, update info, manage bookings
- [ ] Post creation with image upload

### Nice to Have
- [ ] "Near me" location-based filtering
- [ ] Dark/light mode toggle
- [ ] Infinite scroll (currently loads all posts)
- [ ] Stories / ephemeral posts
