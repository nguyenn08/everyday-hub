import { useState, useRef } from "react";
import { Heart, MessageCircle, MapPin, Calendar, Send, X } from "lucide-react";
import { format, parseISO } from "date-fns";
import {
  Post,
  useTogglePostLike,
  useCreateBooking,
  useGetPost,
  useListComments,
  useCreateComment,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getListPostsQueryKey,
  getGetTrendingPostsQueryKey,
  getGetFeaturedPostsQueryKey,
  getGetPostQueryKey,
  getListCommentsQueryKey,
  getListBookingsQueryKey,
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

interface PostCardProps {
  post: Post;
  variant?: "feed" | "featured" | "compact";
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
        onError: () => {
          toast({ title: "Could not post comment", variant: "destructive" });
        },
      }
    );
  };

  return (
    <div className="flex flex-col gap-4 px-5 pb-4">
      <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">
        Comments {comments && comments.length > 0 && `(${comments.length})`}
      </h3>

      {/* Add comment */}
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
            body.trim()
              ? "bg-primary text-white shadow-sm active:scale-95"
              : "bg-muted text-muted-foreground"
          )}
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

      {/* Comment list */}
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

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
  if (!post) return null;

  return (
    <div className="flex flex-col gap-0">
      {/* Image */}
      {post.imageUrl && (
        <div className="w-full bg-muted">
          <img
            src={post.imageUrl}
            alt={post.title}
            className="w-full max-h-72 object-cover"
          />
        </div>
      )}

      <div className="flex flex-col gap-4 p-5">
        {/* Author row */}
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
              {format(parseISO(post.createdAt), "MMM d, yyyy")} · {post.category}
            </span>
          </div>
        </div>

        {/* Title + body */}
        <div>
          <h2 className="text-xl font-black leading-snug mb-2">{post.title}</h2>
          {post.body && (
            <p className="text-foreground/80 text-sm leading-relaxed">{post.body}</p>
          )}
        </div>

        {/* Location + date */}
        <div className="flex flex-col gap-2 bg-muted/40 rounded-xl p-3.5 border border-border/40">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <span className="font-medium">{post.location}</span>
          </div>
          {post.eventDate && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span className="font-medium">
                {format(parseISO(post.eventDate), "EEEE, MMMM d · h:mm a")}
              </span>
            </div>
          )}
        </div>

        {/* Book button inside detail */}
        {post.isBookable && (
          <Button
            size="lg"
            className="w-full rounded-xl font-bold shadow-md"
            onClick={onBook}
            disabled={isBooking}
          >
            {isBooking ? "Reserving..." : `Reserve Spot${post.price && post.price > 0 ? ` · $${post.price}` : post.price === 0 ? " · Free" : ""}`}
          </Button>
        )}
      </div>

      {/* Divider */}
      <div className="h-px bg-border/50 mx-5" />

      {/* Comments */}
      <div className="pt-4">
        <CommentSection postId={postId} />
      </div>
    </div>
  );
}

