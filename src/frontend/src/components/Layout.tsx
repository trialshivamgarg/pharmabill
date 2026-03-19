import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "@tanstack/react-router";
import {
  ArrowLeftRight,
  BarChart3,
  Bell,
  ChevronRight,
  ClipboardList,
  FileText,
  History,
  LayoutDashboard,
  LogOut,
  Package,
  Pill,
  RotateCcw,
  ShoppingCart,
  Truck,
  Users,
} from "lucide-react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

const NAV_LINKS = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/inventory", label: "Inventory", icon: Package },
  { to: "/customers", label: "Customers", icon: Users },
  { to: "/new-bill", label: "New Bill", icon: FileText },
  { to: "/history", label: "Bill History", icon: History },
  { to: "/sales-return", label: "Sales Return", icon: RotateCcw },
  { to: "/purchase-return", label: "Purchase Return", icon: ArrowLeftRight },
  { to: "/distributors", label: "Distributors", icon: Truck },
  { to: "/purchase-entry", label: "Purchase Entry", icon: ShoppingCart },
  { to: "/purchase-history", label: "Purchase History", icon: ClipboardList },
  { to: "/reports", label: "Reports", icon: BarChart3 },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { clear, identity } = useInternetIdentity();
  const location = useLocation();
  const principal = identity?.getPrincipal().toString();
  const initials = principal ? principal.slice(0, 2).toUpperCase() : "PH";

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <header
        className="flex items-center justify-between px-6 h-14 flex-shrink-0 z-50"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.28 0.065 240), oklch(0.22 0.055 240))",
        }}
      >
        <div className="flex items-center gap-2">
          <div className="bg-white/20 rounded p-1">
            <Pill className="h-5 w-5 text-white" />
          </div>
          <span className="text-white font-bold text-lg tracking-tight">
            PharmaBill
          </span>
        </div>

        <nav
          className="hidden lg:flex items-center gap-0.5 overflow-x-auto max-w-3xl"
          data-ocid="nav.section"
        >
          {NAV_LINKS.map((link) => {
            const active = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`px-2 py-1.5 rounded text-[11px] font-medium transition-colors whitespace-nowrap ${
                  active
                    ? "bg-white/20 text-white"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
                data-ocid={`nav.${link.label.toLowerCase().replace(/ /g, "_")}.link`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="text-white/70 hover:text-white p-1.5 rounded hover:bg-white/10 transition-colors"
          >
            <Bell className="h-4 w-4" />
          </button>
          <Avatar className="h-7 w-7">
            <AvatarFallback className="text-xs bg-white/20 text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
          <Button
            variant="ghost"
            size="sm"
            onClick={clear}
            className="text-white/70 hover:text-white hover:bg-white/10 h-7 px-2"
            data-ocid="nav.logout.button"
          >
            <LogOut className="h-3.5 w-3.5" />
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-56 flex-shrink-0 bg-white border-r border-border flex flex-col overflow-y-auto">
          <nav
            className="flex flex-col py-3 gap-0.5 px-2"
            data-ocid="sidebar.section"
          >
            {NAV_LINKS.map((link) => {
              const active = location.pathname === link.to;
              const Icon = link.icon;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-3 px-3 py-2 rounded text-[13px] font-medium transition-colors group ${
                    active
                      ? "bg-accent text-foreground border-l-2 border-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                  data-ocid={`sidebar.${link.label.toLowerCase().replace(/ /g, "_")}.link`}
                >
                  <Icon
                    className={`h-4 w-4 flex-shrink-0 ${active ? "text-primary" : ""}`}
                  />
                  <span>{link.label}</span>
                  {active && (
                    <ChevronRight className="h-3 w-3 ml-auto text-primary" />
                  )}
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto p-3 border-t border-border">
            <p className="text-[10px] text-muted-foreground text-center">
              PharmaBill v1.0
            </p>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto bg-background p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
