import { useState, useRef, useEffect, useMemo } from "react";
import { Search, Flame, Sparkles, X, ArrowLeft, SlidersHorizontal, Check } from "lucide-react";
import {
  useListPosts,
  useGetTrendingPosts,
  useGetFeaturedPosts,
} from "@workspace/api-client-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { PostCard } from "@/components/PostCard";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const CATEGORIES = ["All", "Barbershop", "Beauty", "Wellness", "Fitness", "Events", "Nightlife", "Food", "Sports", "Arts", "Music", "News"];

type SortOption = "latest" | "popular" | "price-low" | "price-high";
const SORT_LABELS: Record<SortOption, string> = {
  latest: "Latest",
  popular: "Most Liked",
  "price-low": "Price: Low → High",
  "price-high": "Price: High → Low",
};

export default function Home() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("latest");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Always fetch all posts so we can search/sort client-side
  const { data: allPosts, isLoading: postsLoading } = useListPosts(
    activeCategory === "All" ? undefined : { category: activeCategory },
    { query: { queryKey: ["posts", activeCategory] } }
  );

  const { data: featuredPosts, isLoading: featuredLoading } = useGetFeaturedPosts();

  // Focus search input when opened
  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setSearchQuery("");
    }
  }, [searchOpen]);

  // Close search on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSearchOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Filter + sort
  const displayedPosts = useMemo(() => {
    let posts = allPosts ?? [];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      posts = posts.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          (p.body ?? "").toLowerCase().includes(q) ||
          p.location.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.authorName.toLowerCase().includes(q)
      );
    }

    return [...posts].sort((a, b) => {
      if (sortBy === "popular") return b.likes - a.likes;
      if (sortBy === "price-low") return (a.price ?? Infinity) - (b.price ?? Infinity);
      if (sortBy === "price-high") return (b.price ?? -Infinity) - (a.price ?? -Infinity);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [allPosts, searchQuery, sortBy]);

  const isSearching = searchOpen && searchQuery.trim().length > 0;

  return (
    <div className="flex flex-col min-h-full pb-6">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border pt-4 pb-2 px-4 flex flex-col gap-3">

        {/* Logo row / Search bar */}
        <div className="flex items-center gap-2 min-h-[36px]">
          {searchOpen ? (
            <>
              <button
                onClick={() => setSearchOpen(false)}
                className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 hover:bg-muted/60 transition-colors text-muted-foreground"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  ref={searchInputRef}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search places, events, categories…"
                  className="w-full bg-muted/60 rounded-full pl-9 pr-9 py-2 text-sm outline-none border border-border/60 focus:border-primary/50 focus:bg-card transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </>
          ) : (
            <>
              <img src="/logo.png" alt="everyday HUB" className="h-14 object-contain flex-1" />
              <div className="flex items-center gap-2">
                {/* Sort */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className={cn(
                      "w-9 h-9 rounded-full flex items-center justify-center transition-colors",
                      sortBy !== "latest" ? "bg-primary/20 text-primary" : "bg-muted hover:bg-muted/80 text-muted-foreground"
                    )}>
                      <SlidersHorizontal className="w-4 h-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    {(Object.entries(SORT_LABELS) as [SortOption, string][]).map(([key, label]) => (
                      <DropdownMenuItem key={key} onClick={() => setSortBy(key)} className="flex items-center justify-between gap-2">
                        <span>{label}</span>
                        {sortBy === key && <Check className="w-4 h-4 text-primary" />}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Search */}
                <button
                  onClick={() => setSearchOpen(true)}
                  className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors text-muted-foreground hover:text-foreground"
                >
                  <Search className="w-5 h-5" />
                </button>
              </div>
            </>
          )}
        </div>

        {/* Category pills — hidden while searching */}
        {!searchOpen && (
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex w-max space-x-2 pb-2">
              {CATEGORIES.map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-sm font-semibold transition-all",
                    activeCategory === category
                      ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                      : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                  )}
                >
                  {category}
                </button>
              ))}
            </div>
            <ScrollBar orientation="horizontal" className="invisible" />
          </ScrollArea>
        )}
      </header>

      {/* Search results header */}
      {isSearching && (
        <div className="px-4 py-3 border-b border-border/40 bg-muted/20">
          <p className="text-sm font-semibold text-muted-foreground">
            {displayedPosts.length === 0
              ? `No results for "${searchQuery}"`
              : `${displayedPosts.length} result${displayedPosts.length !== 1 ? "s" : ""} for "${searchQuery}"`}
          </p>
        </div>
      )}

      {/* Featured section — hidden while searching */}
      {!searchOpen && activeCategory === "All" && (
        <section className="px-4 py-6 border-b border-border/50">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-primary/60" />
            <h2 className="text-lg font-bold">Featured in Your City</h2>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {featuredLoading ? (
              <Skeleton className="w-full h-72 rounded-2xl" />
            ) : featuredPosts && featuredPosts.length > 0 ? (
              <PostCard post={featuredPosts[0]} variant="featured" />
            ) : null}
          </div>
        </section>
      )}

      {/* Sort indicator */}
      {!searchOpen && sortBy !== "latest" && (
        <div className="px-4 py-2 flex items-center gap-1.5 border-b border-border/40 bg-primary/5">
          <SlidersHorizontal className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-semibold text-primary">Sorted by {SORT_LABELS[sortBy]}</span>
          <button onClick={() => setSortBy("latest")} className="ml-auto text-xs text-muted-foreground hover:text-foreground font-medium">Reset</button>
        </div>
      )}

      {/* Feed */}
      <div className="flex flex-col">
        {!searchOpen && activeCategory === "All" && (
          <div className="px-4 py-3 bg-muted/30 border-b border-border/50 flex items-center gap-2">
            <Flame className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-muted-foreground tracking-wide uppercase">Trending Now</span>
          </div>
        )}

        <div className="flex flex-col divide-y divide-border/20">
          {postsLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-4 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[120px]" />
                    <Skeleton className="h-3 w-[80px]" />
                  </div>
                </div>
                <Skeleton className="h-4 w-full mt-2" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-[200px] w-full rounded-xl mt-2" />
              </div>
            ))
          ) : displayedPosts.length > 0 ? (
            displayedPosts.map((post, idx) => (
              <div
                key={post.id}
                className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both"
                style={{ animationDelay: `${Math.min(idx * 60, 400)}ms` }}
              >
                <PostCard post={post} />
              </div>
            ))
          ) : (
            <div className="py-20 px-4 text-center flex flex-col items-center justify-center text-muted-foreground">
              <Search className="w-10 h-10 mb-4 opacity-20" />
              <h3 className="text-lg font-bold text-foreground mb-1">
                {searchQuery ? "No results found" : "Nothing here yet"}
              </h3>
              <p className="text-sm">
                {searchQuery
                  ? `Try a different search term.`
                  : `Be the first to post something in ${activeCategory}.`}
              </p>
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="mt-4 text-sm font-bold text-primary hover:underline">
                  Clear search
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
