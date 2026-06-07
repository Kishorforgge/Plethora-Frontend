import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Home, Compass, Plus, Bell, User, Moon, Sun, Search, MessageCircle, MessageSquare, LogOut } from "lucide-react";
import { useTheme } from "./theme-provider";
import { useAuth } from "./auth-provider";
import { notificationsApi } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { BrandLogo } from "./brand-logo";

const navItems = [
  { to: "/feed", label: "Home", icon: Home },
  { to: "/explore", label: "Explore", icon: Compass },
  { to: "/upload", label: "Upload", icon: Plus },
  { to: "/discussions", label: "Discussions", icon: MessageCircle },
  { to: "/messages", label: "Messages", icon: MessageSquare },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  const { user, logout } = useAuth();
  const avatar = user?.profilePicture;
  const displayName = user?.fullName || user?.username || "You";

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: notificationsApi.list,
    refetchInterval: 60000,
  });
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const isActive = (to: string) => path === to || path.startsWith(to + "/");

  const handleSignOut = async () => {
    await logout();
    toast.success("Signed out");
    navigate({ to: "/login" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Desktop Sidebar */}
      <aside className="fixed left-6 top-6 bottom-6 z-40 hidden lg:flex w-20 flex-col items-center justify-between py-6 glass-strong rounded-full shadow-[var(--shadow-glass)]">
        <BrandLogo to="/feed" size="md" />
        <nav className="flex flex-col gap-2">
          {navItems.map(({ to, label, icon: Icon }) => {
            const active = isActive(to);
            const showBadge = to === "/notifications" && unreadCount > 0;
            return (
              <Link
                key={to}
                to={to}
                aria-label={label}
                className={`relative size-11 rounded-full grid place-items-center transition-all duration-300 ${
                  active
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <Icon className="size-[18px]" strokeWidth={active ? 2.2 : 1.6} />
                {showBadge && (
                  <span className="absolute top-1 right-1 size-2 rounded-full bg-red-500 ring-2 ring-background" />
                )}
              </Link>
            );
          })}
        </nav>
        <div className="flex flex-col gap-2 items-center">
          <button
            onClick={toggle}
            aria-label="Toggle theme"
            className="size-11 rounded-full grid place-items-center text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            {theme === "dark" ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
          </button>
          <button
            onClick={handleSignOut}
            aria-label="Sign out"
            title="Sign out"
            className="size-11 rounded-full grid place-items-center text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <LogOut className="size-[18px]" />
          </button>
          <Link to="/profile" className="size-10 rounded-full overflow-hidden ring-2 ring-border">
            {avatar ? (
              <img src={avatar} alt={displayName} className="size-full object-cover" />
            ) : (
              <span className="size-full grid place-items-center bg-secondary text-xs font-mono">?</span>
            )}
          </Link>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="lg:hidden sticky top-0 z-40 glass-strong border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <BrandLogo to="/feed" size="sm" showWordmark />
          <div className="flex items-center gap-2">
            <Link to="/explore" aria-label="Search" className="size-9 rounded-full grid place-items-center hover:bg-secondary">
              <Search className="size-4" />
            </Link>
            <button
              onClick={handleSignOut}
              aria-label="Sign out"
              className="size-9 rounded-full grid place-items-center hover:bg-secondary text-muted-foreground"
            >
              <LogOut className="size-4" />
            </button>
            <button onClick={toggle} aria-label="Theme" className="size-9 rounded-full grid place-items-center hover:bg-secondary">
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="lg:pl-32 pb-28 lg:pb-12 min-h-screen">{children}</main>

      {/* Floating upload button */}
      <Link
        to="/upload"
        aria-label="Upload"
        className="hidden lg:flex fixed bottom-8 right-8 z-40 size-14 rounded-full bg-foreground text-background items-center justify-center shadow-[var(--shadow-lift)] hover:scale-105 active:scale-95 transition-transform"
      >
        <Plus className="size-5" />
      </Link>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-4 inset-x-4 z-40 glass-strong rounded-2xl shadow-[var(--shadow-lift)]">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map(({ to, label, icon: Icon }) => {
            const active = isActive(to);
            const isUpload = to === "/upload";
            if (isUpload) {
              return (
                <Link
                  key={to}
                  to={to}
                  aria-label={label}
                  className="size-12 -mt-6 rounded-full bg-foreground text-background grid place-items-center shadow-[var(--shadow-lift)]"
                >
                  <Plus className="size-5" />
                </Link>
              );
            }
            return (
              <Link
                key={to}
                to={to}
                aria-label={label}
                className={`size-11 rounded-full grid place-items-center transition-colors ${
                  active ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                <Icon className="size-5" strokeWidth={active ? 2.2 : 1.6} />
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
