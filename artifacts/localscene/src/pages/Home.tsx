import { useState } from "react";
import { Search, Flame, Sparkles } from "lucide-react";
import { 
  useListPosts, 
  useGetTrendingPosts, 
  useGetFeaturedPosts 
} from "@workspace/api-client-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { PostCard } from "@/components/PostCard";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const CATEGORIES = ["All", "Barbershop", "Beauty", "Wellness", "Fitness", "Events", "Nightlife", "Food", "Sports", "Arts", "Music", "News"];

export default function Home() {
  const [activeCategory, setActiveCategory] = useState("All");

  const { data: posts, isLoading: postsLoading } = useListPosts(
    activeCategory === "All" ? undefined : { category: activeCategory },
    { query: { queryKey: ['posts', activeCategory] } }
  );

  const { data: trendingPosts, isLoading: trendingLoading } = useGetTrendingPosts();
  const { data: featuredPosts, isLoading: featuredLoading } = useGetFeaturedPosts();

  return (
    <div className="flex flex-col min-h-full pb-6">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-xl border-b border-border pt-4 pb-2 px-4 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <img src="/logo.png" alt="everyday HUB" className="h-14 object-contain" />
          <div className="bg-muted w-9 h-9 rounded-full flex items-center justify-center cursor-pointer hover:bg-muted/80 transition-colors">
            <Search className="w-5 h-5 text-foreground" />
          </div>
        </div>

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
      </header>

      {/* Featured Section - Only show when "All" is selected */}
      {activeCategory === "All" && (
        <section className="px-4 py-6 border-b border-border/50">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-accent-foreground" />
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

      {/* Main Feed */}
      <div className="flex flex-col">
        {activeCategory === "All" && (
          <div className="px-4 py-3 bg-muted/30 border-b border-border/50 flex items-center gap-2">
            <Flame className="w-4 h-4 text-destructive" />
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
          ) : posts && posts.length > 0 ? (
            posts.map((post, idx) => (
              <div 
                key={post.id} 
                className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <PostCard post={post} />
              </div>
            ))
          ) : (
            <div className="py-20 px-4 text-center flex flex-col items-center justify-center text-muted-foreground">
              <Search className="w-10 h-10 mb-4 text-muted" />
              <h3 className="text-lg font-bold text-foreground mb-1">Nothing happening yet</h3>
              <p className="text-sm">Be the first to post something in {activeCategory}.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
