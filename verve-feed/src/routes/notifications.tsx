import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { NOTIFICATIONS } from "@/lib/mock-data";
import { Heart, MessageCircle, UserPlus, Bookmark } from "lucide-react";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — Plethora" },
      { name: "description", content: "Recent likes, comments, follows, and saves on your work." },
    ],
  }),
  component: NotificationsPage,
});

const icons = {
  like: Heart,
  comment: MessageCircle,
  follow: UserPlus,
  save: Bookmark,
};

function NotificationsPage() {
  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-4 lg:px-8 pt-8 lg:pt-12">
        <header className="mb-10 animate-fade-up">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-3">Activity</p>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tighter">Notifications</h1>
        </header>

        <div className="space-y-2">
          {NOTIFICATIONS.map((n) => {
            const Icon = icons[n.type];
            return (
              <div
                key={n.id}
                className={`flex items-center gap-4 p-4 rounded-2xl border transition-all hover:bg-surface ${
                  n.read ? "bg-transparent border-border" : "bg-surface border-border shadow-[var(--shadow-soft)]"
                }`}
              >
                <div className="relative shrink-0">
                  <img src={n.actor.avatar} alt={n.actor.name} className="size-11 rounded-full object-cover" />
                  <span className="absolute -bottom-1 -right-1 size-6 rounded-full bg-foreground text-background grid place-items-center">
                    <Icon className="size-3" />
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-medium">@{n.actor.username}</span> <span className="text-muted-foreground">{n.text}</span>
                  </p>
                  <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground mt-0.5">{n.time}</p>
                </div>
                {n.postImage && (
                  <img src={n.postImage} alt="" className="size-12 rounded-xl object-cover shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
