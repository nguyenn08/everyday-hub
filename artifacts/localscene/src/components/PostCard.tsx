import { 
  Heart, MessageCircle, MapPin, Calendar 
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { 
  Post, 
  useTogglePostLike, 
  useCreateBooking,
  useGetPost
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getListPostsQueryKey, getGetTrendingPostsQueryKey, getGetFeaturedPostsQueryKey, getGetPostQueryKey } from "@workspace/api-client-react";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface PostCardProps {
  post: Post;
  variant?: "feed" | "featured" | "compact";
}

function PostDetail({ postId }: { postId: number }) {
  const { data: post, isLoading } = useGetPost(postId);
  
  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading details...</div>;
  if (!post) return null;

  return (
    <div className="flex flex-col gap-5 p-5 overflow-y-auto">
      <div className="flex items-center gap-3">
        <Avatar className="h-12 w-12 ring-2 ring-background shadow-sm">
          <AvatarImage src={post.authorAvatar || undefined} />
          <AvatarFallback className="bg-primary/10 text-primary font-medium">
            {post.authorName.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <span className="font-bold text-base leading-none">{post.authorName}</span>
          <span className="text-muted-foreground text-xs mt-1 flex items-center gap-1">
            {format(parseISO(post.createdAt), 'MMM d, h:mm a')} • {post.category}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-xl font-black leading-snug">{post.title}</h2>
        {post.body && (
          <p className="text-foreground/90 text-base leading-relaxed whitespace-pre-wrap">
            {post.body}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3 bg-muted/30 p-4 rounded-xl border border-border/50">
        <div className="flex items-center gap-2 text-sm text-foreground">
          <MapPin className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium">{post.location}</span>
        </div>
        {post.eventDate && (
          <div className="flex items-center gap-2 text-sm text-foreground">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">{format(parseISO(post.eventDate), 'EEEE, MMMM d, yyyy @ h:mm a')}</span>
          </div>
        )}
      </div>

      {post.imageUrl && (
        <div className="w-full rounded-xl overflow-hidden bg-muted my-2 border border-border/50 shadow-sm">
          <img 
            src={post.imageUrl} 
            alt={post.title} 
            className="w-full h-auto object-cover"
          />
        </div>
      )}
    </div>
  );
}

export function PostCard({ post, variant = "feed" }: PostCardProps) {
  const queryClient = useQueryClient();
  const toggleLike = useTogglePostLike();
  const createBooking = useCreateBooking();

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleLike.mutate({ id: post.id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListPostsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetTrendingPostsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetFeaturedPostsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetPostQueryKey(post.id) });
      }
    });
  };

  const handleBook = (e: React.MouseEvent) => {
    e.stopPropagation();
    createBooking.mutate({ data: { postId: post.id } }, {
      onSuccess: () => {
        toast({
          title: "Spot secured!",
          description: `You're booked for ${post.title}.`,
          duration: 3000,
        });
      },
      onError: () => {
        toast({
          title: "Booking failed",
          description: "Something went wrong. Please try again.",
          variant: "destructive",
        });
      }
    });
  };

  const cardContent = (
    <div className="w-full text-left">
      {variant === "featured" ? (
        <div className="relative overflow-hidden rounded-2xl h-72 group hover-elevate transition-transform active:scale-[0.98]">
          {post.imageUrl ? (
            <img src={post.imageUrl} alt={post.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
          ) : (
            <div className="absolute inset-0 bg-primary/20" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-5 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-primary text-primary-foreground border-none font-bold text-xs uppercase tracking-wider shadow-sm">
                {post.category}
              </Badge>
              {post.isBookable && (
                <Badge variant="outline" className="bg-white/20 text-white border-white/30 backdrop-blur-md">
                  Bookable
                </Badge>
              )}
            </div>
            <h3 className="text-xl font-black text-white leading-tight mt-1">{post.title}</h3>
            <div className="flex items-center gap-3 text-white/90 text-sm mt-1 font-medium">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                <span className="truncate max-w-[150px]">{post.location}</span>
              </div>
              {post.eventDate && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{format(parseISO(post.eventDate), 'MMM d, h:mm a')}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-card border-b border-border/50 pb-5 pt-4 px-4 flex flex-col gap-3 transition-colors hover:bg-muted/10 active:bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 ring-2 ring-background shadow-sm">
                <AvatarImage src={post.authorAvatar || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                  {post.authorName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="font-bold text-sm leading-none">{post.authorName}</span>
                <span className="text-muted-foreground text-[11px] mt-1 flex items-center gap-1 font-medium tracking-wide uppercase">
                  {format(parseISO(post.createdAt), 'MMM d')} • {post.category}
                </span>
              </div>
            </div>
            {post.isTrending && (
              <Badge variant="secondary" className="bg-accent/20 text-accent-foreground border border-accent/20 text-[10px] font-bold">
                Trending
              </Badge>
            )}
          </div>

          <div className="flex flex-col gap-1.5 mt-1">
            <h3 className="font-black text-base leading-snug text-foreground">{post.title}</h3>
            {post.body && (
              <p className="text-muted-foreground text-sm line-clamp-2 leading-relaxed">
                {post.body}
              </p>
            )}
          </div>

          {post.imageUrl && (
            <div className="relative w-full rounded-xl overflow-hidden mt-1 max-h-[250px] bg-muted border border-border/50">
              <img 
                src={post.imageUrl} 
                alt={post.title} 
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 mt-1">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-md">
              <MapPin className="w-3.5 h-3.5" />
              <span className="truncate max-w-[150px]">{post.location}</span>
            </div>
            {post.eventDate && (
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-md">
                <Calendar className="w-3.5 h-3.5" />
                <span>{format(parseISO(post.eventDate), 'MMM d')}</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-4">
              <button 
                onClick={handleLike}
                className={cn(
                  "flex items-center gap-1.5 transition-colors duration-200",
                  post.liked ? "text-destructive" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <div className={cn("p-1.5 rounded-full transition-colors", post.liked && "bg-destructive/10")}>
                  <Heart className={cn("w-5 h-5", post.liked && "fill-current")} />
                </div>
                <span className="text-sm font-bold pr-2">{post.likes}</span>
              </button>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <div className="p-1.5 rounded-full">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <span className="text-sm font-bold">{post.commentsCount}</span>
              </div>
            </div>

            {post.isBookable && (
              <Button 
                size="sm" 
                className={cn(
                  "rounded-full font-bold px-5 tracking-wide shadow-sm hover-elevate transition-transform active:scale-95",
                  post.price ? "gap-2" : ""
                )}
                onClick={handleBook}
                disabled={createBooking.isPending}
              >
                {createBooking.isPending ? "Reserving..." : "Reserve"}
                {post.price != null && post.price > 0 && (
                  <span className="text-primary-foreground/80 font-semibold text-xs border-l border-primary-foreground/30 pl-2">
                    ${post.price}
                  </span>
                )}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <Sheet>
      <SheetTrigger asChild>
        <div className="w-full cursor-pointer">
          {cardContent}
        </div>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl p-0 flex flex-col border-none">
        <SheetHeader className="p-4 border-b border-border/50 text-left sticky top-0 bg-background/90 backdrop-blur-md z-10">
          <SheetTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Post Details</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto pb-24 relative">
          <PostDetail postId={post.id} />
          {post.isBookable && (
            <div className="fixed bottom-0 left-0 right-0 p-5 bg-background/90 backdrop-blur-xl border-t border-border/50">
              <Button 
                size="lg" 
                className="w-full rounded-xl font-bold shadow-lg"
                onClick={handleBook}
                disabled={createBooking.isPending}
              >
                {createBooking.isPending ? "Reserving..." : "Reserve Spot"}
                {post.price != null && post.price > 0 && ` - $${post.price}`}
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
