import { Link, useLocation } from "wouter";
import { Calendar, Ticket, User, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { CreatePostSheet } from "./CreatePostSheet";
import { useListBookings } from "@workspace/api-client-react";

function EHPinIcon({ className, active }: { className?: string; active?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M12 2C7.58 2 4 5.58 4 10c0 6.25 8 16 8 16s8-9.75 8-16c0-4.42-3.58-8-8-8z"
        stroke="currentColor"
        strokeWidth={active ? 2.2 : 1.75}
        fill={active ? "currentColor" : "none"}
        fillOpacity={active ? 0.18 : 0}
      />
      <text
        x="12"
        y="11.2"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="6"
        fontWeight="800"
        fontFamily="Inter, sans-serif"
        fill="currentColor"
        letterSpacing="-0.2"
      >
        EH
      </text>
    </svg>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { data: bookings } = useListBookings();
  const upcomingCount = bookings?.filter((b) => b.status === "confirmed").length ?? 0;

  const iconCls = (active: boolean) =>
    cn("relative flex items-center justify-center p-1.5 rounded-full transition-all duration-300", active && "bg-primary/10");

  const linkCls = (active: boolean) =>
    cn(
      "flex flex-col items-center justify-center w-full h-full gap-1 transition-all duration-300",
      active ? "text-primary" : "text-muted-foreground hover:text-foreground"
    );

  const isDiscover = location === "/";
  const isCalendar = location === "/calendar";
  const isBookings = location === "/bookings";
  const isProfile = location === "/profile";

  return (
    <div className="flex flex-col h-[100dvh] bg-background w-full max-w-md mx-auto relative overflow-hidden shadow-2xl">
      <main className="flex-1 overflow-y-auto no-scrollbar relative">
        {children}
      </main>

      <CreatePostSheet>
        <button className="absolute bottom-[72px] right-4 w-14 h-14 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:scale-105 active:scale-95 transition-all z-40 border-2 border-background/50">
          <Plus className="w-6 h-6" strokeWidth={3} />
        </button>
      </CreatePostSheet>

      <nav className="flex-shrink-0 bg-background/90 backdrop-blur-xl border-t border-border px-6 pb-safe pt-2 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <div className="flex justify-between items-center h-14">

          {/* Discover */}
          <Link href="/" className={linkCls(isDiscover)}>
            <div className={iconCls(isDiscover)}>
              <EHPinIcon className={cn("w-5 h-[23px] transition-transform", isDiscover && "scale-110")} active={isDiscover} />
            </div>
            <span className="text-[10px] font-medium tracking-tight">Discover</span>
          </Link>

          {/* Calendar */}
          <Link href="/calendar" className={linkCls(isCalendar)}>
            <div className={iconCls(isCalendar)}>
              <Calendar className={cn("w-5 h-5 transition-transform", isCalendar && "fill-primary/20 scale-110")} strokeWidth={isCalendar ? 2.5 : 2} />
            </div>
            <span className="text-[10px] font-medium tracking-tight">Calendar</span>
          </Link>

          {/* Bookings — with badge */}
          <Link href="/bookings" className={linkCls(isBookings)}>
            <div className={iconCls(isBookings)}>
              <Ticket className={cn("w-5 h-5 transition-transform", isBookings && "fill-primary/20 scale-110")} strokeWidth={isBookings ? 2.5 : 2} />
              {upcomingCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-primary text-primary-foreground text-[9px] font-black rounded-full flex items-center justify-center px-1 leading-none">
                  {upcomingCount > 9 ? "9+" : upcomingCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium tracking-tight">Bookings</span>
          </Link>

          {/* Profile */}
          <Link href="/profile" className={linkCls(isProfile)}>
            <div className={iconCls(isProfile)}>
              <User className={cn("w-5 h-5 transition-transform", isProfile && "fill-primary/20 scale-110")} strokeWidth={isProfile ? 2.5 : 2} />
            </div>
            <span className="text-[10px] font-medium tracking-tight">Profile</span>
          </Link>

        </div>
      </nav>
    </div>
  );
}
