import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { MasonryFeed } from "@/components/masonry-feed";
import { CreatorCard } from "@/components/creator-card";
import { postsApi } from "@/lib/api";
import { mapApiPostToDisplay } from "@/lib/post-utils";
import { requireAuth } from "@/lib/require-auth";
import { useQuery } from "@tanstack/react-query";
import { Search, Sparkles, Users } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { userApi } from "@/lib/api";

export const Route = createFileRoute("/feed")({
  beforeLoad: requireAuth,
  head: () => ({
    meta: [
      { title: "Home Feed — Plethora" },
      {
        name: "description",
        content: "Posts from creators you follow, plus recommendations.",
      },
    ],
  }),
  component: FeedPage,
});

type FeedTab = "following" | "discover";

function FeedPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<FeedTab>("following");
  const [q, set_q] = useState("");

  const { data: suggested = [] } = useQuery({
    queryKey: ["suggested-creators"],
    queryFn: userApi.suggested,
  });

  const { data: followingPosts = [], isLoading: loadingFollowing } = useQuery({
    queryKey: ["following-feed"],
    queryFn: () => postsApi.following({ limit: 40 }),
    enabled: tab === "following",
  });

  const { data: discoverPosts = [], isLoading: loadingDiscover } = useQuery({
    queryKey: ["discover-feed", q],
    queryFn: () => postsApi.list({ limit: 40 }),
    enabled: tab === "discover",
  });

  const rawPosts = tab === "following" ? followingPosts : discoverPosts;
  const posts = rawPosts.map(mapApiPostToDisplay).filter((p) => {
    if (!q.trim()) return true;
    const lower = q.toLowerCase();
    return (
      p.title.toLowerCase().includes(lower) ||
      p.tags.some((t) => t.includes(lower)) ||
      p.creator.username.toLowerCase().includes(lower)
    );
  });

  const loading = tab === "following" ? loadingFollowing : loadingDiscover;

  return (
    <AppShell>
      <div className="max-w-[1440px] mx-auto px-4 lg:px-8 pt-8 lg:pt-12">
        <div className="relative max-w-2xl mx-auto mb-8 animate-fade-up">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => set_q(e.target.value)}
            placeholder="Search by title, tag, or creator…"
            className="w-full h-14 pl-12 pr-5 rounded-full bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-ring transition-all text-sm"
          />
        </div>

        <div className="flex items-center gap-2 mb-8 border-b border-border">
          <TabBtn active={tab === "following"} onClick={() => setTab("following")} label="Following" />
          <TabBtn active={tab === "discover"} onClick={() => setTab("discover")} label="Discover" />
        </div>

        {tab === "following" && user && user.followingCount === 0 && (
          <div className="mb-10 p-6 rounded-[1.5rem] border border-border bg-surface text-center animate-fade-up">
            <Users className="size-8 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm font-medium mb-1">Your following feed is empty</p>
            <p className="text-xs text-muted-foreground mb-4">
              Follow creators below to see their new posts here — you&apos;ll get notified when they
              share work.
            </p>
            <button
              type="button"
              onClick={() => setTab("discover")}
              className="px-5 h-9 rounded-full bg-foreground text-background text-xs font-medium"
            >
              Browse discover
            </button>
          </div>
        )}

        <section className="mb-12 animate-fade-up">
          <div className="flex items-center gap-2 mb-5">
            <Sparkles className="size-4 text-muted-foreground" />
            <h2 className="text-sm font-mono uppercase tracking-widest text-muted-foreground">
              Suggested creators
            </h2>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
            {suggested.length === 0 ? (
              <p className="text-sm text-muted-foreground px-2">No creators to suggest yet.</p>
            ) : (
              suggested.map((c) => <CreatorCard key={c._id} creator={c} />)
            )}
          </div>
        </section>

        {loading ? (
          <p className="text-sm text-muted-foreground font-mono uppercase tracking-widest">Loading feed…</p>
        ) : posts.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {tab === "following"
              ? "No posts from people you follow yet. When they upload, you'll see them here."
              : "No posts to show."}
          </p>
        ) : (
          <MasonryFeed posts={posts} />
        )}
      </div>
    </AppShell>
  );
}

function TabBtn({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-5 h-11 text-sm font-medium relative transition-colors ${
        active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
      {active && <span className="absolute -bottom-px left-0 right-0 h-px bg-foreground" />}
    </button>
  );
}
