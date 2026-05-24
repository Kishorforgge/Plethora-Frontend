import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { MasonryFeed } from "@/components/masonry-feed";
import { ME, POSTS } from "@/lib/mock-data";
import { useState } from "react";
import { Settings, Grid3x3, Bookmark } from "lucide-react";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: `${ME.name} — Plethora`.toString() },
      { name: "description", content: "Your Plethora profile, posts, and saved collections." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const [tab, set_tab] = useState<"posts" | "saved">("posts");
  return (
    <AppShell>
      <div className="max-w-[1440px] mx-auto px-4 lg:px-8 pt-8 lg:pt-12">
        {/* Header */}
        <header className="bg-surface rounded-[2rem] p-8 lg:p-12 border border-border mb-10 animate-fade-up">
          <div className="flex flex-col md:flex-row md:items-end gap-8">
            <img src={ME.avatar} alt={ME.name} className="size-28 lg:size-36 rounded-full object-cover ring-4 ring-background shadow-[var(--shadow-soft)]" />
            <div className="flex-1">
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-2">@{ME.username}</p>
              <h1 className="text-3xl lg:text-4xl font-semibold tracking-tight mb-2">{ME.name}</h1>
              <p className="text-sm text-muted-foreground max-w-md mb-5">{ME.bio}</p>
              <div className="flex items-center gap-8 text-sm">
                <Stat label="Posts" value={ME.posts} />
                <Stat label="Followers" value={ME.followers} />
                <Stat label="Following" value={ME.following} />
              </div>
            </div>
            <div className="flex gap-2">
              <button className="px-5 h-11 rounded-full bg-foreground text-background text-sm font-medium hover:scale-[1.02] transition-transform">Edit profile</button>
              <button aria-label="Settings" className="size-11 rounded-full border border-border grid place-items-center hover:bg-secondary transition-colors">
                <Settings className="size-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-8 border-b border-border">
          <TabBtn active={tab === "posts"} onClick={() => set_tab("posts")} icon={<Grid3x3 className="size-4" />} label="Posts" />
          <TabBtn active={tab === "saved"} onClick={() => set_tab("saved")} icon={<Bookmark className="size-4" />} label="Saved" />
        </div>

        <MasonryFeed posts={tab === "posts" ? POSTS.slice(0, 14) : POSTS.slice(8, 22)} />
      </div>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-lg font-semibold">{value.toLocaleString()}</p>
      <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">{label}</p>
    </div>
  );
}

function TabBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`px-5 h-11 inline-flex items-center gap-2 text-sm font-medium relative transition-colors ${
        active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {icon} {label}
      {active && <span className="absolute -bottom-px left-0 right-0 h-px bg-foreground" />}
    </button>
  );
}
