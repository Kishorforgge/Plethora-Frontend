import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { MasonryFeed } from "@/components/masonry-feed";
import { CATEGORIES } from "@/lib/mock-data";
import { requireAuth } from "@/lib/require-auth";
import { useState } from "react";
import { Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { postsApi } from "@/lib/api";
import { mapApiPostToDisplay } from "@/lib/post-utils";

export const Route = createFileRoute("/explore")({
  beforeLoad: requireAuth,
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
  const [selectedTag, setSelectedTag] = useState("All");

  const { data: apiPosts = [], isLoading } = useQuery({
    queryKey: ["explore-posts", q, selectedTag],
    queryFn: () =>
      postsApi.list({
        limit: 50,
        q: q.trim() || undefined,
        category: selectedTag !== "All" ? selectedTag : undefined,
      }),
  });

  const displayPosts = apiPosts.map(mapApiPostToDisplay);

  const selectedCategory = selectedTag;
  const filteredPosts =
    selectedCategory === "All"
      ? displayPosts
      : displayPosts.filter((post) => {
          const category = post.category?.trim().toLowerCase();
          return (
            category &&
            category === selectedCategory.toLowerCase()
          );
        });

  const posts = filteredPosts;
  console.log("POST SAMPLE", posts.slice(0,5));
  console.log("Selected Category", selectedCategory);
  console.log("Rendered Posts Count", posts.length);
  console.log(
    posts.map((p) => ({
      title: p.title,
      category: p.category,
    }))
  );

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
            <span
              key={c}
              onClick={() => setSelectedTag(c)}
              className={`px-4 h-8 inline-flex items-center rounded-full border text-xs transition-all cursor-pointer ${
                (c === "All" && selectedTag === "All") || c.toLowerCase() === selectedTag.toLowerCase()
                  ? "bg-foreground text-background border-foreground font-medium"
                  : "bg-surface border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
              }`}
            >
              {c}
            </span>
          ))}
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground font-mono uppercase tracking-widest">
            Loading archive…
          </p>
        ) : filteredPosts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No matching visual frames found.</p>
        ) : (
          <MasonryFeed posts={filteredPosts} />
        )}
      </div>
    </AppShell>
  );
}
