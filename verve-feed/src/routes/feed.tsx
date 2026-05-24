import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { MasonryFeed } from "@/components/masonry-feed";
import { POSTS, CATEGORIES, CREATORS } from "@/lib/mock-data";
import { Search, Sparkles } from "lucide-react";

export const Route = createFileRoute("/feed")({
  head: () => ({
    meta: [
      { title: "Home Feed — Plethora" },
      { name: "description", content: "Your personalized masonry feed of curated imagery from creators you follow." },
    ],
  }),
  component: FeedPage,
});

function FeedPage() {
  const [q, set_q] = useState("");
  const [cat, set_cat] = useState("All");

  const filtered = POSTS.filter((p) => {
    const matchQ = !q || p.title.toLowerCase().includes(q.toLowerCase()) || p.tags.some((t) => t.includes(q.toLowerCase()));
    const matchCat = cat === "All" || p.tags.some((t) => t.toLowerCase() === cat.toLowerCase()) || p.title.toLowerCase().includes(cat.toLowerCase());
    return matchQ && matchCat;
  });

  return (
    <AppShell>
      <div className="max-w-[1440px] mx-auto px-4 lg:px-8 pt-8 lg:pt-12">
        {/* Search bar */}
        <div className="relative max-w-2xl mx-auto mb-10 animate-fade-up">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => set_q(e.target.value)}
            placeholder="Search by title, tag, or mood…"
            className="w-full h-14 pl-12 pr-5 rounded-full bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-ring transition-all text-sm"
          />
        </div>

        {/* Categories */}
        <div className="flex items-center gap-2 mb-10 overflow-x-auto pb-2 no-scrollbar animate-fade-up [animation-delay:100ms]">
          {CATEGORIES.map((c) => {
            const active = c === cat;
            return (
              <button
                key={c}
                onClick={() => set_cat(c)}
                className={`px-5 h-9 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  active
                    ? "bg-foreground text-background"
                    : "bg-surface border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                }`}
              >
                {c}
              </button>
            );
          })}
        </div>

        {/* Trending strip */}
        <section className="mb-12 animate-fade-up [animation-delay:200ms]">
          <div className="flex items-end justify-between mb-5">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-muted-foreground" />
              <h2 className="text-sm font-mono uppercase tracking-widest text-muted-foreground">Recommended creators</h2>
            </div>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
            {CREATORS.map((c) => (
              <div key={c.id} className="shrink-0 w-44 bg-surface rounded-2xl p-4 border border-border hover:-translate-y-1 hover:shadow-[var(--shadow-soft)] transition-all">
                <img src={c.avatar} alt={c.name} className="size-12 rounded-full object-cover mb-3" />
                <p className="text-sm font-medium truncate">{c.name}</p>
                <p className="text-[11px] text-muted-foreground truncate mb-3">@{c.username}</p>
                <button className="w-full h-8 rounded-full bg-foreground text-background text-xs font-medium">Follow</button>
              </div>
            ))}
          </div>
        </section>

        {/* Feed */}
        <MasonryFeed posts={filtered.length ? filtered : POSTS} />
      </div>
    </AppShell>
  );
}
