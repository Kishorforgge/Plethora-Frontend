import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { MasonryFeed } from "@/components/masonry-feed";
import { useAuth } from "@/components/auth-provider";
import { BACKEND_HOST, postsApi, userApi, messagesApi } from "@/lib/api";
import { mapApiPostToDisplay } from "@/lib/post-utils";
import { requireAuth } from "@/lib/require-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Grid3x3 } from "lucide-react";
import { toast } from "sonner";
import { io } from "socket.io-client";
import { FollowListModal } from "@/components/follow-list-modal";

export const Route = createFileRoute("/profile_/$username")({
  beforeLoad: requireAuth,
  head: ({ params }) => ({
    meta: [{ title: `@${params.username} — Plethora` }],
  }),
  component: UserProfilePage,
});

function UserProfilePage() {
  const { username } = Route.useParams();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [listModal, setListModal] = useState<"followers" | "following" | null>(null);
  const [showUnfollowConfirm, setShowUnfollowConfirm] = useState(false);

  const isMe = currentUser?.username?.toLowerCase() === username.toLowerCase();

  const { data: profileUser, isLoading: loadingProfile, error: profileError } = useQuery({
    queryKey: ["user-profile", username],
    queryFn: () => userApi.getUserProfile(username),
    retry: false,
  });

  const { data: uploads = [], isLoading: loadingUploads } = useQuery({
    queryKey: ["user-uploads", profileUser?._id],
    queryFn: () => postsApi.userUploads(profileUser!._id),
    enabled: !!profileUser?._id,
  });

  // Socket.IO synchronization for follow/unfollow updates
  useEffect(() => {
    const socket = io(BACKEND_HOST, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    if (profileUser?._id) {
      socket.emit("join", profileUser._id);
    }

    socket.on("follow_update", (data: { followerId: string; followingId: string; action: "follow" | "unfollow" }) => {
      if (data.followerId === profileUser?._id || data.followingId === profileUser?._id) {
        qc.invalidateQueries({ queryKey: ["user-profile", username] });
        qc.invalidateQueries({ queryKey: ["user-followers", profileUser?._id] });
        qc.invalidateQueries({ queryKey: ["user-following", profileUser?._id] });
        qc.invalidateQueries({ queryKey: ["search-followers"] });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [profileUser?._id, username, qc]);

  const followMutation = useMutation({
    mutationFn: () => userApi.follow(profileUser!._id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user-profile", username] });
      toast.success(`You are now following ${profileUser!.username}`);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to follow");
    }
  });

  const unfollowMutation = useMutation({
    mutationFn: () => userApi.unfollow(profileUser!._id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user-profile", username] });
      toast.success(`You have unfollowed ${profileUser!.username}`);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to unfollow");
    }
  });

  const handleMessageClick = async () => {
    if (!profileUser) return;
    try {
      await messagesApi.getOrCreateConversation(profileUser._id);
      navigate({ to: "/messages" });
    } catch (err) {
      toast.error("Failed to start chat");
    }
  };

  if (loadingProfile) {
    return (
      <AppShell>
        <div className="max-w-[1440px] mx-auto px-4 lg:px-8 pt-8 lg:pt-12">
          <div className="bg-surface rounded-[2rem] p-8 lg:p-12 border border-border mb-10 animate-pulse">
            <div className="flex flex-col md:flex-row md:items-end gap-8">
              <div className="size-28 lg:size-36 rounded-full bg-muted shrink-0" />
              <div className="flex-1 space-y-3">
                <div className="h-4 w-24 bg-muted rounded" />
                <div className="h-8 w-48 bg-muted rounded" />
                <div className="h-4 w-64 bg-muted rounded" />
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  if (profileError || !profileUser) {
    return (
      <AppShell>
        <div className="max-w-2xl mx-auto px-6 py-24 text-center">
          <h1 className="text-3xl font-semibold tracking-tight mb-3">User not found</h1>
          <p className="text-sm text-muted-foreground mb-6">
            The link you followed may be broken, or the page may have been removed.
          </p>
          <Link
            to="/feed"
            className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4"
          >
            Back to feed
          </Link>
        </div>
      </AppShell>
    );
  }

  const displayPosts = uploads.map(mapApiPostToDisplay);

  return (
    <AppShell>
      <div className="max-w-[1440px] mx-auto px-4 lg:px-8 pt-8 lg:pt-12">
        <header className="bg-surface rounded-[2rem] p-8 lg:p-12 border border-border mb-10 animate-fade-up">
          <div className="flex flex-col md:flex-row md:items-end gap-8">
            <img
              src={profileUser.profilePicture}
              alt={profileUser.fullName}
              className="size-28 lg:size-36 rounded-full object-cover ring-4 ring-background shadow-[var(--shadow-soft)]"
            />
            <div className="flex-1">
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-2">
                @{profileUser.username}
              </p>
              <h1 className="text-3xl lg:text-4xl font-semibold tracking-tight mb-2">
                {profileUser.fullName || profileUser.username}
              </h1>
              <p className="text-sm text-muted-foreground max-w-md mb-5">
                {profileUser.bio || "No bio yet."}
              </p>
              <div className="flex items-center gap-7 text-sm">
                <Stat label="Posts" value={profileUser.postsCount} />
                <button type="button" onClick={() => setListModal("followers")} className="text-left">
                  <Stat label="Followers" value={profileUser.followersCount} clickable />
                </button>
                <button type="button" onClick={() => setListModal("following")} className="text-left">
                  <Stat label="Following" value={profileUser.followingCount} clickable />
                </button>
              </div>
            </div>
            <div className="flex gap-2">
              {isMe ? (
                <Link
                  to="/settings"
                  className="px-5 h-11 rounded-full bg-foreground text-background text-sm font-medium hover:scale-[1.02] transition-transform inline-flex items-center"
                >
                  Edit profile
                </Link>
              ) : (
                <>
                  {profileUser.isFollowing ? (
                    <button
                      type="button"
                      onClick={() => setShowUnfollowConfirm(true)}
                      className="px-5 h-11 rounded-full bg-secondary text-foreground text-sm font-medium hover:scale-[1.02] border border-border transition-transform inline-flex items-center"
                    >
                      Following
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => followMutation.mutate()}
                      className="px-5 h-11 rounded-full bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium hover:scale-[1.02] transition-transform inline-flex items-center"
                    >
                      Follow
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleMessageClick}
                    className="px-5 h-11 rounded-full border border-border hover:bg-secondary text-foreground text-sm font-medium transition-colors inline-flex items-center"
                  >
                    Message
                  </button>
                </>
              )}
            </div>
          </div>
        </header>

        <div className="flex items-center gap-2 mb-8 border-b border-border flex-wrap">
          <div className="px-5 h-11 inline-flex items-center gap-2 text-sm font-medium relative text-foreground">
            <Grid3x3 className="size-4" /> Posts
            <span className="absolute -bottom-px left-0 right-0 h-px bg-foreground" />
          </div>
        </div>

        {loadingUploads ? (
          <p className="text-sm text-muted-foreground font-mono uppercase tracking-widest animate-pulse">
            Loading…
          </p>
        ) : displayPosts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No posts yet.</p>
        ) : (
          <MasonryFeed posts={displayPosts} />
        )}
      </div>

      {listModal && (
        <FollowListModal
          title={listModal === "followers" ? "Followers" : "Following"}
          userId={profileUser._id}
          onClose={() => setListModal(null)}
        />
      )}

      {showUnfollowConfirm && (
        <div
          className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-[1px] grid place-items-center p-4 animate-fade-in"
          onClick={() => setShowUnfollowConfirm(false)}
        >
          <div
            className="w-full max-w-[320px] bg-background border border-border rounded-[20px] overflow-hidden shadow-[var(--shadow-lift)] animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center p-6 border-b border-border text-center">
              <img
                src={profileUser.profilePicture}
                alt={profileUser.username}
                className="size-14 rounded-full object-cover mb-4 ring-1 ring-border"
              />
              <h3 className="text-sm font-semibold text-foreground">
                Unfollow @{profileUser.username}?
              </h3>
            </div>
            <div className="flex flex-col">
              <button
                onClick={() => {
                  unfollowMutation.mutate();
                  setShowUnfollowConfirm(false);
                }}
                className="w-full h-12 text-sm font-bold text-red-500 hover:bg-secondary active:bg-secondary/80 border-b border-border transition-colors"
              >
                Unfollow
              </button>
              <button
                onClick={() => setShowUnfollowConfirm(false)}
                className="w-full h-12 text-sm font-medium text-muted-foreground hover:bg-secondary active:bg-secondary/80 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
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
