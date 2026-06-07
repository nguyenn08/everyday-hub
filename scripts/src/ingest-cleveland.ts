/**
 * Cleveland, OH — real business data ingestion via OpenStreetMap Overpass API
 * No API key required. Run with: pnpm --filter @workspace/scripts run ingest:cleveland
 */
import { db, postsTable } from "@workspace/db";

// Cleveland bounding box: south, west, north, east
const BBOX = "41.38,-81.88,41.60,-81.53";

// OSM tag → app category mapping
const TAG_MAP: Record<string, { category: string; bookable: boolean; priceMin?: number; priceMax?: number }> = {
  "shop=barber":          { category: "Barbershop", bookable: true,  priceMin: 20, priceMax: 65  },
  "shop=hairdresser":     { category: "Beauty",     bookable: true,  priceMin: 35, priceMax: 120 },
  "shop=beauty":          { category: "Beauty",     bookable: true,  priceMin: 30, priceMax: 100 },
  "amenity=beauty_salon": { category: "Beauty",     bookable: true,  priceMin: 30, priceMax: 100 },
  "amenity=restaurant":   { category: "Food",       bookable: false },
  "amenity=fast_food":    { category: "Food",       bookable: false },
  "amenity=cafe":         { category: "Food",       bookable: false },
  "amenity=bar":          { category: "Nightlife",  bookable: false },
  "amenity=pub":          { category: "Nightlife",  bookable: false },
  "amenity=nightclub":    { category: "Nightlife",  bookable: true,  priceMin: 10, priceMax: 40  },
  "leisure=fitness_centre":{ category: "Fitness",   bookable: true,  priceMin: 12, priceMax: 30  },
  "leisure=sports_centre":{ category: "Sports",     bookable: true,  priceMin: 10, priceMax: 25  },
  "amenity=gym":          { category: "Fitness",    bookable: true,  priceMin: 12, priceMax: 30  },
  "amenity=spa":          { category: "Wellness",   bookable: true,  priceMin: 60, priceMax: 180 },
  "shop=massage":         { category: "Wellness",   bookable: true,  priceMin: 55, priceMax: 130 },
  "amenity=arts_centre":  { category: "Arts",       bookable: false },
  "amenity=theatre":      { category: "Arts",       bookable: true,  priceMin: 15, priceMax: 75  },
  "amenity=cinema":       { category: "Arts",       bookable: true,  priceMin: 10, priceMax: 18  },
  "amenity=music_venue":  { category: "Music",      bookable: true,  priceMin: 10, priceMax: 60  },
  "amenity=concert_hall": { category: "Music",      bookable: true,  priceMin: 20, priceMax: 120 },
};

// Category-appropriate body copy
const BODY_TEMPLATES: Record<string, string[]> = {
  Barbershop: [
    "Fresh cuts, classic fades, and straight razor shaves in the heart of Cleveland.",
    "Your neighborhood barbershop — walk-ins welcome, appointments preferred.",
    "Precision cuts and clean fades. Locals' favorite since day one.",
  ],
  Beauty: [
    "Full-service salon offering cuts, color, and treatments for all hair types.",
    "Expert stylists dedicated to making you look and feel your best.",
    "From blowouts to balayage — Cleveland's go-to beauty destination.",
  ],
  Food: [
    "Serving up fresh, local flavors that Cleveland has been raving about.",
    "A neighborhood staple for great food and even better vibes.",
    "From brunch to late night — your next favorite spot is here.",
  ],
  Nightlife: [
    "The best drinks, the best crowd, and the best nights in Cleveland.",
    "Where the city comes alive after dark. See you tonight.",
    "Craft cocktails, live music, and an energy you won't find anywhere else.",
  ],
  Fitness: [
    "State-of-the-art equipment, expert trainers, and a community that pushes you.",
    "Cleveland's premier fitness destination — drop-in classes available.",
    "Transform your body and your mindset. Classes for all levels.",
  ],
  Wellness: [
    "Unwind, restore, and reset. Your wellness journey starts here.",
    "Expert therapists and serene environments for total relaxation.",
    "Cleveland's top-rated wellness space — book your session today.",
  ],
  Arts: [
    "Showcasing the best of Cleveland's creative talent. Come see for yourself.",
    "Where art and community meet. Exhibitions, events, and more.",
    "Cleveland's cultural hub — exhibits, workshops, and performances year-round.",
  ],
  Music: [
    "Live music, great drinks, and unforgettable nights in Cleveland.",
    "Cleveland's premier music venue — catch the next big act here.",
    "From local bands to national acts — the stage is always set.",
  ],
  Sports: [
    "Top-tier facilities for athletes of all levels in Cleveland.",
    "Train hard, play harder. Cleveland's athletic center.",
    "Courts, fields, and gear — everything you need to compete.",
  ],
};

// Sample author names for realistic-looking posts
const AUTHORS = [
  { name: "Marcus J.", avatar: null },
  { name: "Tiffany R.", avatar: null },
  { name: "DeShawn K.", avatar: null },
  { name: "Priya M.", avatar: null },
  { name: "Carlos V.", avatar: null },
  { name: "Jasmine W.", avatar: null },
  { name: "Tyler B.", avatar: null },
  { name: "Aaliyah H.", avatar: null },
  { name: "Kevin O.", avatar: null },
  { name: "Destiny L.", avatar: null },
];