export function PostCard({ post, variant = "feed" }: PostCardProps) {
  const queryClient = useQueryClient();
  const toggleLike = useTogglePostLike();
  const createBooking = useCreateBooking();
  const [open, setOpen] = useState(false);

  // Optimistic like state — updates instantly on tap
  const [localLiked, setLocalLiked] = useState(post.liked);
  const [localLikes, setLocalLikes] = useState(post.likes);

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
          // revert on failure
          setLocalLiked(wasLiked);
          setLocalLikes(post.likes);
        },
      }
    );
  };

  const handleBook = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    createBooking.mutate(
      { data: { postId: post.id } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListBookingsQueryKey() });
          toast({
            title: "Spot secured!",
            description: `You're booked for ${post.title}.`,
            duration: 3000,
          });
          setOpen(false);
        },
        onError: () => {
          toast({
            title: "Booking failed",
            description: "Something went wrong. Please try again.",
            variant: "destructive",
          });
        },
      }
    );
  };

  const featuredCard = (
    <div className="relative overflow-hidden rounded-2xl h-72 group">
      {post.imageUrl ? (
        <img
          src={post.imageUrl}
          alt={post.title}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-primary/10" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-5 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Badge className="bg-primary text-primary-foreground border-none font-bold text-xs uppercase tracking-wider">
            {post.category}
          </Badge>
          {post.isBookable && (
            <Badge variant="outline" className="bg-white/20 text-white border-white/30 backdrop-blur-sm text-xs">
              Bookable
            </Badge>
          )}
        </div>
        <h3 className="text-xl font-black text-white leading-tight">{post.title}</h3>
        <div className="flex items-center gap-3 text-white/80 text-sm">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" />
            <span className="truncate max-w-[140px]">{post.location}</span>
          </div>
          {post.eventDate && (
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>{format(parseISO(post.eventDate), "MMM d")}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const feedCard = (
    <div className="bg-card border-b border-border/50 py-4 px-4 flex flex-col gap-3 hover:bg-muted/10 transition-colors active:bg-muted/20">
      {/* Author */}
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
              {format(parseISO(post.createdAt), "MMM d")} · {post.category}
            </span>
          </div>
        </div>
        {post.isTrending && (
          <Badge variant="secondary" className="text-[10px] font-bold bg-orange-50 text-orange-600 border border-orange-200">
            Trending
          </Badge>
        )}
      </div>

      {/* Content */}
      <div>
        <h3 className="font-black text-base leading-snug">{post.title}</h3>
        {post.body && (
          <p className="text-muted-foreground text-sm line-clamp-2 mt-1 leading-relaxed">
            {post.body}
          </p>
        )}
      </div>

      {/* Image */}
      {post.imageUrl && (
        <div className="rounded-xl overflow-hidden max-h-60 bg-muted border border-border/40">
          <img
            src={post.imageUrl}
            alt={post.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      )}

      {/* Meta pills */}
      <div className="flex flex-wrap gap-1.5">
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-full border border-border/30">
          <MapPin className="w-3 h-3" />
          <span className="truncate max-w-[130px]">{post.location}</span>
        </div>
        {post.eventDate && (
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-full border border-border/30">
            <Calendar className="w-3 h-3" />
            <span>{format(parseISO(post.eventDate), "MMM d")}</span>
          </div>
        )}
        {post.price != null && post.price > 0 && (
          <div className="flex items-center text-[11px] font-bold text-green-700 bg-green-50 px-2.5 py-1 rounded-full border border-green-200">
            ${post.price}
          </div>
        )}
        {post.price === 0 && (
          <div className="flex items-center text-[11px] font-bold text-green-700 bg-green-50 px-2.5 py-1 rounded-full border border-green-200">
            Free
          </div>
        )}
      </div>

      {/* Actions row */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-3">
          {/* Like button — goes red instantly */}
          <button
            onClick={handleLike}
            className="flex items-center gap-1.5 group"
          >
            <div className={cn(
              "p-1.5 rounded-full transition-all duration-150",
              localLiked ? "bg-red-50" : "group-hover:bg-muted"
            )}>
              <Heart
                className={cn(
                  "w-5 h-5 transition-all duration-150",
                  localLiked
                    ? "fill-red-500 text-red-500 scale-110"
                    : "text-muted-foreground group-hover:text-foreground"
                )}
              />
            </div>
            <span className={cn(
              "text-sm font-bold transition-colors",
              localLiked ? "text-red-500" : "text-muted-foreground"
            )}>
              {localLikes}
            </span>
          </button>

          {/* Comments count */}
          <button className="flex items-center gap-1.5 group">
            <div className="p-1.5 rounded-full group-hover:bg-muted transition-colors">
              <MessageCircle className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
            </div>
            <span className="text-sm font-bold text-muted-foreground">{post.commentsCount}</span>
          </button>
        </div>

        {/* Reserve button */}
        {post.isBookable && (
          <Button
            size="sm"
            className="rounded-full font-bold px-5 shadow-sm active:scale-95 transition-transform"
            onClick={handleBook}
            disabled={createBooking.isPending}
          >
            {createBooking.isPending
              ? "Reserving..."
              : post.price && post.price > 0
              ? `Reserve · $${post.price}`
              : "Reserve"}
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <div className="w-full cursor-pointer">
          {variant === "featured" ? featuredCard : feedCard}
        </div>
      </SheetTrigger>

      <SheetContent
        side="bottom"
        className="h-[92vh] rounded-t-3xl p-0 flex flex-col border-none"
      >
        <SheetHeader className="px-5 pt-4 pb-3 border-b border-border/50 flex-row items-center justify-between flex-shrink-0 sticky top-0 bg-background/95 backdrop-blur-md z-10">
          <SheetTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
            {post.category}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto pb-8">
          <PostDetail
            postId={post.id}
            onBook={handleBook}
            isBooking={createBooking.isPending}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
