import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { PostCard } from "@/components/post-card";
import { Heart, MessageCircle, Bookmark, Share2, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { postsApi } from "@/lib/api";
import { CommentSection } from "@/components/comment-section";
import { mapApiPostToDisplay } from "@/lib/post-utils";
import { useAuth } from "@/components/auth-provider";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/post/$postId")({
  loader: async ({ params }) => {
    try {
      const apiPost = await postsApi.getPostById(params.postId);
      const post = mapApiPostToDisplay(apiPost);
      return { post };
    } catch (error) {
      throw notFound();
    }
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.post.title ?? "Post"} — Plethora` },
      { name: "description", content: loaderData?.post.caption ?? loaderData?.post.title ?? "Plethora post" },
      { property: "og:title", content: loaderData?.post.title ?? "Plethora post" },
      { property: "og:description", content: loaderData?.post.caption ?? loaderData?.post.title ?? "" },
      { property: "og:image", content: loaderData?.post.image ?? "" },
      { name: "twitter:image", content: loaderData?.post.image ?? "" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  notFoundComponent: () => (
    <AppShell>
      <div className="max-w-2xl mx-auto px-6 py-24 text-center">
        <h1 className="text-3xl font-semibold tracking-tight mb-3">Post not found</h1>
        <Link to="/feed" className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4">Back to feed</Link>
      </div>
    </AppShell>
  ),
  pendingComponent: () => (
    <AppShell>
      <div className="max-w-[1440px] mx-auto px-4 lg:px-8 pt-6 lg:pt-10 animate-pulse">
        <div className="h-6 w-32 bg-muted rounded-full mb-6" />
        <div className="grid lg:grid-cols-[1.4fr_1fr] gap-8 bg-surface rounded-[2rem] p-3 border border-border">
          <div className="rounded-[1.6rem] h-[60vh] bg-muted" />
          <div className="space-y-6 p-6">
            <div className="flex items-center gap-3">
              <div className="size-11 rounded-full bg-muted" />
              <div className="space-y-2 flex-1">
                <div className="h-4 w-24 bg-muted rounded" />
                <div className="h-3 w-16 bg-muted rounded" />
              </div>
            </div>
            <div className="h-8 w-3/4 bg-muted rounded" />
            <div className="h-4 w-full bg-muted rounded" />
            <div className="h-4 w-5/6 bg-muted rounded" />
          </div>
        </div>
      </div>
    </AppShell>
  ),
  component: PostDetail,
});

function PostDetail() {
  const { post } = Route.useLoaderData();
  const { user } = useAuth();
  
  const [liked, set_liked] = useState(post.liked ?? false);
  const [saved, set_saved] = useState(post.saved ?? false);
  const [likesCount, setLikesCount] = useState(post.likes ?? 0);
  const [commentCount, setCommentCount] = useState(post.comments ?? 0);

  // Fetch related posts from database
  const { data: relatedPosts = [] } = useQuery({
    queryKey: ["related-posts", post.id],
    queryFn: () => postsApi.list({ limit: 12 }),
  });

  const displayRelated = relatedPosts
    .filter((p) => p._id !== post.id)
    .map(mapApiPostToDisplay)
    .slice(0, 8);

  const handleLike = async () => {
    if (!user) {
      toast.error("Please sign in to like posts.");
      return;
    }
    const next = !liked;
    set_liked(next);
    try {
      if (next) {
        const res = await postsApi.like(post.id);
        setLikesCount(res.likesCount);
      } else {
        const res = await postsApi.unlike(post.id);
        setLikesCount(res.likesCount);
      }
    } catch (err) {
      set_liked(!next);
      toast.error("Failed to update like status");
    }
  };

  const handleSave = async () => {
    if (!user) {
      toast.error("Please sign in to save posts.");
      return;
    }
    const next = !saved;
    set_saved(next);
    try {
      if (next) {
        await postsApi.bookmark(post.id);
        toast.success("Saved to collection");
      } else {
        await postsApi.unbookmark(post.id);
        toast.success("Removed from bookmarks");
      }
    } catch (err) {
      set_saved(!next);
      toast.error("Failed to update bookmark status");
    }
  };

  return (
    <AppShell>
      <div className="max-w-[1440px] mx-auto px-4 lg:px-8 pt-6 lg:pt-10">
        <Link to="/feed" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="size-4" /> Back to feed
        </Link>

        <article className="grid lg:grid-cols-[1.4fr_1fr] gap-8 bg-surface rounded-[2rem] p-2 lg:p-3 border border-border shadow-[var(--shadow-soft)] animate-fade-up">
          <div className="rounded-[1.6rem] overflow-hidden bg-muted">
            <img src={post.image} alt={post.title} className="w-full h-full object-cover max-h-[85vh]" />
          </div>

          <aside className="flex flex-col p-4 lg:p-6">
            <div className="flex items-center justify-between mb-6">
              <Link to="/profile/$username" params={{ username: post.creator.username }} className="flex items-center gap-3">
                <img src={post.creator.avatar} alt={post.creator.name} className="size-11 rounded-full object-cover" />
                <div>
                  <p className="text-sm font-medium">{post.creator.name}</p>
                  <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">@{post.creator.username}</p>
                </div>
              </Link>
              <button className="px-4 h-9 rounded-full bg-foreground text-background text-xs font-medium">Follow</button>
            </div>

            <h1 className="text-2xl font-semibold tracking-tight mb-2">{post.title}</h1>
            {post.caption && <p className="text-sm text-muted-foreground mb-4">{post.caption}</p>}

            <div className="flex flex-wrap gap-1.5 mb-6">
              {post.tags.map((t: string) => (
                <span key={t} className="px-3 h-7 inline-flex items-center rounded-full bg-secondary text-[11px] text-muted-foreground font-mono">#{t}</span>
              ))}
            </div>

            <div className="flex items-center gap-1 mb-6 pb-6 border-b border-border">
              <ActionBtn onClick={handleLike} icon={<Heart className={`size-4 ${liked ? "fill-red-500 stroke-red-500 scale-110" : ""}`} />} label={likesCount} />
              <ActionBtn icon={<MessageCircle className="size-4" />} label={commentCount} />
              <ActionBtn onClick={handleSave} icon={<Bookmark className={`size-4 ${saved ? "fill-foreground" : ""}`} />} label={saved ? "Saved" : "Save"} />
              <ActionBtn onClick={() => { navigator.clipboard?.writeText(window.location.href).catch(() => {}); toast("Link copied"); }} icon={<Share2 className="size-4" />} label="Share" />
            </div>

            <CommentSection
              postId={post.id}
              onCommentCountChange={setCommentCount}
            />
          </aside>
        </article>

        <section className="mt-16">
          <h2 className="text-sm font-mono uppercase tracking-widest text-muted-foreground mb-6">Related frames</h2>
          {displayRelated.length === 0 ? (
            <p className="text-sm text-muted-foreground">No related visual collections found.</p>
          ) : (
            <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6">
              {displayRelated.map((p) => <PostCard key={p.id} post={p} />)}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}

function ActionBtn({ icon, label, onClick }: { icon: React.ReactNode; label: React.ReactNode; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="flex-1 h-10 inline-flex items-center justify-center gap-2 rounded-full hover:bg-secondary transition-colors text-xs font-medium">
      {icon} {label}
    </button>
  );
}
