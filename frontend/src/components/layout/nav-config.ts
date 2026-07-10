import {
  BarChart3,
  BookMarked,
  BookOpen,
  LayoutDashboard,
  LibraryBig,
  Scan,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import type { AppRole } from "@/stores/auth-store";

export interface NavItem {
  label: string;
  to: string;
  icon: typeof LayoutDashboard;
  roles?: AppRole[];
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Bosh sahifa", to: "/", icon: LayoutDashboard },
  { label: "Katalog (OPAC)", to: "/catalog", icon: LibraryBig },
  {
    label: "Kitoblar",
    to: "/books",
    icon: BookOpen,
    roles: ["director", "administrator", "librarian", "operator"],
  },
  {
    label: "Kitobxonlar",
    to: "/readers",
    icon: Users,
    roles: ["director", "administrator", "librarian", "operator"],
  },
  {
    label: "Kitob aylanishi",
    to: "/circulation",
    icon: BookMarked,
    roles: ["director", "administrator", "librarian", "operator"],
  },
  { label: "Elektron kutubxona", to: "/electronic-library", icon: LibraryBig },
  {
    label: "Hisobotlar",
    to: "/reports",
    icon: BarChart3,
    roles: ["director", "administrator", "librarian"],
  },
  {
    label: "Inventarizatsiya",
    to: "/inventory",
    icon: Scan,
    roles: ["director", "administrator", "librarian"],
  },
  {
    label: "Admin panel",
    to: "/admin",
    icon: ShieldCheck,
    roles: ["director", "administrator"],
  },
  {
    label: "Sozlamalar",
    to: "/settings",
    icon: Settings,
    roles: ["director", "administrator"],
  },
];
