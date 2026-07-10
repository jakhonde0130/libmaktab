import { LogIn } from "lucide-react";
import { Link, Outlet } from "react-router";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { useAuthStore } from "@/stores/auth-store";

/** Standalone public shell for the OPAC — no sidebar, browsable without a session. */
export function OpacLayout() {
  const session = useAuthStore((state) => state.session);

  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex h-16 items-center justify-between border-b px-6">
        <Link to="/catalog" className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground font-semibold">
            L
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold">ILMS</p>
            <p className="text-xs text-muted-foreground">Ochiq katalog</p>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant={session ? "default" : "outline"} asChild>
            <Link to={session ? "/" : "/login"}>
              <LogIn className="size-4" />
              {session ? "Boshqaruv paneli" : "Kirish"}
            </Link>
          </Button>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}
