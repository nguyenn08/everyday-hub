import { useState } from "react";
import {
  User, MapPin, Settings, Grid, Bookmark, BarChart,
  CreditCard, Plus, Trash2, Star as StarIcon, CheckCircle,
} from "lucide-react";
import {
  useGetProfile, useListPosts, useUpdateProfile, useGetStats,
  useListSavedPlaces, useListPaymentMethods,
  useAddPaymentMethod, useDeletePaymentMethod, useSetDefaultPaymentMethod,
} from "@workspace/api-client-react";
import {
  getGetProfileQueryKey, getListSavedPlacesQueryKey, getListPaymentMethodsQueryKey,
} from "@workspace/api-client-react";
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
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const CARD_BRANDS = ["Visa", "Mastercard", "Amex", "Discover"];
const CARD_BRAND_COLORS: Record<string, string> = {
  Visa: "bg-blue-50 text-blue-700 border-blue-200",
  Mastercard: "bg-red-50 text-red-700 border-red-200",
  Amex: "bg-sky-50 text-sky-700 border-sky-200",
  Discover: "bg-orange-50 text-orange-700 border-orange-200",
};

function PaymentMethodsSection() {
  const queryClient = useQueryClient();
  const { data: methods, isLoading } = useListPaymentMethods();
  const addMethod = useAddPaymentMethod();
  const deleteMethod = useDeletePaymentMethod();
  const setDefault = useSetDefaultPaymentMethod();
  const [addOpen, setAddOpen] = useState(false);

  const [form, setForm] = useState({
    cardLabel: "", cardLast4: "", cardBrand: "Visa", expiryMonth: "", expiryYear: "",
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const month = parseInt(form.expiryMonth);
    const year = parseInt(form.expiryYear);
    if (!form.cardLast4.match(/^\d{4}$/) || isNaN(month) || isNaN(year)) {
      toast({ title: "Check your card details", variant: "destructive" });
      return;
    }
    addMethod.mutate(
      { data: { cardLabel: form.cardLabel || undefined, cardLast4: form.cardLast4, cardBrand: form.cardBrand, expiryMonth: month, expiryYear: year } },
      {
        onSuccess: () => {
          setAddOpen(false);
          setForm({ cardLabel: "", cardLast4: "", cardBrand: "Visa", expiryMonth: "", expiryYear: "" });
          queryClient.invalidateQueries({ queryKey: getListPaymentMethodsQueryKey() });
          toast({ title: "Card saved!" });
        },
        onError: () => toast({ title: "Could not save card", variant: "destructive" }),
      }
    );
  };

  const handleDelete = (id: number) => {
    deleteMethod.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListPaymentMethodsQueryKey() });
          toast({ title: "Card removed" });
        },
      }
    );
  };

  const handleSetDefault = (id: number) => {
    setDefault.mutate(
      { id },
      { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListPaymentMethodsQueryKey() }) }
    );
  };

  return (
    <div className="px-5 pb-6">
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
          <h3 className="font-bold text-base flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            Payment Methods
          </h3>
          <Sheet open={addOpen} onOpenChange={setAddOpen}>
            <SheetTrigger asChild>
              <Button size="sm" variant="outline" className="h-8 rounded-full font-bold gap-1.5">
                <Plus className="w-3.5 h-3.5" /> Add Card
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-auto rounded-t-3xl pb-8">
              <SheetHeader className="mb-6">
                <SheetTitle>Add Payment Method</SheetTitle>
              </SheetHeader>
              <form onSubmit={handleAdd} className="flex flex-col gap-4">
                <div className="space-y-2">
                  <Label>Card Nickname (optional)</Label>
                  <Input placeholder="e.g. Personal Visa" value={form.cardLabel} onChange={e => setForm({ ...form, cardLabel: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Last 4 Digits *</Label>
                  <Input placeholder="4242" maxLength={4} value={form.cardLast4} onChange={e => setForm({ ...form, cardLast4: e.target.value.replace(/\D/g, "") })} />
                </div>
                <div className="space-y-2">
                  <Label>Card Brand *</Label>
                  <div className="flex gap-2 flex-wrap">
                    {CARD_BRANDS.map(b => (
                      <button key={b} type="button" onClick={() => setForm({ ...form, cardBrand: b })}
                        className={cn("px-3 py-1.5 rounded-full text-sm font-bold border transition-all", form.cardBrand === b ? "bg-primary text-white border-primary" : "bg-muted text-muted-foreground border-border hover:border-primary/50")}>
                        {b}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="space-y-2 flex-1">
                    <Label>Exp. Month *</Label>
                    <Input placeholder="MM" maxLength={2} value={form.expiryMonth} onChange={e => setForm({ ...form, expiryMonth: e.target.value.replace(/\D/g, "") })} />
                  </div>
                  <div className="space-y-2 flex-1">
                    <Label>Exp. Year *</Label>
                    <Input placeholder="YYYY" maxLength={4} value={form.expiryYear} onChange={e => setForm({ ...form, expiryYear: e.target.value.replace(/\D/g, "") })} />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">This stores card info locally for display only. No real payment processing.</p>
                <Button type="submit" className="w-full font-bold mt-2" disabled={addMethod.isPending}>
                  {addMethod.isPending ? "Saving..." : "Save Card"}
                </Button>
              </form>
            </SheetContent>
          </Sheet>
        </div>

        {isLoading ? (
          <div className="p-5 flex flex-col gap-3"><Skeleton className="h-16 w-full rounded-xl" /><Skeleton className="h-16 w-full rounded-xl" /></div>
        ) : methods && methods.length > 0 ? (
          <div className="divide-y divide-border/50">
            {methods.map((m) => (
              <div key={m.id} className="flex items-center gap-3 px-5 py-4">
                <div className={cn("text-xs font-bold px-2.5 py-1 rounded-md border", CARD_BRAND_COLORS[m.cardBrand] || "bg-muted text-muted-foreground border-border")}>
                  {m.cardBrand}
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="font-bold text-sm">•••• {m.cardLast4}</span>
                  <span className="text-xs text-muted-foreground">
                    {m.cardLabel ? `${m.cardLabel} · ` : ""}{String(m.expiryMonth).padStart(2, "0")}/{m.expiryYear}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {m.isDefault ? (
                    <Badge className="bg-primary/10 text-primary border-primary/20 text-xs font-bold gap-1">
                      <CheckCircle className="w-3 h-3" /> Default
                    </Badge>
                  ) : (
                    <button onClick={() => handleSetDefault(m.id)} className="text-xs text-muted-foreground hover:text-primary transition-colors font-medium">
                      Set default
                    </button>
                  )}
                  <button onClick={() => handleDelete(m.id)} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors rounded-full hover:bg-destructive/10">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-10 text-center flex flex-col items-center gap-2 text-muted-foreground">
            <CreditCard className="w-9 h-9 opacity-20" />
            <p className="text-sm">No payment methods saved</p>
            <button onClick={() => setAddOpen(true)} className="text-sm font-bold text-primary hover:underline">Add one now</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Profile() {
  const queryClient = useQueryClient();
  const { data: profile, isLoading: profileLoading } = useGetProfile();
  const { data: stats, isLoading: statsLoading } = useGetStats();
  const { data: posts, isLoading: postsLoading } = useListPosts();
  const { data: savedPlaces, isLoading: savedLoading } = useListSavedPlaces();
  const updateProfile = useUpdateProfile();
  const [editOpen, setEditOpen] = useState(false);

  const [formData, setFormData] = useState({ displayName: "", bio: "", location: "" });

  const handleEditOpen = () => {
    if (profile) {
      setFormData({ displayName: profile.displayName || "", bio: profile.bio || "", location: profile.location || "" });
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
      onError: () => toast({ title: "Update failed", variant: "destructive" }),
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
                <Button variant="outline" className="rounded-full font-bold border-border shadow-sm h-9" onClick={handleEditOpen}>Edit Profile</Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[80vh] rounded-t-3xl">
                <SheetHeader className="mb-6"><SheetTitle>Edit Profile</SheetTitle></SheetHeader>
                <form onSubmit={handleUpdate} className="flex flex-col gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input id="displayName" value={formData.displayName} onChange={e => setFormData({ ...formData, displayName: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input id="location" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea id="bio" value={formData.bio} onChange={e => setFormData({ ...formData, bio: e.target.value })} className="h-24" />
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
          <p className="text-muted-foreground font-medium flex items-center gap-1.5 mt-0.5">@{profile.username}</p>
          {profile.bio && <p className="mt-3 text-sm leading-relaxed text-foreground/90">{profile.bio}</p>}
          <div className="flex items-center gap-4 mt-4 text-sm font-medium">
            <div className="flex items-center gap-1 text-muted-foreground">
              <MapPin className="w-4 h-4" /><span>{profile.location || "Earth"}</span>
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
              <span className="font-black text-lg">{savedPlaces?.length ?? 0}</span>
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Saved</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="posts" className="w-full">
        <TabsList className="w-full rounded-none border-b border-border/50 bg-transparent h-12 p-0 justify-around">
          {[
            { value: "posts", icon: <Grid className="w-4 h-4" />, label: "Posts" },
            { value: "saved", icon: <Bookmark className="w-4 h-4" />, label: "Saved" },
            { value: "stats", icon: <BarChart className="w-4 h-4" />, label: "Impact" },
          ].map(({ value, icon, label }) => (
            <TabsTrigger
              key={value}
              value={value}
              className="rounded-none h-full data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent text-muted-foreground data-[state=active]:text-foreground font-bold flex gap-2 flex-1"
            >
              {icon} {label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Posts tab */}
        <TabsContent value="posts" className="m-0 border-none outline-none">
          <div className="flex flex-col divide-y divide-border/20">
            {postsLoading ? (
              <div className="p-5 text-center text-muted-foreground">Loading posts...</div>
            ) : posts && posts.length > 0 ? (
              posts.slice(0, 3).map((post) => <PostCard key={post.id} post={post} />)
            ) : (
              <div className="py-12 text-center text-muted-foreground flex flex-col items-center">
                <Grid className="w-10 h-10 mb-3 opacity-20" /><p>No posts yet</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Saved tab */}
        <TabsContent value="saved" className="m-0 border-none outline-none">
          <div className="flex flex-col divide-y divide-border/20">
            {savedLoading ? (
              <div className="p-5 text-center text-muted-foreground">Loading saved places...</div>
            ) : savedPlaces && savedPlaces.length > 0 ? (
              savedPlaces.map((s) => <PostCard key={s.id} post={s.post} />)
            ) : (
              <div className="py-12 text-center text-muted-foreground flex flex-col items-center gap-2">
                <Bookmark className="w-10 h-10 mb-1 opacity-20" />
                <p className="font-medium">No saved places yet</p>
                <p className="text-sm">Tap the bookmark icon on any post to save it here.</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Impact tab */}
        <TabsContent value="stats" className="m-0 border-none outline-none">
          <div className="p-5 flex flex-col gap-5">
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <BarChart className="w-5 h-5 text-primary" />My Local Impact
              </h3>
              {statsLoading ? (
                <Skeleton className="w-full h-24" />
              ) : stats ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted p-4 rounded-xl flex flex-col">
                    <span className="text-muted-foreground text-sm font-medium">Total Bookings</span>
                    <span className="text-2xl font-black">{stats.totalBookings}</span>
                  </div>
                  <div className="bg-muted p-4 rounded-xl flex flex-col">
                    <span className="text-muted-foreground text-sm font-medium">Upcoming</span>
                    <span className="text-2xl font-black text-primary">{stats.upcomingBookings}</span>
                  </div>
                </div>
              ) : null}
            </div>
            <PaymentMethodsSection />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
