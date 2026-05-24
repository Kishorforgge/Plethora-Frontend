import { useEffect, useRef, useState } from "react";
import { PostCard } from "./post-card";
import type { Post } from "@/lib/mock-data";

interface Props { posts: Post[]; pageSize?: number }

export function MasonryFeed({ posts, pageSize = 12 }: Props) {
  const [count, count_set] = useState(Math.min(pageSize, posts.length));
  const sentinel = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!sentinel.current) return;
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        count_set((c) => Math.min(c + pageSize, posts.length * 3));
      }
    }, { rootMargin: "400px" });
    io.observe(sentinel.current);
    return () => io.disconnect();
  }, [pageSize, posts.length]);

  // simulate infinite scroll by recycling posts
  const rendered = Array.from({ length: count }, (_, i) => {
    const base = posts[i % posts.length];
    return { ...base, id: `${base.id}-${Math.floor(i / posts.length)}` };
  });

  return (
    <>
      <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6">
        {rendered.map((p) => (
          <PostCard key={p.id} post={p} />
        ))}
      </div>
      <div ref={sentinel} className="h-20 grid place-items-center text-xs text-muted-foreground font-mono uppercase tracking-widest">
        Loading more
      </div>
    </>
  );
}
