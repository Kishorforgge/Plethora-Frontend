import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { MasonryFeed } from "@/components/masonry-feed";
import { useAuth } from "@/components/auth-provider";
import { postsApi, userApi } from "@/lib/api";
import { mapApiPostToDisplay } from "@/lib/post-utils";
import { requireAuth } from "@/lib/require-auth";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Settings, Grid3x3, Bookmark, Heart } from "lucide-react";

export const Route = createFileRoute("/profile")({
  beforeLoad: requireAuth,
  head: () => ({
    meta: [{ title: "Profile — Plethora" }],
  }),
  component: ProfilePage,
});

type ProfileTab = "posts" | "saved" | "liked";

function ProfilePage() {
  const { user } = useAuth();
  const [tab, set_tab] = useState<ProfileTab>("posts");
  const [listModal, setListModal] = useState<"followers" | "following" | null>(null);

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

  const { data: followers = [], isLoading: loadingFollowers } = useQuery({
    queryKey: ["my-followers"],
    queryFn: userApi.myFollowers,
    enabled: listModal === "followers",
  });

  const { data: following = [], isLoading: loadingFollowing } = useQuery({
    queryKey: ["my-following"],
    queryFn: userApi.myFollowing,
    enabled: listModal === "following",
  });

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
              <Link
                to="/settings"
                aria-label="Settings"
                className="size-11 rounded-full border border-border grid place-items-center hover:bg-secondary transition-colors"
              >
                <Settings className="size-4" />
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
          <p className="text-sm text-muted-foreground font-mono uppercase tracking-widest">
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
          users={listModal === "followers" ? followers : following}
          loading={listModal === "followers" ? loadingFollowers : loadingFollowing}
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

function FollowListModal({
  title,
  users,
  loading,
  onClose,
}: {
  title: string;
  users: Array<{ _id: string; username: string; fullName: string; profilePicture: string }>;
  loading: boolean;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm grid place-items-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-md max-h-[80vh] overflow-hidden rounded-3xl border border-border bg-background shadow-[var(--shadow-lift)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          <button onClick={onClose} className="text-sm text-muted-foreground hover:text-foreground">
            Close
          </button>
        </div>
        <div className="max-h-[65vh] overflow-y-auto p-3">
          {loading ? (
            <p className="text-sm text-muted-foreground p-3">Loading…</p>
          ) : users.length === 0 ? (
            <p className="text-sm text-muted-foreground p-3">No users yet.</p>
          ) : (
            users.map((u) => (
              <div key={u._id} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-surface">
                <img src={u.profilePicture} alt={u.fullName || u.username} className="size-11 rounded-full object-cover" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{u.fullName || u.username}</p>
                  <p className="text-xs text-muted-foreground truncate">@{u.username}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
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
