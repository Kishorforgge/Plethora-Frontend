import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { ApiNotification, notificationsApi } from "@/lib/api";
import { requireAuth } from "@/lib/require-auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Heart, MessageCircle, UserPlus, ImageIcon } from "lucide-react";
import { useEffect } from "react";

export const Route = createFileRoute("/notifications")({
  beforeLoad: requireAuth,
  head: () => ({
    meta: [{ title: "Notifications — Plethora" }],
  }),
  component: NotificationsPage,
});

const icons = {
  like: Heart,
  comment: MessageCircle,
  follow: UserPlus,
  new_post: ImageIcon,
};

function notificationAction(n: ApiNotification): string {
  switch (n.type) {
    case "like":
      return "liked your post";
    case "comment":
      return "commented on your post";
    case "follow":
      return "started following you";
    case "new_post":
      return "shared new work";
    default:
      return "sent you an update";
  }
}

function NotificationsPage() {
  const qc = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: notificationsApi.list,
    refetchInterval: 30000,
  });

  const markRead = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  useEffect(() => {
    if (isLoading) return;
    if (notifications.some((n) => !n.isRead)) markRead.mutate();
  }, [isLoading, notifications]);

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-4 lg:px-8 pt-8 lg:pt-12">
        <header className="mb-10 animate-fade-up">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-3">
            Activity
          </p>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tighter">Notifications</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Likes, follows, comments, and new posts from creators you follow.
          </p>
        </header>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : notifications.length === 0 ? (
          <p className="text-sm text-muted-foreground p-6 rounded-2xl border border-border bg-surface text-center">
            No notifications yet. Follow creators to get updates when they post.
          </p>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => {
              const Icon = icons[n.type];
              const postId = n.post?._id;
              return (
                <div
                  key={n._id}
                  className={`flex items-center gap-4 p-4 rounded-2xl border transition-all hover:bg-surface ${
                    n.isRead
                      ? "bg-transparent border-border"
                      : "bg-surface border-border shadow-[var(--shadow-soft)]"
                  }`}
                >
                  <div className="relative shrink-0">
                    <img
                      src={n.sender.profilePicture}
                      alt={n.sender.username}
                      className="size-11 rounded-full object-cover"
                    />
                    <span className="absolute -bottom-1 -right-1 size-6 rounded-full bg-foreground text-background grid place-items-center">
                      <Icon className="size-3" />
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-medium">@{n.sender.username}</span>{" "}
                      <span className="text-muted-foreground">{notificationAction(n)}</span>
                    </p>
                    <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground mt-0.5">
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  {n.post?.imageUrl &&
                    (postId ? (
                      <Link to="/post/$postId" params={{ postId }}>
                        <img
                          src={n.post.imageUrl}
                          alt=""
                          className="size-12 rounded-xl object-cover shrink-0"
                        />
                      </Link>
                    ) : (
                      <img
                        src={n.post.imageUrl}
                        alt=""
                        className="size-12 rounded-xl object-cover shrink-0"
                      />
                    ))}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
