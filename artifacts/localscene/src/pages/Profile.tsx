import { useState } from "react";
import { User, MapPin, Settings, Grid, Heart, BarChart } from "lucide-react";
import { useGetProfile, useListPosts, useUpdateProfile, useGetStats } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PostCard } from "@/components/PostCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { getGetProfileQueryKey } from "@workspace/api-client-react";

export default function Profile() {
  const queryClient = useQueryClient();
  const { data: profile, isLoading: profileLoading } = useGetProfile();
  const { data: stats, isLoading: statsLoading } = useGetStats();
  const { data: posts, isLoading: postsLoading } = useListPosts();
  const updateProfile = useUpdateProfile();
  const [editOpen, setEditOpen] = useState(false);

  const [formData, setFormData] = useState({
    displayName: "",
    bio: "",
    location: "",
  });

  const handleEditOpen = () => {
    if (profile) {
      setFormData({
        displayName: profile.displayName || "",
        bio: profile.bio || "",
        location: profile.location || "",
      });
      setEditOpen(true);
    }
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile.mutate({ data: formData }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetProfileQueryKey() });
        setEditOpen(false);
        toast({ title: "Profile updated" });
      },
      onError: () => {
        toast({ title: "Update failed", variant: "destructive" });
      }
    });
  };

  if (profileLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Skeleton className="h-48 w-full rounded-none" />
        <div className="px-5 relative pb-6">
          <Skeleton className="w-24 h-24 rounded-full border-4 border-background absolute -top-12" />
          <div className="mt-14 flex flex-col gap-2">
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-16 w-full mt-2" />
          </div>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="flex flex-col min-h-full pb-6 bg-background">
      {/* Cover Photo */}
      <div className="relative h-48 bg-muted overflow-hidden">
        {profile.coverUrl ? (
          <img src={profile.coverUrl} alt="Cover" className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/40 to-accent/40" />
        )}
        <div className="absolute top-4 right-4 flex gap-2">
          <Button size="icon" variant="secondary" className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white border-none backdrop-blur-md">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Profile Info */}
      <div className="px-5 relative">
        <div className="flex justify-between items-end">
          <Avatar className="w-24 h-24 border-4 border-background shadow-lg absolute -top-12 bg-muted">
            <AvatarImage src={profile.avatarUrl || undefined} />
            <AvatarFallback className="text-3xl font-bold bg-primary/10 text-primary">
              {profile.displayName?.slice(0, 2).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          
          <div className="mt-4 flex gap-2 w-full justify-end">
            <Sheet open={editOpen} onOpenChange={setEditOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="rounded-full font-bold border-border shadow-sm h-9" onClick={handleEditOpen}>
                  Edit Profile
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[80vh] rounded-t-3xl">
                <SheetHeader className="mb-6">
                  <SheetTitle>Edit Profile</SheetTitle>
                </SheetHeader>
                <form onSubmit={handleUpdate} className="flex flex-col gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input id="displayName" value={formData.displayName} onChange={e => setFormData({...formData, displayName: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input id="location" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea id="bio" value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} className="h-24" />
                  </div>
                  <Button type="submit" className="mt-4 w-full font-bold" disabled={updateProfile.isPending}>
                    {updateProfile.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </form>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        <div className="mt-2 mb-5">
          <h1 className="text-2xl font-black tracking-tight">{profile.displayName}</h1>
          <p className="text-muted-foreground font-medium flex items-center gap-1.5 mt-0.5">
            @{profile.username}
          </p>
          
          {profile.bio && (
            <p className="mt-3 text-sm leading-relaxed text-foreground/90">
              {profile.bio}
            </p>
          )}

          <div className="flex items-center gap-4 mt-4 text-sm font-medium">
            <div className="flex items-center gap-1 text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>{profile.location || "Earth"}</span>
            </div>
          </div>

          <div className="flex items-center gap-6 mt-5 pt-5 border-t border-border/50">
            <div className="flex flex-col items-center">
              <span className="font-black text-lg">{stats?.totalPosts || profile.postsCount}</span>
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Posts</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="font-black text-lg">{profile.followersCount}</span>
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Followers</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="font-black text-lg">{profile.followingCount}</span>
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Following</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="posts" className="w-full">
        <TabsList className="w-full rounded-none border-b border-border/50 bg-transparent h-12 p-0 justify-around">
          <TabsTrigger 
            value="posts" 
            className="rounded-none h-full data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent text-muted-foreground data-[state=active]:text-foreground font-bold flex gap-2 flex-1"
          >
            <Grid className="w-4 h-4" /> Posts
          </TabsTrigger>
          <TabsTrigger 
            value="stats" 
            className="rounded-none h-full data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent text-muted-foreground data-[state=active]:text-foreground font-bold flex gap-2 flex-1"
          >
            <BarChart className="w-4 h-4" /> Impact
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="posts" className="m-0 border-none outline-none">
          <div className="flex flex-col divide-y divide-border/20">
            {postsLoading ? (
               <div className="p-5 text-center text-muted-foreground">Loading posts...</div>
            ) : posts && posts.length > 0 ? (
              posts.slice(0, 3).map((post) => (
                <PostCard key={post.id} post={post} />
              ))
            ) : (
              <div className="py-12 text-center text-muted-foreground flex flex-col items-center">
                <Grid className="w-10 h-10 mb-3 opacity-20" />
                <p>No posts yet</p>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="stats" className="m-0 border-none outline-none p-5">
           <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <BarChart className="w-5 h-5 text-primary" />
                My Local Impact
              </h3>
              {statsLoading ? (
                <Skeleton className="w-full h-24" />
              ) : stats ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted p-4 rounded-lg flex flex-col">
                    <span className="text-muted-foreground text-sm font-medium">Total Bookings</span>
                    <span className="text-2xl font-black">{stats.totalBookings}</span>
                  </div>
                  <div className="bg-muted p-4 rounded-lg flex flex-col">
                    <span className="text-muted-foreground text-sm font-medium">Upcoming</span>
                    <span className="text-2xl font-black text-primary">{stats.upcomingBookings}</span>
                  </div>
                </div>
              ) : null}
           </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
