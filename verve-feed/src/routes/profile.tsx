import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { MasonryFeed } from "@/components/masonry-feed";
import { useAuth } from "@/components/auth-provider";
import { postsApi, userApi, messagesApi } from "@/lib/api";
import { mapApiPostToDisplay } from "@/lib/post-utils";
import { requireAuth } from "@/lib/require-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useRef, useMemo, UIEvent } from "react";
import { Grid3x3, Bookmark, Heart, X, Search, Check, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { io } from "socket.io-client";
import { FollowListModal } from "@/components/follow-list-modal";

export const Route = createFileRoute("/profile")({
  beforeLoad: requireAuth,
  head: () => ({
    meta: [{ title: "Profile — Plethora" }],
  }),
  component: ProfilePage,
});

type ProfileTab = "posts" | "saved" | "liked";

function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [tab, set_tab] = useState<ProfileTab>("posts");
  const [listModal, setListModal] = useState<"followers" | "following" | null>(null);
  const qc = useQueryClient();

  const { data: uploads = [], isLoading: loadingUploads } = useQuery({
    queryKey: ["my-uploads"],
    queryFn: postsApi.myUploads,
  });

  const { data: saved = [], isLoading: loadingSaved } = useQuery({
    queryKey: ["my-saved"],
    queryFn: postsApi.mySaved,
    enabled: tab === "saved",
  });

  const { data: liked = [], isLoading: loadingLiked } = useQuery({
    queryKey: ["my-liked"],
    queryFn: postsApi.myLiked,
    enabled: tab === "liked",
  });

  // Socket.IO synchronization for follow/unfollow updates
  useEffect(() => {
    const socketUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.trim() : "http://localhost:5000";
    const socket = io(socketUrl, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    if (user?._id) {
      socket.emit("join", user._id);
    }

    socket.on("follow_update", (data: { followerId: string; followingId: string; action: "follow" | "unfollow" }) => {
      if (data.followerId === user?._id || data.followingId === user?._id) {
        refreshUser().catch((err) => console.error("Socket error refreshing profile user:", err));
        qc.invalidateQueries({ queryKey: ["user-followers", user?._id] });
        qc.invalidateQueries({ queryKey: ["user-following", user?._id] });
        qc.invalidateQueries({ queryKey: ["search-followers"] });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [user?._id, refreshUser, qc]);

  if (!user) return null;

  const activePosts =
    tab === "posts" ? uploads : tab === "saved" ? saved : liked;
  const loading =
    tab === "posts" ? loadingUploads : tab === "saved" ? loadingSaved : loadingLiked;
  const displayPosts = activePosts.map(mapApiPostToDisplay);

  return (
    <AppShell>
      <div className="max-w-[1440px] mx-auto px-4 lg:px-8 pt-8 lg:pt-12">
        <header className="bg-surface rounded-[2rem] p-8 lg:p-12 border border-border mb-10 animate-fade-up">
          <div className="flex flex-col md:flex-row md:items-end gap-8">
            <img
              src={user.profilePicture}
              alt={user.fullName}
              className="size-28 lg:size-36 rounded-full object-cover ring-4 ring-background shadow-[var(--shadow-soft)]"
            />
            <div className="flex-1">
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-2">
                @{user.username}
              </p>
              <h1 className="text-3xl lg:text-4xl font-semibold tracking-tight mb-2">
                {user.fullName || user.username}
              </h1>
              <p className="text-sm text-muted-foreground max-w-md mb-5">{user.bio || "No bio yet."}</p>
              <div className="flex items-center gap-7 text-sm">
                <Stat label="Posts" value={uploads.length} />
                <button type="button" onClick={() => setListModal("followers")} className="text-left">
                  <Stat label="Followers" value={user.followersCount} clickable />
                </button>
                <button type="button" onClick={() => setListModal("following")} className="text-left">
                  <Stat label="Following" value={user.followingCount} clickable />
                </button>
              </div>
            </div>
            <div className="flex gap-2">
              <Link
                to="/settings"
                className="px-5 h-11 rounded-full bg-foreground text-background text-sm font-medium hover:scale-[1.02] transition-transform inline-flex items-center"
              >
                Edit profile
              </Link>
            </div>
          </div>
        </header>

        <div className="flex items-center gap-2 mb-8 border-b border-border flex-wrap">
          <TabBtn
            active={tab === "posts"}
            onClick={() => set_tab("posts")}
            icon={<Grid3x3 className="size-4" />}
            label="My uploads"
          />
          <TabBtn
            active={tab === "saved"}
            onClick={() => set_tab("saved")}
            icon={<Bookmark className="size-4" />}
            label="Saved"
          />
          <TabBtn
            active={tab === "liked"}
            onClick={() => set_tab("liked")}
            icon={<Heart className="size-4" />}
            label="Liked"
          />
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground font-mono uppercase tracking-widest animate-pulse">
            Loading…
          </p>
        ) : displayPosts.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {tab === "posts" && "You have not uploaded any images yet."}
            {tab === "saved" && "No saved posts yet."}
            {tab === "liked" && "No liked posts yet."}
          </p>
        ) : (
          <MasonryFeed posts={displayPosts} />
        )}
      </div>

      {listModal && (
        <FollowListModal
          title={listModal === "followers" ? "Followers" : "Following"}
          userId={user._id}
          onClose={() => setListModal(null)}
        />
      )}
    </AppShell>
  );
}

function Stat({
  label,
  value,
  clickable = false,
}: {
  label: string;
  value: number;
  clickable?: boolean;
}) {
  return (
    <div className={clickable ? "hover:opacity-80 transition-opacity" : ""}>
      <p className="text-xl font-semibold tracking-tight">{value.toLocaleString()}</p>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-5 h-11 inline-flex items-center gap-2 text-sm font-medium relative transition-colors ${
        active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {icon} {label}
      {active && <span className="absolute -bottom-px left-0 right-0 h-px bg-foreground" />}
    </button>
  );
}
