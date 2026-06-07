import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Home, Calendar, Ticket, User, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { CreatePostSheet } from "./CreatePostSheet";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", icon: Home, label: "Discover" },
    { href: "/calendar", icon: Calendar, label: "Calendar" },
    { href: "/bookings", icon: Ticket, label: "Bookings" },
    { href: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <div className="flex flex-col h-[100dvh] bg-background w-full max-w-md mx-auto relative overflow-hidden shadow-2xl">
      <main className="flex-1 overflow-y-auto no-scrollbar relative">
        {children}
      </main>

      {/* FAB for Creating Post */}
      <CreatePostSheet>
        <button className="absolute bottom-[72px] right-4 w-14 h-14 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:scale-105 active:scale-95 transition-all z-40 border-2 border-background/50">
          <Plus className="w-6 h-6" strokeWidth={3} />
        </button>
      </CreatePostSheet>

      {/* Bottom Navigation */}
      <nav className="flex-shrink-0 bg-background/90 backdrop-blur-xl border-t border-border px-6 pb-safe pt-2 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <div className="flex justify-between items-center h-14">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center w-full h-full gap-1 transition-all duration-300",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <div className={cn(
                  "flex items-center justify-center p-1.5 rounded-full transition-all duration-300",
                  isActive && "bg-primary/10"
                )}>
                  <item.icon className={cn("w-5 h-5 transition-transform", isActive && "fill-primary/20 scale-110")} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className="text-[10px] font-medium tracking-tight">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
