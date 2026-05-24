import { Link } from "@tanstack/react-router";
import { Heart, MessageCircle, Bookmark, Share2 } from "lucide-react";
import { useState } from "react";
import type { Post } from "@/lib/mock-data";
import { toast } from "sonner";

interface Props { post: Post }

export function PostCard({ post }: Props) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(post.saved);
  const [loaded, setLoaded] = useState(false);

  const aspect = post.height / post.width;

  return (
    <article className="group break-inside-avoid mb-6">
      <div className="relative overflow-hidden rounded-[2rem] bg-surface p-2 shadow-[var(--shadow-soft)] transition-all duration-500 hover:shadow-[var(--shadow-lift)] hover:-translate-y-1">
        <Link to="/post/$postId" params={{ postId: post.id }} className="block relative overflow-hidden rounded-[1.6rem]">
          <div className="w-full bg-muted rounded-[1.6rem] overflow-hidden" style={{ paddingTop: `${aspect * 100}%` }}>
            {!loaded && <div className="absolute inset-0 shimmer rounded-[1.6rem]" />}
            <img
              src={post.image}
              alt={post.title}
              loading="lazy"
              onLoad={() => setLoaded(true)}
              className={`absolute inset-0 size-full object-cover transition-all duration-700 group-hover:scale-105 ${loaded ? "opacity-100" : "opacity-0"}`}
            />
          </div>

          {/* Hover overlay */}
          <div className="absolute inset-2 rounded-[1.6rem] bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

          {/* Top actions */}
          <div
            className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0"
            onClick={(e) => e.preventDefault()}
          >
            <button
              onClick={(e) => { e.preventDefault(); setSaved(!saved); toast(saved ? "Removed" : "Saved to collection"); }}
              aria-label="Save"
              className={`px-4 h-9 rounded-full text-xs font-medium backdrop-blur-md transition-all ${
                saved ? "bg-foreground text-background" : "bg-white/80 text-black hover:bg-white"
              }`}
            >
              <Bookmark className="size-3.5 inline mr-1.5" />
              {saved ? "Saved" : "Save"}
            </button>
          </div>

          {/* Bottom meta on hover */}
          <div className="absolute bottom-4 left-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 pointer-events-none">
            <img src={post.creator.avatar} alt={post.creator.name} className="size-7 rounded-full ring-2 ring-white/30 object-cover" />
            <span className="text-white text-xs font-medium">@{post.creator.username}</span>
          </div>
        </Link>
      </div>

      {/* Below-card meta */}
      <div className="flex items-center justify-between px-2 mt-3">
        <Link to="/profile" className="flex items-center gap-2 min-w-0">
          <img src={post.creator.avatar} alt={post.creator.name} className="size-7 rounded-full object-cover shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{post.title}</p>
            <p className="text-[11px] text-muted-foreground truncate">@{post.creator.username}</p>
          </div>
        </Link>
        <div className="flex items-center gap-1" onClick={(e) => e.preventDefault()}>
          <button
            onClick={() => { setLiked(!liked); }}
            aria-label="Like"
            className="size-8 rounded-full grid place-items-center hover:bg-secondary transition-colors"
          >
            <Heart className={`size-4 transition-all ${liked ? "fill-red-500 stroke-red-500 scale-110" : ""}`} />
          </button>
          <button aria-label="Comment" className="size-8 rounded-full grid place-items-center hover:bg-secondary transition-colors">
            <MessageCircle className="size-4" />
          </button>
          <button
            onClick={() => { navigator.clipboard?.writeText(window.location.href).catch(() => {}); toast("Link copied"); }}
            aria-label="Share"
            className="size-8 rounded-full grid place-items-center hover:bg-secondary transition-colors"
          >
            <Share2 className="size-4" />
          </button>
        </div>
      </div>
    </article>
  );
}
