import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { PlusCircle } from "lucide-react";
import { useCreatePost } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { getListPostsQueryKey } from "@workspace/api-client-react";

export function CreatePostSheet({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const createPost = useCreatePost();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    title: "",
    body: "",
    category: "Barbershop",
    location: "",
    isBookable: false,
    price: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createPost.mutate(
      {
        data: {
          title: formData.title,
          body: formData.body,
          category: formData.category,
          location: formData.location,
          isBookable: formData.isBookable,
          price: formData.price ? Number(formData.price) : undefined,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListPostsQueryKey() });
          setOpen(false);
          toast({
            title: "Post created!",
            description: "Your local scene update is live.",
          });
          setFormData({
            title: "",
            body: "",
            category: "Barbershop",
            location: "",
            isBookable: false,
            price: "",
          });
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to create post. Please try again.",
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl bg-background border-border flex flex-col p-0">
        <SheetHeader className="p-5 border-b border-border/50 text-left">
          <SheetTitle className="text-xl font-bold">What's happening?</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              required
              placeholder="e.g., Block Party on 5th Ave"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              <option value="Barbershop">Barbershop</option>
              <option value="Beauty">Beauty</option>
              <option value="Wellness">Wellness</option>
              <option value="Fitness">Fitness</option>
              <option value="Events">Events</option>
              <option value="Nightlife">Nightlife</option>
              <option value="Food">Food</option>
              <option value="Sports">Sports</option>
              <option value="Arts">Arts</option>
              <option value="Music">Music</option>
              <option value="News">News</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              required
              placeholder="e.g., Downtown Plaza"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="body">Details</Label>
            <Textarea
              id="body"
              placeholder="Tell us more about it..."
              value={formData.body}
              onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              className="min-h-[100px]"
            />
          </div>

          <div className="flex items-center justify-between border p-4 rounded-xl border-border">
            <div className="space-y-0.5">
              <Label className="text-base">Allow bookings</Label>
              <p className="text-xs text-muted-foreground">Let people reserve a spot</p>
            </div>
            <Switch
              checked={formData.isBookable}
              onCheckedChange={(checked) => setFormData({ ...formData, isBookable: checked })}
            />
          </div>

          {formData.isBookable && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
              <Label htmlFor="price">Price ($)</Label>
              <Input
                id="price"
                type="number"
                placeholder="Optional, leave empty for Free"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              />
            </div>
          )}

          <div className="pt-4 pb-8">
            <Button type="submit" className="w-full font-bold h-12 rounded-xl text-base" disabled={createPost.isPending}>
              {createPost.isPending ? "Posting..." : "Post to Everything Hub"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
