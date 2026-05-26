import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/components/auth-provider";
import { userApi } from "@/lib/api";
import { requireAuth } from "@/lib/require-auth";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, LogOut, User, Grid3x3, Bookmark, Heart, MessageCircle } from "lucide-react";

export const Route = createFileRoute("/settings")({
  beforeLoad: requireAuth,
  head: () => ({
    meta: [{ title: "Settings — Plethora" }],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || "");
      setBio(user.bio || "");
    }
  }, [user]);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await userApi.updateProfile({ fullName, bio });
      await refreshUser();
      toast.success("Profile updated");
      navigate({ to: "/profile" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const onAvatarChange = async (file: File) => {
    try {
      await userApi.updateProfilePicture(file);
      await refreshUser();
      toast.success("Profile picture updated");
      navigate({ to: "/profile" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    }
  };

  const handleLogout = async () => {
    await logout();
    toast.success("Signed out");
    navigate({ to: "/login" });
  };

  if (!user) return null;

  return (
    <AppShell>
      <div className="max-w-xl mx-auto px-4 lg:px-8 pt-8 lg:pt-12 pb-16">
        <Link
          to="/profile"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8"
        >
          <ArrowLeft className="size-4" /> Back to profile
        </Link>

        <header className="mb-10 animate-fade-up">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-3">
            Account
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">Edit your details</h1>
        </header>

        <div className="flex items-center gap-5 mb-10">
          <img
            src={user.profilePicture}
            alt={user.fullName}
            className="size-20 rounded-full object-cover ring-4 ring-border"
          />
          <div>
            <p className="text-sm font-medium">@{user.username}</p>
            <p className="text-xs text-muted-foreground mb-3">{user.email}</p>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="text-sm underline underline-offset-4"
            >
              Change photo
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && onAvatarChange(e.target.files[0])}
            />
          </div>
        </div>

        {/* Account info (read-only) */}
        <section className="mb-8 p-5 rounded-[1.5rem] border border-border bg-surface">
          <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground mb-4">
            Account info
          </p>
          <div className="grid gap-3 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Username</span>
              <span className="font-medium">@{user.username}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium truncate">{user.email}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Followers</span>
              <span className="font-medium">{user.followersCount}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Following</span>
              <span className="font-medium">{user.followingCount}</span>
            </div>
          </div>
        </section>

        {/* Quick links */}
        <section className="mb-8">
          <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground mb-3">
            Your collections
          </p>
          <div className="grid gap-2">
            <QuickLink to="/profile" icon={<User className="size-4" />} label="View profile" />
            <QuickLink to="/profile" icon={<Grid3x3 className="size-4" />} label="My uploads" />
            <QuickLink to="/profile" icon={<Bookmark className="size-4" />} label="Saved posts" />
            <QuickLink to="/profile" icon={<Heart className="size-4" />} label="Liked posts" />
            <QuickLink to="/discussions" icon={<MessageCircle className="size-4" />} label="Discussions" />
          </div>
        </section>

        <form onSubmit={saveProfile} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
              Display name
            </span>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="h-12 px-4 rounded-2xl border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
              Bio
            </span>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              maxLength={500}
              placeholder="Tell others about your visual work…"
              className="px-4 py-3 rounded-2xl border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
            <span className="text-[10px] text-muted-foreground text-right">{bio.length}/500</span>
          </label>
          <button
            type="submit"
            disabled={saving}
            className="mt-2 h-12 rounded-full bg-foreground text-background text-sm font-medium disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </form>

        <button
          type="button"
          onClick={handleLogout}
          className="mt-12 w-full h-12 rounded-full border border-border text-sm font-medium flex items-center justify-center gap-2 hover:bg-secondary transition-colors"
        >
          <LogOut className="size-4" /> Sign out
        </button>
      </div>
    </AppShell>
  );
}

function QuickLink({
  to,
  icon,
  label,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 px-4 h-11 rounded-2xl border border-border bg-surface hover:bg-secondary text-sm transition-colors"
    >
      {icon}
      {label}
    </Link>
  );
}
