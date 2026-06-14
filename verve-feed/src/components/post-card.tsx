import { Link } from "@tanstack/react-router";
import { Heart, MessageCircle, Bookmark, Share2, Trash2 } from "lucide-react";
import { useState } from "react";
import type { Post } from "@/lib/mock-data";
import { postsApi } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/components/auth-provider";

interface Props { post: Post }

export function PostCard({ post }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [liked, setLiked] = useState(!!post.liked);
  const [saved, setSaved] = useState(post.saved);
  const [loaded, setLoaded] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isOwner = user?._id === post.creator?.id;
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
            {isOwner && (
              <button
                onClick={async (e) => {
                  e.preventDefault();
                  if (deleting) return;
                  if (!window.confirm("Delete this upload? This action cannot be undone.")) return;
                  setDeleting(true);
                  try {
                    await postsApi.delete(post.id);
                    queryClient.invalidateQueries({ queryKey: ["my-uploads"] });
                    queryClient.invalidateQueries({ queryKey: ["my-saved"] });
                    queryClient.invalidateQueries({ queryKey: ["my-liked"] });
                    toast.success("Upload deleted successfully.");
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : "Failed to delete upload");
                  } finally {
                    setDeleting(false);
                  }
                }}
                aria-label="Delete upload"
                className="px-4 h-9 rounded-full text-xs font-medium bg-red-500 text-white hover:bg-red-600 transition-all"
                disabled={deleting}
              >
                <Trash2 className="size-3.5 inline mr-1.5" />
                Delete
              </button>
            )}
            <button
              onClick={async (e) => {
                e.preventDefault();
                const next = !saved;
                setSaved(next);
                try {
                  if (next) await postsApi.bookmark(post.id);
                  else await postsApi.unbookmark(post.id);
                  queryClient.invalidateQueries({ queryKey: ["my-saved"] });
                  queryClient.invalidateQueries({ queryKey: ["my-liked"] });
                  queryClient.invalidateQueries({ queryKey: ["my-uploads"] });
                  toast(next ? "Saved to collection" : "Removed");
                } catch (error) {
                  setSaved(!next);
                  toast.error(error instanceof Error ? error.message : "Could not update save");
                }
              }}
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
            <img 
              src={post.creator?.avatar || (post as any).user?.profilePicture || (post as any).user?.avatar || ""} 
              alt={post.creator?.fullName || post.creator?.name || (post as any).user?.fullName || (post as any).user?.name || "Unknown Creator"} 
              className="size-7 rounded-full ring-2 ring-white/30 object-cover" 
            />
            <div className="flex flex-col min-w-0">
              <h4 className="text-white text-xs font-medium truncate leading-none mb-0.5">
                {post.creator?.fullName || (post as any).user?.fullName || "Unknown Creator"}
              </h4>
              <p className="text-white/70 text-[10px] truncate leading-none">
                @{post.creator?.username || (post as any).user?.username || "unknown"}
              </p>
            </div>
          </div>
        </Link>
      </div>

      {/* Below-card meta */}
      <div className="flex items-center justify-between px-2 mt-3">
        {(post.creator?.username || (post as any).user?.username) ? (
          <Link 
            to="/profile/$username" 
            params={{ username: post.creator?.username || (post as any).user?.username }} 
            className="flex items-center gap-2 min-w-0"
          >
            <img 
              src={post.creator?.avatar || (post as any).user?.profilePicture || (post as any).user?.avatar || ""} 
              alt={post.creator?.name || (post as any).user?.fullName || (post as any).user?.name || "Unknown Creator"} 
              className="size-7 rounded-full object-cover shrink-0" 
            />
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{post.title}</p>
              <p className="text-[11px] text-muted-foreground truncate">
                @{post.creator?.username || (post as any).user?.username}
              </p>
            </div>
          </Link>
        ) : (
          <div className="flex items-center gap-2 min-w-0">
            <div className="size-7 rounded-full shrink-0 bg-muted" />
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{post.title}</p>
              <p className="text-[11px] text-muted-foreground truncate">@unknown</p>
            </div>
          </div>
        )}
        <div className="flex items-center gap-1" onClick={(e) => e.preventDefault()}>
          <button
            onClick={async () => {
              const next = !liked;
              setLiked(next);
              try {
                if (next) await postsApi.like(post.id);
                else await postsApi.unlike(post.id);
                queryClient.invalidateQueries({ queryKey: ["my-liked"] });
                queryClient.invalidateQueries({ queryKey: ["my-uploads"] });
              } catch (error) {
                setLiked(!next);
                toast.error(error instanceof Error ? error.message : "Could not update like");
              }
            }}
            aria-label="Like"
            className="size-8 rounded-full grid place-items-center hover:bg-secondary transition-colors"
          >
            <Heart className={`size-4 transition-all ${liked ? "fill-red-500 stroke-red-500 scale-110" : ""}`} />
          </button>
          <Link
            to="/post/$postId"
            params={{ postId: post.id }}
            aria-label={`${post.comments} comments`}
            className="size-8 rounded-full inline-flex items-center justify-center gap-1 px-2 hover:bg-secondary transition-colors text-xs"
          >
            <MessageCircle className="size-4 shrink-0" />
            {post.comments > 0 && <span>{post.comments}</span>}
          </Link>
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
