import { lazy, Suspense, type ReactNode } from "react";
import { createBrowserRouter } from "react-router";
import { AppShell } from "@/components/layout/app-shell";
import { OpacLayout } from "@/components/layout/opac-layout";
import { PageLoader } from "@/components/shared/page-loader";
import { ProtectedRoute } from "@/app/router/protected-route";

const LoginPage = lazy(() => import("@/modules/auth/components/login-page").then((m) => ({ default: m.LoginPage })));
const ForbiddenPage = lazy(() =>
  import("@/modules/auth/components/forbidden-page").then((m) => ({ default: m.ForbiddenPage }))
);
const NotFoundPage = lazy(() =>
  import("@/modules/auth/components/not-found-page").then((m) => ({ default: m.NotFoundPage }))
);
const BookDetailPage = lazy(() =>
  import("@/modules/catalog/components/book-detail-page").then((m) => ({ default: m.BookDetailPage }))
);
const CatalogSearchPage = lazy(() =>
  import("@/modules/catalog/components/catalog-search-page").then((m) => ({ default: m.CatalogSearchPage }))
);
const DashboardPage = lazy(() =>
  import("@/modules/dashboard/components/dashboard-page").then((m) => ({ default: m.DashboardPage }))
);
const BookCreatePage = lazy(() =>
  import("@/modules/books/components/book-create-page").then((m) => ({ default: m.BookCreatePage }))
);
const BookEditPage = lazy(() =>
  import("@/modules/books/components/book-edit-page").then((m) => ({ default: m.BookEditPage }))
);
const BooksListPage = lazy(() =>
  import("@/modules/books/components/books-list-page").then((m) => ({ default: m.BooksListPage }))
);
const ReaderDetailPage = lazy(() =>
  import("@/modules/readers/components/reader-detail-page").then((m) => ({ default: m.ReaderDetailPage }))
);
const ReadersListPage = lazy(() =>
  import("@/modules/readers/components/readers-list-page").then((m) => ({ default: m.ReadersListPage }))
);
const CirculationPage = lazy(() =>
  import("@/modules/circulation/components/circulation-page").then((m) => ({ default: m.CirculationPage }))
);
const ElectronicLibraryViewerPage = lazy(() =>
  import("@/modules/electronic-library/components/electronic-library-viewer-page").then((m) => ({
    default: m.ElectronicLibraryViewerPage,
  }))
);
const ReportsPage = lazy(() =>
  import("@/modules/reports/components/reports-page").then((m) => ({ default: m.ReportsPage }))
);
const InventoryPage = lazy(() =>
  import("@/modules/inventory/components/inventory-page").then((m) => ({ default: m.InventoryPage }))
);
const AdminPage = lazy(() =>
  import("@/modules/admin/components/admin-page").then((m) => ({ default: m.AdminPage }))
);
const SettingsPage = lazy(() =>
  import("@/modules/settings/components/settings-page").then((m) => ({ default: m.SettingsPage }))
);

function withSuspense(element: ReactNode) {
  return <Suspense fallback={<PageLoader />}>{element}</Suspense>;
}

export const router = createBrowserRouter([
  { path: "/login", element: withSuspense(<LoginPage />) },
  { path: "/403", element: withSuspense(<ForbiddenPage />) },
  // Public OPAC — browsable without a session, matching real library catalogs.
  {
    path: "/catalog",
    element: <OpacLayout />,
    children: [
      { index: true, element: withSuspense(<CatalogSearchPage detailBasePath="/catalog" />) },
      { path: ":id", element: withSuspense(<BookDetailPage loginPath="/login" />) },
    ],
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: withSuspense(<DashboardPage />) },
      {
        path: "books",
        children: [
          { index: true, element: withSuspense(<BooksListPage />) },
          { path: "new", element: withSuspense(<BookCreatePage />) },
          { path: ":id/edit", element: withSuspense(<BookEditPage />) },
        ],
      },
      {
        path: "readers",
        children: [
          { index: true, element: withSuspense(<ReadersListPage />) },
          { path: ":id", element: withSuspense(<ReaderDetailPage />) },
        ],
      },
      { path: "circulation", element: withSuspense(<CirculationPage />) },
      {
        path: "electronic-library",
        children: [
          { index: true, element: withSuspense(<CatalogSearchPage detailBasePath="/electronic-library" />) },
          { path: ":bookId", element: withSuspense(<ElectronicLibraryViewerPage />) },
        ],
      },
      { path: "reports", element: withSuspense(<ReportsPage />) },
      { path: "inventory", element: withSuspense(<InventoryPage />) },
      { path: "admin", element: withSuspense(<AdminPage />) },
      { path: "settings", element: withSuspense(<SettingsPage />) },
    ],
  },
  { path: "*", element: withSuspense(<NotFoundPage />) },
]);
