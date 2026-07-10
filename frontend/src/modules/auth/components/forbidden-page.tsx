import { Link } from "react-router";
import { Button } from "@/components/ui/button";

export function ForbiddenPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-3 text-center">
      <h1 className="text-4xl font-semibold">403</h1>
      <p className="text-muted-foreground">You don't have permission to view this page.</p>
      <Button asChild>
        <Link to="/">Back to dashboard</Link>
      </Button>
    </div>
  );
}
