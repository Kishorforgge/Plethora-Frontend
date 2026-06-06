import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { PostCard } from "@/components/post-card";
import { getPost, relatedPosts, COMMENTS, ME } from "@/lib/mock-data";
import { Heart, MessageCircle, Bookmark, Share2, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/post/$postId")({
  loader: ({ params }) => {
    const post = getPost(params.postId.split("-")[0]); // handle recycled ids
    if (!post) throw notFound();
    return { post };
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
  component: PostDetail,
});

function PostDetail() {
  const { post } = Route.useLoaderData();
  const related = relatedPosts(post.id);
  const [liked, set_liked] = useState(false);
  const [saved, set_saved] = useState(false);
  const [comments, set_comments] = useState(COMMENTS[post.id] ?? []);
  const [draft, set_draft] = useState("");

  return (
    <AppShell>
      <div className="max-w-[1440px] mx-auto px-4 lg:px-8 pt-6 lg:pt-10">
        <Link to="/feed" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="size-4" /> Back to feed
        </Link>

        <article className="grid lg:grid-cols-[1.4fr_1fr] gap-8 bg-surface rounded-[2rem] p-2 lg:p-3 border border-border shadow-[var(--shadow-soft)] animate-fade-up">
          <div className="rounded-[1.6rem] overflow-hidden bg-muted">
            <img src={post.image} alt={post.title} className="w-full h-full object-cover max-h-[80vh]" />
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
                <span key={t} className="px-3 h-7 inline-flex items-center rounded-full bg-secondary text-[11px] text-muted-foreground">#{t}</span>
              ))}
            </div>

            <div className="flex items-center gap-1 mb-6 pb-6 border-b border-border">
              <ActionBtn onClick={() => set_liked(!liked)} icon={<Heart className={`size-4 ${liked ? "fill-red-500 stroke-red-500" : ""}`} />} label={post.likes + (liked ? 1 : 0)} />
              <ActionBtn icon={<MessageCircle className="size-4" />} label={comments.length} />
              <ActionBtn onClick={() => { setSavedAndToast(set_saved, saved); }} icon={<Bookmark className={`size-4 ${saved ? "fill-foreground" : ""}`} />} label={saved ? "Saved" : "Save"} />
              <ActionBtn onClick={() => { navigator.clipboard?.writeText(window.location.href).catch(() => {}); toast("Link copied"); }} icon={<Share2 className="size-4" />} label="Share" />
            </div>

            <h2 className="text-sm font-mono uppercase tracking-widest text-muted-foreground mb-4">Comments</h2>
            <div className="flex-1 space-y-4 mb-4 max-h-64 overflow-y-auto">
              {comments.length === 0 && <p className="text-sm text-muted-foreground">Be the first to leave a quiet word.</p>}
              {comments.map((c) => (
                <div key={c.id} className="flex gap-3">
                  <img src={c.author.avatar} className="size-8 rounded-full object-cover shrink-0" alt={c.author.name} />
                  <div className="min-w-0">
                    <p className="text-xs"><span className="font-medium">@{c.author.username}</span> <span className="text-muted-foreground ml-1">{c.createdAt}</span></p>
                    <p className="text-sm">{c.text}</p>
                  </div>
                </div>
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!draft.trim()) return;
                set_comments([...comments, { id: `nc${Date.now()}`, author: ME, text: draft.trim(), createdAt: "just now" }]);
                set_draft("");
              }}
              className="flex gap-2"
            >
              <input
                value={draft}
                onChange={(e) => set_draft(e.target.value)}
                placeholder="Add a comment…"
                className="flex-1 h-11 px-4 rounded-full border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring text-sm"
              />
              <button type="submit" className="px-5 h-11 rounded-full bg-foreground text-background text-sm">Send</button>
            </form>
          </aside>
        </article>

        <section className="mt-16">
          <h2 className="text-sm font-mono uppercase tracking-widest text-muted-foreground mb-6">Related frames</h2>
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6">
            {related.map((p) => <PostCard key={p.id} post={p} />)}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function setSavedAndToast(set: (v: boolean) => void, current: boolean) {
  set(!current);
  toast(current ? "Removed" : "Saved to collection");
}

function ActionBtn({ icon, label, onClick }: { icon: React.ReactNode; label: React.ReactNode; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="flex-1 h-10 inline-flex items-center justify-center gap-2 rounded-full hover:bg-secondary transition-colors text-xs font-medium">
      {icon} {label}
    </button>
  );
}
