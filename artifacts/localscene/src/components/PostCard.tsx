import { useState, useRef } from "react";
import { Heart, MessageCircle, MapPin, Calendar, Send, Bookmark, Star, Share2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import {
  Post,
  useTogglePostLike,
  useCreateBooking,
  useGetPost,
  useListComments,
  useCreateComment,
  useListReviews,
  useCreateReview,
  useSavePlace,
  useUnsavePlace,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getListPostsQueryKey,
  getGetTrendingPostsQueryKey,
  getGetFeaturedPostsQueryKey,
  getGetPostQueryKey,
  getListCommentsQueryKey,
  getListBookingsQueryKey,
  getListReviewsQueryKey,
  getListSavedPlacesQueryKey,
} from "@workspace/api-client-react";
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


const CATEGORY_IMAGES: Record<string, string> = {
  Food: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&h=400&fit=crop&auto=format",
  Barbershop: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&h=400&fit=crop&auto=format",
  Beauty: "https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=600&h=400&fit=crop&auto=format",
  Wellness: "https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=600&h=400&fit=crop&auto=format",
  Fitness: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&h=400&fit=crop&auto=format",
  Events: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&h=400&fit=crop&auto=format",
  Nightlife: "https://images.unsplash.com/photo-1516997121675-4c2d1684aa3e?w=600&h=400&fit=crop&auto=format",
  Sports: "https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=600&h=400&fit=crop&auto=format",
  Arts: "https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=600&h=400&fit=crop&auto=format",
  Music: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&h=400&fit=crop&auto=format",
  News: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600&h=400&fit=crop&auto=format",
};

interface PostCardProps {
  post: Post;
  variant?: "feed" | "featured" | "compact";
}

function StarRating({ value, onChange, readonly }: { value: number; onChange?: (v: number) => void; readonly?: boolean }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(0)}
          className={cn("transition-transform", !readonly && "hover:scale-110 active:scale-95")}
        >
          <Star
            className={cn(
              "w-5 h-5 transition-colors",
              (hover || value) >= star ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/40"
            )}
          />
        </button>
      ))}
    </div>
  );
}

