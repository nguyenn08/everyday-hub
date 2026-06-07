import { format, parseISO } from "date-fns";
import { Ticket, Calendar, MapPin, X, ExternalLink } from "lucide-react";
import { useListBookings, useCancelBooking } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

export default function Bookings() {
  const queryClient = useQueryClient();
  const { data: bookings, isLoading } = useListBookings();
  const cancelBooking = useCancelBooking();

  const handleCancel = (id: number) => {
    cancelBooking.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
        toast({
          title: "Booking cancelled",
          description: "Your reservation has been successfully removed.",
        });
      },
      onError: () => {
        toast({
          title: "Cancellation failed",
          description: "Could not cancel booking. Please try again.",
          variant: "destructive",
        });
      }
    });
  };

  const upcomingBookings = bookings?.filter(b => b.status === "confirmed") || [];
  const pastBookings = bookings?.filter(b => b.status !== "confirmed") || [];

  return (
    <div className="flex flex-col min-h-full pb-6 bg-muted/10">
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-xl border-b border-border pt-6 pb-4 px-5">
        <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
          <Ticket className="w-6 h-6 text-primary" />
          My Bookings
        </h1>
      </header>

      <div className="p-5 flex flex-col gap-6">
        <section>
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Upcoming
          </h2>
          
          <div className="flex flex-col gap-4">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-card border border-border rounded-2xl p-4 flex gap-4 shadow-sm">
                  <Skeleton className="w-20 h-20 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-8 w-full mt-2" />
                  </div>
                </div>
              ))
            ) : upcomingBookings.length > 0 ? (
              upcomingBookings.map((booking, idx) => (
                <div 
                  key={booking.id} 
                  className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover-elevate transition-all duration-300 animate-in slide-in-from-bottom-4 fade-in fill-mode-both"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <div className="p-4 flex gap-4">
                    {/* Left: Date Block */}
                    <div className="flex flex-col items-center justify-center w-16 h-16 bg-primary/10 rounded-xl flex-shrink-0 border border-primary/20">
                      <span className="text-primary font-black text-sm uppercase leading-none">
                        {format(parseISO(booking.eventDate), 'MMM')}
                      </span>
                      <span className="text-primary font-black text-2xl leading-none mt-1">
                        {format(parseISO(booking.eventDate), 'dd')}
                      </span>
                    </div>

                    {/* Right: Details */}
                    <div className="flex flex-col flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-bold text-base leading-tight truncate">{booking.postTitle}</h3>
                        {booking.price != null && booking.price > 0 && (
                          <span className="font-semibold text-sm text-muted-foreground flex-shrink-0">
                            ${booking.price}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
                        <MapPin className="w-3.5 h-3.5" />
                        <span className="truncate">{booking.location}</span>
                      </div>

                      <div className="flex items-center justify-between mt-auto">
                        <Badge variant="outline" className="bg-muted text-muted-foreground capitalize text-[10px]">
                          {booking.category || "Event"}
                        </Badge>
                        
                        <div className="flex gap-2">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 px-3 text-destructive hover:text-destructive hover:bg-destructive/10 font-medium">
                                Cancel
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="max-w-[320px] rounded-2xl">
                              <AlertDialogHeader>
                                <AlertDialogTitle>Cancel booking?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to cancel your spot for {booking.postTitle}? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter className="flex-row gap-2 mt-4 sm:justify-between">
                                <AlertDialogCancel className="flex-1 mt-0">Keep it</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleCancel(booking.id)}
                                  className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Cancel Spot
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-card border border-dashed border-border rounded-2xl p-8 text-center flex flex-col items-center justify-center text-muted-foreground">
                <Ticket className="w-12 h-12 mb-3 text-muted" />
                <p className="font-medium text-foreground">No upcoming bookings</p>
                <p className="text-sm mt-1">Reserve a spot at an event and it will show up here.</p>
              </div>
            )}
          </div>
        </section>

        {pastBookings.length > 0 && (
          <section className="mt-4">
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">Past</h2>
            <div className="flex flex-col gap-3 opacity-60 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-300">
              {pastBookings.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-xl border border-border/50">
                  <div className="flex flex-col">
                    <span className="font-semibold text-sm truncate max-w-[200px]">{booking.postTitle}</span>
                    <span className="text-xs text-muted-foreground">{format(parseISO(booking.eventDate), 'MMM d, yyyy')}</span>
                  </div>
                  <Badge variant="secondary" className="text-[10px] capitalize">
                    {booking.status}
                  </Badge>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