interface OsmNode {
  type: string;
  id: number;
  lat: number;
  lon: number;
  tags?: Record<string, string>;
}

interface OverpassResult {
  elements: OsmNode[];
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formatAddress(tags: Record<string, string>, fallback: string): string {
  const parts: string[] = [];
  if (tags["addr:housenumber"] && tags["addr:street"]) {
    parts.push(`${tags["addr:housenumber"]} ${tags["addr:street"]}`);
  } else if (tags["addr:street"]) {
    parts.push(tags["addr:street"]);
  }
  const city = tags["addr:city"] || "Cleveland";
  const state = tags["addr:state"] || "OH";
  parts.push(`${city}, ${state}`);
  return parts.length > 1 ? parts.join(", ") : fallback;
}

function classifyNode(tags: Record<string, string>): (typeof TAG_MAP)[string] | null {
  for (const [key, meta] of Object.entries(TAG_MAP)) {
    const [k, v] = key.split("=");
    if (tags[k] === v) return meta;
  }
  return null;
}

async function fetchOverpass(): Promise<OverpassResult> {
  // Build one combined query for all tag types
  const tagFilters = Object.keys(TAG_MAP)
    .map((key) => {
      const [k, v] = key.split("=");
      return `  node["${k}"="${v}"](${BBOX});`;
    })
    .join("\n");

  const query = `[out:json][timeout:60];\n(\n${tagFilters}\n);\nout body;`;

  console.log("📡 Querying Overpass API for Cleveland, OH...");
  const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "User-Agent": "everydayHUB-ingestion/1.0",
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Overpass API error: ${res.status} ${res.statusText}\n${body.slice(0, 300)}`);
  }
  return res.json() as Promise<OverpassResult>;
}

async function main() {
  const data = await fetchOverpass();
  const nodes = data.elements.filter((e) => e.type === "node" && e.tags);

  console.log(`📦 Got ${nodes.length} raw OSM nodes`);

  // Filter to named nodes only and classify them
  const classified = nodes
    .filter((n) => n.tags?.name && n.tags.name.trim().length > 0)
    .map((n) => ({ node: n, meta: classifyNode(n.tags!) }))
    .filter((x) => x.meta !== null) as { node: OsmNode; meta: (typeof TAG_MAP)[string] }[];

  console.log(`✅ ${classified.length} named, classifiable businesses found`);

  if (classified.length === 0) {
    console.log("Nothing to insert. Exiting.");
    process.exit(0);
  }

  // Deduplicate by name+category (OSM sometimes has duplicates)
  const seen = new Set<string>();
  const deduped = classified.filter(({ node, meta }) => {
    const key = `${node.tags!.name!.toLowerCase()}|${meta.category}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  console.log(`🔁 ${deduped.length} after deduplication`);

  // Build insert rows
  const rows = deduped.map(({ node, meta }, i) => {
    const tags = node.tags!;
    const name = tags.name!.trim();
    const location = formatAddress(tags, `${name}, Cleveland, OH`);
    const bodies = BODY_TEMPLATES[meta.category] ?? [];
    const body = bodies.length > 0 ? pick(bodies) : undefined;
    const author = pick(AUTHORS);
    const price = meta.priceMin != null
      ? randInt(meta.priceMin, meta.priceMax!)
      : undefined;

    // Spread created times across the last 30 days for a realistic feed
    const createdAt = new Date(Date.now() - randInt(0, 30 * 24 * 60 * 60 * 1000));

    // Mark ~15% as featured, ~20% as trending
    const isFeatured = i % 7 === 0;
    const isTrending = i % 5 === 0;

    return {
      title: name,
      body,
      category: meta.category,
      imageUrl: null,
      authorName: author.name,
      authorAvatar: author.avatar,
      likes: randInt(0, 320),
      commentsCount: randInt(0, 45),
      location,
      isBookable: meta.bookable,
      liked: false,
      price: price ?? null,
      eventDate: null,
      isFeatured,
      isTrending,
      createdAt,
    };
  });

  // Batch insert in chunks of 50
  const CHUNK = 50;
  let inserted = 0;
  for (let i = 0; i < rows.length; i += CHUNK) {
    await db.insert(postsTable).values(rows.slice(i, i + CHUNK));
    inserted += Math.min(CHUNK, rows.length - i);
    process.stdout.write(`\r⬆️  Inserted ${inserted}/${rows.length}`);
  }

  console.log(`\n\n🎉 Done! Inserted ${inserted} real Cleveland businesses into the database.\n`);

  // Breakdown by category
  const counts: Record<string, number> = {};
  for (const r of rows) counts[r.category] = (counts[r.category] ?? 0) + 1;
  console.log("📊 Breakdown:");
  for (const [cat, count] of Object.entries(counts).sort((a, b) => b[1] - a[1])) {
    console.log(`   ${cat.padEnd(15)} ${count}`);
  }

  await db.$client.end();
}

main().catch((err) => {
  console.error("❌ Ingestion failed:", err);
  process.exit(1);
});