function ReviewSection({ postId }: { postId: number }) {
  const queryClient = useQueryClient();
  const { data: reviews, isLoading } = useListReviews(postId);
  const createReview = useCreateReview();
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  const [showForm, setShowForm] = useState(false);

  const avgRating = reviews && reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating || !body.trim()) return;
    createReview.mutate(
      { id: postId, data: { rating, body: body.trim() } },
      {
        onSuccess: () => {
          setRating(0);
          setBody("");
          setShowForm(false);
          queryClient.invalidateQueries({ queryKey: getListReviewsQueryKey(postId) });
          toast({ title: "Review posted!" });
        },
        onError: () => toast({ title: "Could not post review", variant: "destructive" }),
      }
    );
  };

  return (
    <div className="flex flex-col gap-4 px-5 pb-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">Reviews</h3>
          {avgRating !== null && (
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-bold">{avgRating.toFixed(1)}</span>
              <span className="text-xs text-muted-foreground">({reviews!.length})</span>
            </div>
          )}
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-full hover:bg-primary/20 transition-colors"
          >
            + Write Review
          </button>
        )}
      </div>

      {/* Write form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-muted/50 rounded-xl p-4 flex flex-col gap-3 border border-border/40">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold">Your Rating</span>
            <StarRating value={rating} onChange={setRating} />
          </div>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Share your experience..."
            className="w-full bg-background rounded-lg px-3 py-2.5 text-sm outline-none border border-border/50 focus:border-primary/50 transition-all resize-none h-20"
            maxLength={600}
          />
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={!rating || !body.trim() || createReview.isPending} className="flex-1 font-bold">
              {createReview.isPending ? "Posting..." : "Post Review"}
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => { setShowForm(false); setRating(0); setBody(""); }}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {/* Review list */}
      {isLoading ? (
        <div className="text-sm text-muted-foreground text-center py-4">Loading reviews...</div>
      ) : reviews && reviews.length > 0 ? (
        <div className="flex flex-col gap-3">
          {reviews.map((r) => (
            <div key={r.id} className="flex gap-3">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                  {r.authorName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col flex-1 min-w-0">
                <div className="bg-muted/60 rounded-2xl rounded-tl-sm px-3.5 py-2.5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs">{r.authorName}</span>
                    <StarRating value={r.rating} readonly />
                  </div>
                  <p className="text-sm text-foreground/90 leading-relaxed break-words">{r.body}</p>
                </div>
                <span className="text-[10px] text-muted-foreground mt-1 ml-2">
                  {format(parseISO(r.createdAt), "MMM d, yyyy")}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm text-muted-foreground text-center py-4">
          No reviews yet. Be the first to review!
        </div>
      )}
    </div>
  );
}

function CommentSection({ postId }: { postId: number }) {
  const queryClient = useQueryClient();
  const { data: comments, isLoading } = useListComments(postId);
  const createComment = useCreateComment();
  const [body, setBody] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    createComment.mutate(
      { id: postId, data: { body: body.trim() } },
      {
        onSuccess: () => {
          setBody("");
          queryClient.invalidateQueries({ queryKey: getListCommentsQueryKey(postId) });
          queryClient.invalidateQueries({ queryKey: getGetPostQueryKey(postId) });
          queryClient.invalidateQueries({ queryKey: getListPostsQueryKey() });
        },
        onError: () => toast({ title: "Could not post comment", variant: "destructive" }),
      }
    );
  };

  return (
    <div className="flex flex-col gap-4 px-5 pb-4">
      <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">
        Comments {comments && comments.length > 0 && `(${comments.length})`}
      </h3>
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          ref={inputRef}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Add a comment..."
          className="flex-1 bg-muted/60 rounded-full px-4 py-2.5 text-sm outline-none border border-border/50 focus:border-primary/50 focus:bg-background transition-all"
          maxLength={500}
        />
        <button
          type="submit"
          disabled={!body.trim() || createComment.isPending}
          className={cn(
            "w-9 h-9 rounded-full flex items-center justify-center transition-all flex-shrink-0",
            body.trim() ? "bg-primary text-white shadow-sm active:scale-95" : "bg-muted text-muted-foreground"
          )}
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
      <div className="flex flex-col gap-3">
        {isLoading ? (
          <div className="text-sm text-muted-foreground text-center py-4">Loading comments...</div>
        ) : comments && comments.length > 0 ? (
          comments.map((c) => (
            <div key={c.id} className="flex gap-3">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                  {c.authorName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col flex-1 min-w-0">
                <div className="bg-muted/60 rounded-2xl rounded-tl-sm px-3.5 py-2.5">
                  <span className="font-bold text-xs text-foreground block mb-0.5">{c.authorName}</span>
                  <p className="text-sm text-foreground/90 leading-relaxed break-words">{c.body}</p>
                </div>
                <span className="text-[10px] text-muted-foreground mt-1 ml-2">
                  {format(parseISO(c.createdAt), "MMM d, h:mm a")}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-sm text-muted-foreground text-center py-6">
            No comments yet. Be the first to say something.
          </div>
        )}
      </div>
    </div>
  );
}

function PostDetail({ postId, onBook, isBooking }: { postId: number; onBook: () => void; isBooking: boolean }) {
  const { data: post, isLoading } = useGetPost(postId);
  const [tab, setTab] = useState<"reviews" | "comments">("reviews");

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
  if (!post) return null;

  return (
    <div className="flex flex-col gap-0">
      {post.imageUrl && (
        <div className="w-full bg-muted">
          <img src={post.imageUrl} alt={post.title} className="w-full max-h-72 object-cover" />
        </div>
      )}
      <div className="flex flex-col gap-4 p-5">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 ring-2 ring-background shadow-sm">
            <AvatarImage src={post.authorAvatar || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
              {post.authorName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-bold text-sm leading-none">{post.authorName}</span>
            <span className="text-muted-foreground text-xs mt-1">
              {format(parseISO(post.createdAt), "MMM d, yyyy")} Â· {post.category}
            </span>
          </div>
        </div>
        <div>
          <h2 className="text-xl font-black leading-snug mb-2">{post.title}</h2>
          {post.body && <p className="text-foreground/80 text-sm leading-relaxed">{post.body}</p>}
        </div>
        <div className="flex flex-col gap-2 bg-muted/40 rounded-xl p-3.5 border border-border/40">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <span className="font-medium">{post.location}</span>
          </div>
          {post.eventDate && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span className="font-medium">{format(parseISO(post.eventDate), "EEEE, MMMM d Â· h:mm a")}</span>
            </div>
          )}
        </div>
        {post.isBookable && (
          <Button size="lg" className="w-full rounded-xl font-bold shadow-md" onClick={onBook} disabled={isBooking}>
            {isBooking ? "Reserving..." : `Reserve Spot${post.price && post.price > 0 ? ` Â· $${post.price}` : post.price === 0 ? " Â· Free" : ""}`}
          </Button>
        )}
      </div>

      {/* Tab switcher: Reviews / Comments */}
      <div className="flex border-b border-border/50 mx-0">
        {(["reviews", "comments"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 py-3 text-sm font-bold capitalize transition-colors border-b-2 -mb-px",
              tab === t
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="pt-4">
        {tab === "reviews" ? <ReviewSection postId={postId} /> : <CommentSection postId={postId} />}
      </div>
    </div>
  );
}

export function PostCard({ post, variant = "feed" }: PostCardProps) {
  const queryClient = useQueryClient();
  const toggleLike = useTogglePostLike();
  const createBooking = useCreateBooking();
  const savePlace = useSavePlace();
  const unsavePlace = useUnsavePlace();
  const [open, setOpen] = useState(false);

  const [localLiked, setLocalLiked] = useState(post.liked);
  const [localLikes, setLocalLikes] = useState(post.likes);
  const [localSaved, setLocalSaved] = useState(post.saved ?? false);
  const displayImage = post.imageUrl || CATEGORY_IMAGES[post.category];

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    const wasLiked = localLiked;
    setLocalLiked(!wasLiked);
    setLocalLikes(wasLiked ? localLikes - 1 : localLikes + 1);
    toggleLike.mutate(
      { id: post.id },
      {
        onSuccess: (updated) => {
          setLocalLiked(updated.liked);
          setLocalLikes(updated.likes);
          queryClient.invalidateQueries({ queryKey: getListPostsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetTrendingPostsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetFeaturedPostsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetPostQueryKey(post.id) });
        },
        onError: () => {
          setLocalLiked(wasLiked);
          setLocalLikes(post.likes);
        },
      }
    );
  };

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    const wasSaved = localSaved;
    setLocalSaved(!wasSaved);
    if (wasSaved) {
      unsavePlace.mutate(
        { postId: post.id },
        {
          onSuccess: () => queryClient.invalidateQueries({ queryKey: getListSavedPlacesQueryKey() }),
          onError: () => { setLocalSaved(true); toast({ title: "Could not unsave", variant: "destructive" }); },
        }
      );
    } else {
      savePlace.mutate(
        { data: { postId: post.id } },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListSavedPlacesQueryKey() });
            toast({ title: "Saved!", description: `${post.title} added to your saved places.` });
          },
          onError: () => { setLocalSaved(false); toast({ title: "Could not save", variant: "destructive" }); },
        }
      );
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = `${post.title} â ${post.location}`;
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: post.title, text, url });
      } catch {
        // user cancelled â do nothing
      }
    } else {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      toast({ title: "Copied to clipboard", description: "Link and details copied." });
    }
  };

  const handleBook = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    createBooking.mutate(
      { data: { postId: post.id } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListBookingsQueryKey() });
          toast({ title: "Spot secured!", description: `You're booked for ${post.title}.`, duration: 3000 });
          setOpen(false);
        },
        onError: () => toast({ title: "Booking failed", description: "Something went wrong. Please try again.", variant: "destructive" }),
      }
    );
  };

  const featuredCard = (
    <div className="relative overflow-hidden rounded-2xl h-72 group">
      {displayImage ? (
        <img src={displayImage} alt={post.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-primary/10" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-5 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Badge className="bg-primary text-primary-foreground border-none font-bold text-xs uppercase tracking-wider">{post.category}</Badge>
          {post.isBookable && <Badge variant="outline" className="bg-white/20 text-white border-white/30 backdrop-blur-sm text-xs">Bookable</Badge>}
        </div>
        <h3 className="text-xl font-black text-white leading-tight">{post.title}</h3>
        <div className="flex items-center gap-3 text-white/80 text-sm">
          <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /><span className="truncate max-w-[140px]">{post.location}</span></div>
          {post.eventDate && <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /><span>{format(parseISO(post.eventDate), "MMM d")}</span></div>}
        </div>
      </div>
    </div>
  );

  const feedCard = (
    <div className="bg-card border-b border-border/50 py-4 px-4 flex flex-col gap-3 hover:bg-muted/10 transition-colors active:bg-muted/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Avatar className="h-9 w-9 ring-2 ring-background">
            <AvatarImage src={post.authorAvatar || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
              {post.authorName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-bold text-sm leading-none">{post.authorName}</span>
            <span className="text-muted-foreground text-[10px] mt-0.5 uppercase tracking-wide font-medium">
              {format(parseISO(post.createdAt), "MMM d")} Â· {post.category}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {post.isTrending && (
            <Badge variant="secondary" className="text-[10px] font-bold bg-primary/15 text-primary border border-primary/30">Trending</Badge>
          )}
          {/* Bookmark */}
          <button
            onClick={handleSave}
            className="p-1.5 rounded-full hover:bg-muted transition-colors"
          >
            <Bookmark className={cn("w-4 h-4 transition-all", localSaved ? "fill-primary text-primary" : "text-muted-foreground")} />
          </button>
        </div>
      </div>

      <div>
        <h3 className="font-black text-base leading-snug">{post.title}</h3>
        {post.body && <p className="text-muted-foreground text-sm line-clamp-2 mt-1 leading-relaxed">{post.body}</p>}
      </div>

      {displayImage && (
        <div className="rounded-xl overflow-hidden max-h-60 bg-muted border border-border/40">
          <img src={displayImage} alt={post.title} className="w-full h-full object-cover" loading="lazy" />
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-full border border-border/30">
          <MapPin className="w-3 h-3" /><span className="truncate max-w-[130px]">{post.location}</span>
        </div>
        {post.eventDate && (
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-full border border-border/30">
            <Calendar className="w-3 h-3" /><span>{format(parseISO(post.eventDate), "MMM d")}</span>
          </div>
        )}
        {post.price != null && post.price > 0 && (
          <div className="flex items-center text-[11px] font-bold text-primary bg-primary/15 px-2.5 py-1 rounded-full border border-primary/30">${post.price}</div>
        )}
        {post.price === 0 && (
          <div className="flex items-center text-[11px] font-bold text-primary bg-primary/15 px-2.5 py-1 rounded-full border border-primary/30">Free</div>
        )}
      </div>

      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-3">
          <button onClick={handleLike} className="flex items-center gap-1.5 group">
            <div className={cn("p-1.5 rounded-full transition-all duration-150", !localLiked && "group-hover:bg-muted/20")}>
              <Heart className={cn("w-5 h-5 transition-all duration-150", localLiked ? "fill-red-500 text-red-500 scale-110" : "text-muted-foreground group-hover:text-foreground")} />
            </div>
            <span className={cn("text-sm font-bold transition-colors", localLiked ? "text-red-500" : "text-muted-foreground")}>{localLikes}</span>
          </button>
          <button className="flex items-center gap-1.5 group">
            <div className="p-1.5 rounded-full group-hover:bg-muted transition-colors">
              <MessageCircle className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
            </div>
            <span className="text-sm font-bold text-muted-foreground">{post.commentsCount}</span>
          </button>
          <button onClick={handleShare} className="group">
            <div className="p-1.5 rounded-full group-hover:bg-muted transition-colors">
              <Share2 className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </div>
          </button>
        </div>
        {post.isBookable && (
          <Button size="sm" className="rounded-full font-bold px-5 shadow-sm active:scale-95 transition-transform" onClick={handleBook} disabled={createBooking.isPending}>
            {createBooking.isPending ? "Reserving..." : post.price && post.price > 0 ? `Reserve Â· $${post.price}` : "Reserve"}
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <div className="w-full cursor-pointer">{variant === "featured" ? featuredCard : feedCard}</div>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[92vh] rounded-t-3xl p-0 flex flex-col border-none">
        <SheetHeader className="px-5 pt-4 pb-3 border-b border-border/50 flex-row items-center justify-between flex-shrink-0 sticky top-0 bg-background/95 backdrop-blur-md z-10">
          <SheetTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{post.category}</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto pb-8">
          <PostDetail postId={post.id} onBook={handleBook} isBooking={createBooking.isPending} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
