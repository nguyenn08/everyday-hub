import { useState, useMemo } from "react";
import { format, parseISO, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, addMonths, subMonths } from "date-fns";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, MapPin, Clock } from "lucide-react";
import { useGetCalendarEvents } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  
  // Get events for the current month
  const { data: events, isLoading } = useGetCalendarEvents({
    from: monthStart.toISOString(),
    to: monthEnd.toISOString()
  });

  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Group events by day for badges
  const eventsByDay = useMemo(() => {
    const map = new Map<string, typeof events>();
    if (!events) return map;
    
    events.forEach(event => {
      const dateStr = format(parseISO(event.date), 'yyyy-MM-dd');
      const existing = map.get(dateStr) || [];
      existing.push(event);
      map.set(dateStr, existing);
    });
    return map;
  }, [events]);

  const selectedDateEvents = eventsByDay.get(format(selectedDate, 'yyyy-MM-dd')) || [];

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="flex flex-col min-h-full h-[100dvh] bg-background">
      <header className="flex-none bg-background pt-6 pb-2 px-5">
        <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2 mb-4">
          <CalendarIcon className="w-6 h-6 text-primary" />
          Calendar
        </h1>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground capitalize">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="h-8 w-8 rounded-full border-border/50" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8 rounded-full border-border/50" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Custom Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {weekDays.map(day => (
            <div key={day} className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider py-1">
              {day}
            </div>
          ))}
          
          {/* Empty cells for offset */}
          {Array.from({ length: monthStart.getDay() }).map((_, i) => (
            <div key={`empty-${i}`} className="p-2" />
          ))}

          {/* Days */}
          {days.map(day => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const dayEvents = eventsByDay.get(dateStr);
            const isSelected = isSameDay(day, selectedDate);
            const isToday = isSameDay(day, new Date());

            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDate(day)}
                className={cn(
                  "relative flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 h-14 w-full",
                  isSelected ? "bg-primary text-primary-foreground font-bold shadow-md shadow-primary/20" : "hover:bg-muted font-medium text-foreground",
                  isToday && !isSelected && "ring-2 ring-primary ring-inset text-primary"
                )}
              >
                <span className="text-sm">{format(day, 'd')}</span>
                
                {/* Event Indicators */}
                {dayEvents && dayEvents.length > 0 && (
                  <div className="flex gap-0.5 mt-1 absolute bottom-2">
                    {dayEvents.slice(0, 3).map((e, i) => (
                      <div 
                        key={i} 
                        className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          isSelected ? "bg-primary-foreground/80" : "bg-primary"
                        )}
                      />
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* Selected Date Events - Flex 1 allows it to take remaining space */}
      <div className="flex-1 bg-muted/20 border-t border-border/50 rounded-t-3xl overflow-hidden flex flex-col relative">
        <div className="p-5 flex items-center justify-between sticky top-0 bg-muted/20 backdrop-blur-md z-10">
          <h3 className="font-bold text-lg">
            {isSameDay(selectedDate, new Date()) ? 'Today' : format(selectedDate, 'EEEE, MMM d')}
          </h3>
          <Badge variant="secondary" className="bg-background text-muted-foreground border border-border/50">
            {selectedDateEvents.length} Events
          </Badge>
        </div>

        <ScrollArea className="flex-1 px-5 pb-5">
          <div className="flex flex-col gap-3 pb-20">
            {isLoading ? (
              <div className="text-center py-10 text-muted-foreground">Loading calendar...</div>
            ) : selectedDateEvents.length > 0 ? (
              selectedDateEvents.map((event, idx) => (
                <div 
                  key={event.id}
                  className="bg-card border border-border/60 rounded-2xl p-4 shadow-sm animate-in slide-in-from-right-4 fade-in duration-300 fill-mode-both"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-foreground leading-tight pr-4">{event.title}</h4>
                    {event.price != null && (
                      <span className="text-sm font-semibold text-primary whitespace-nowrap bg-primary/10 px-2 py-0.5 rounded-md">
                        {event.price > 0 ? `$${event.price}` : 'Free'}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-1.5 mt-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4 text-muted-foreground/70" />
                      <span>{format(parseISO(event.date), 'h:mm a')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4 text-muted-foreground/70" />
                      <span>{event.location}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
                    <Badge variant="outline" className="capitalize text-xs">
                      {event.category || event.type}
                    </Badge>
                    {event.bookingId && (
                      <Badge variant="secondary" className="bg-accent/20 text-accent-foreground border-accent/20">
                        Booked
                      </Badge>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 flex flex-col items-center justify-center text-muted-foreground">
                <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                  <CalendarIcon className="w-5 h-5 text-muted-foreground/50" />
                </div>
                <p className="font-medium text-foreground">No events this day</p>
                <p className="text-sm mt-1">Tap another date to see what's happening.</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
