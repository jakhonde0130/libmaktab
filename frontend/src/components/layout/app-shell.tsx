import { LogOut } from "lucide-react";
import { NavLink, Outlet } from "react-router";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useMe } from "@/modules/auth/hooks/use-me";
import { useAuthStore } from "@/stores/auth-store";
import { NAV_ITEMS } from "@/components/layout/nav-config";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export function AppShell() {
  const { user, role } = useAuthStore();
  const { data: me, isLoading: isMeLoading } = useMe();
  const visibleItems = NAV_ITEMS.filter((item) => !item.roles || (role && item.roles.includes(role)));

  return (
    <div className="grid min-h-svh grid-cols-[16rem_1fr]">
      <aside className="flex flex-col border-r bg-sidebar text-sidebar-foreground">
        <div className="flex h-16 items-center gap-2 px-5">
          <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground font-semibold">
            L
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold">ILMS</p>
            <p className="text-xs text-muted-foreground">Library System</p>
          </div>
        </div>
        <Separator />
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {visibleItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )
              }
            >
              <item.icon className="size-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex flex-col">
        <header className="flex h-16 items-center justify-end gap-3 border-b px-6">
          <ThemeToggle />
          {isMeLoading ? (
            <Skeleton className="h-4 w-24" />
          ) : (
            <div className="text-right leading-tight">
              <p className="text-sm font-medium">{me?.full_name ?? user?.email}</p>
              <p className="text-xs capitalize text-muted-foreground">{me?.role ?? role}</p>
            </div>
          )}
          <Avatar className="size-8">
            {me?.photo_url ? <AvatarImage src={me.photo_url} alt={me.full_name} /> : null}
            <AvatarFallback>{(me?.full_name ?? user?.email)?.[0]?.toUpperCase() ?? "?"}</AvatarFallback>
          </Avatar>
          <Button variant="ghost" size="icon" aria-label="Sign out" onClick={() => supabase.auth.signOut()}>
            <LogOut className="size-4" />
          </Button>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
