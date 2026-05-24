import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { MasonryFeed } from "@/components/masonry-feed";
import { POSTS, CATEGORIES } from "@/lib/mock-data";
import { useState } from "react";
import { Search } from "lucide-react";

export const Route = createFileRoute("/explore")({
  head: () => ({
    meta: [
      { title: "Explore — Plethora" },
      { name: "description", content: "Browse curated imagery across categories — architecture, nature, minimalism, and more." },
    ],
  }),
  component: ExplorePage,
});

function ExplorePage() {
  const [q, set_q] = useState("");
  return (
    <AppShell>
      <div className="max-w-[1440px] mx-auto px-4 lg:px-8 pt-8 lg:pt-12">
        <header className="mb-12 animate-fade-up">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-3">Explore</p>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tighter mb-6">A library of intentional imagery.</h1>
          <div className="relative max-w-xl">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => set_q(e.target.value)}
              placeholder="Search the archive…"
              className="w-full h-14 pl-12 pr-5 rounded-full bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-ring text-sm"
            />
          </div>
        </header>

        <div className="flex flex-wrap gap-2 mb-10">
          {CATEGORIES.map((c) => (
            <span key={c} className="px-4 h-8 inline-flex items-center rounded-full bg-surface border border-border text-xs text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all cursor-pointer">
              {c}
            </span>
          ))}
        </div>

        <MasonryFeed posts={POSTS} />
      </div>
    </AppShell>
  );
}
