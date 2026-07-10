import { DashboardPage } from "@/modules/dashboard/components/dashboard-page";
import { ReaderHomePage } from "@/modules/dashboard/components/reader-home-page";
import { useAuthStore } from "@/stores/auth-store";

const STAFF_DASHBOARD_ROLES = new Set(["director", "administrator", "librarian", "operator"]);

/** Routes "/" to the staff analytics dashboard or the reader's personal library view, by role. */
export function HomePage() {
  const role = useAuthStore((s) => s.role);
  return role && STAFF_DASHBOARD_ROLES.has(role) ? <DashboardPage /> : <ReaderHomePage />;
}
