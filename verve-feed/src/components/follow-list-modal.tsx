import { useState, useEffect, useRef, useMemo, UIEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, Link } from "@tanstack/react-router";
import { X, Search, Check, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth-provider";
import { userApi, messagesApi } from "@/lib/api";

// ----------------------------------------------------
// Custom React Virtualized List (Optimized for 500+ items)
// ----------------------------------------------------
interface VirtualizedListProps<T> {
  items: T[];
  itemHeight?: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
}

function VirtualizedList<T>({
  items,
  itemHeight = 62,
  renderItem,
  className = "",
}: VirtualizedListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(380);

  useEffect(() => {
    if (containerRef.current) {
      setContainerHeight(containerRef.current.clientHeight || 380);
      const resizeObserver = new ResizeObserver((entries) => {
        for (let entry of entries) {
          setContainerHeight(entry.contentRect.height || 380);
        }
      });
      resizeObserver.observe(containerRef.current);
      return () => resizeObserver.disconnect();
    }
  }, []);

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  const totalHeight = items.length * itemHeight;
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - 4);
  const endIndex = Math.min(items.length - 1, Math.floor((scrollTop + containerHeight) / itemHeight) + 4);

  const visibleItems = [];
  for (let i = startIndex; i <= endIndex; i++) {
    visibleItems.push({
      item: items[i],
      index: i,
      style: {
        position: "absolute" as const,
        top: i * itemHeight,
        left: 0,
        right: 0,
        height: itemHeight,
      },
    });
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className={`overflow-y-auto relative ${className}`}
      style={{ height: "100%", maxHeight: "380px" }}
    >
      <div style={{ height: totalHeight, width: "100%", position: "relative" }}>
        {visibleItems.map(({ item, index, style }) => (
          <div key={index} style={style}>
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </div>
  );
}

// ----------------------------------------------------
// User Row Skeleton Loader (Instagram Shimmer Style)
// ----------------------------------------------------
function UserRowSkeleton() {
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <div className="flex items-center gap-3">
        <div className="size-11 rounded-full shimmer" />
        <div className="space-y-1.5">
          <div className="h-3.5 w-24 rounded shimmer" />
          <div className="h-3 w-32 rounded shimmer" />
        </div>
      </div>
      <div className="h-8 w-20 rounded-lg shimmer" />
    </div>
  );
}

// ----------------------------------------------------
// Complete Instagram-style Followers / Following Modal
// ----------------------------------------------------
export interface FollowUser {
  _id: string;
  username: string;
  fullName: string;
  profilePicture: string;
  isVerified: boolean;
  isFollowing: boolean;
  isBlocked: boolean;
  isMuted: boolean;
}

interface FollowListModalProps {
  title: "Followers" | "Following";
  userId: string;
  onClose: () => void;
}

// Responsive Action Options Dropdown / Sheet Overlay
interface UserActionsOverlayProps {
  user: FollowUser;
  title: "Followers" | "Following";
  onClose: () => void;
  onUnfollowClick: () => void;
  onRemoveClick: () => void;
  onMuteClick: () => void;
  onBlockClick: () => void;
  onMessageClick: () => void;
  isActionPending?: boolean;
}

function UserActionsOverlay({
  user,
  title,
  onClose,
  onUnfollowClick,
  onRemoveClick,
  onMuteClick,
  onBlockClick,
  onMessageClick,
  isActionPending = false,
}: UserActionsOverlayProps) {
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleViewProfile = () => {
    console.log("View profile clicked");
    console.log("User:", user);
    console.log("Username:", user?.username);

    if (user?.username) {
      navigate({ to: "/profile/$username", params: { username: user.username } });
    } else {
      console.warn("Username is missing, attempting to navigate using ID");
      navigate({ to: "/profile/$username", params: { username: user._id } });
    }
    onClose();
  };

  const actionList = (
    <div className="flex flex-col">
      <button
        onClick={handleViewProfile}
        className="w-full h-12 inline-flex items-center justify-center text-sm font-medium text-foreground hover:bg-secondary active:bg-secondary/80 border-b border-border transition-colors cursor-pointer"
      >
        View Profile
      </button>
      <button
        onClick={onMessageClick}
        className="w-full h-12 text-sm font-medium text-foreground hover:bg-secondary active:bg-secondary/80 border-b border-border transition-colors"
      >
        Message
      </button>

      <button
        onClick={onMuteClick}
        disabled={isActionPending}
        className="w-full h-12 text-sm font-medium text-foreground hover:bg-secondary active:bg-secondary/80 border-b border-border transition-colors disabled:opacity-50"
      >
        {user.isMuted ? "Unmute" : "Mute"}
      </button>
      
      <button
        onClick={onBlockClick}
        disabled={isActionPending}
        className="w-full h-12 text-sm font-medium text-foreground hover:bg-secondary active:bg-secondary/80 border-b border-border transition-colors disabled:opacity-50"
      >
        {user.isBlocked ? "Unblock" : "Block"}
      </button>

      {title === "Following" ? (
        <button
          onClick={onUnfollowClick}
          className="w-full h-12 text-sm font-bold text-red-500 hover:bg-secondary active:bg-secondary/80 border-b border-border transition-colors"
        >
          Unfollow
        </button>
      ) : (
        <button
          onClick={onRemoveClick}
          className="w-full h-12 text-sm font-bold text-red-500 hover:bg-secondary active:bg-secondary/80 border-b border-border transition-colors"
        >
          Remove Follower
        </button>
      )}

      <button
        onClick={onClose}
        className="w-full h-12 text-sm font-medium text-muted-foreground hover:bg-secondary active:bg-secondary/80 transition-colors"
      >
        Cancel
      </button>
    </div>
  );

  if (isMobile) {
    return (
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[1px] flex items-end justify-center animate-fade-in"
        onClick={onClose}
      >
        <div
          className="w-full bg-background rounded-t-[20px] overflow-hidden max-w-md animate-slide-up flex flex-col shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-12 h-1 bg-muted rounded-full mx-auto my-3 shrink-0" />
          <div className="flex flex-col items-center py-4 border-b border-border text-center px-4">
            <img
              src={user.profilePicture}
              alt={user.username}
              className="size-12 rounded-full object-cover mb-2 ring-1 ring-border"
            />
            <p className="text-sm font-semibold text-foreground">@{user.username}</p>
          </div>
          {actionList}
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[1px] grid place-items-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[320px] bg-background border border-border rounded-[20px] overflow-hidden shadow-2xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center p-5 border-b border-border text-center">
          <img
            src={user.profilePicture}
            alt={user.username}
            className="size-12 rounded-full object-cover mb-2 ring-1 ring-border"
          />
          <p className="text-sm font-semibold text-foreground">@{user.username}</p>
        </div>
        {actionList}
      </div>
    </div>
  );
}

// Confirmation Dialog Modal
interface ConfirmationModalProps {
  type: "unfollow" | "remove_follower";
  user: FollowUser;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}

function ConfirmationModal({
  type,
  user,
  onClose,
  onConfirm,
  loading,
}: ConfirmationModalProps) {
  return (
    <div
      className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-[1px] grid place-items-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[320px] bg-background border border-border rounded-[20px] overflow-hidden shadow-[var(--shadow-lift)] animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center p-6 border-b border-border text-center">
          <img
            src={user.profilePicture}
            alt={user.username}
            className="size-14 rounded-full object-cover mb-4 ring-1 ring-border"
          />
          <h3 className="text-sm font-semibold text-foreground">
            {type === "unfollow" ? `Unfollow @${user.username}?` : "Remove follower?"}
          </h3>
          <p className="text-xs text-muted-foreground mt-2 px-2 leading-relaxed">
            {type === "unfollow"
              ? `You'll need to request to follow @${user.username} again if you change your mind.`
              : `Plethora won't tell @${user.username} they were removed from your followers.`}
          </p>
        </div>
        <div className="flex flex-col">
          <button
            onClick={onConfirm}
            disabled={loading}
            className="w-full h-12 text-sm font-bold text-red-500 hover:bg-secondary active:bg-secondary/80 border-b border-border transition-colors disabled:opacity-50"
          >
            {loading
              ? type === "unfollow"
                ? "Unfollowing..."
                : "Removing..."
              : type === "unfollow"
                ? "Unfollow"
                : "Remove"}
          </button>
          <button
            onClick={onClose}
            className="w-full h-12 text-sm font-medium text-muted-foreground hover:bg-secondary active:bg-secondary/80 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export function FollowListModal({ title, userId, onClose }: FollowListModalProps) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { user: currentUser, refreshUser } = useAuth();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedUserOptions, setSelectedUserOptions] = useState<FollowUser | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    type: "unfollow" | "remove_follower";
    user: FollowUser;
  } | null>(null);

  // Debounce search input by 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  const isSearching = debouncedSearch.length > 0;

  // React Query fetch for list or search
  const { data: users = [], isLoading } = useQuery({
    queryKey: isSearching
      ? ["search-followers", debouncedSearch]
      : [title === "Followers" ? "user-followers" : "user-following", userId],
    queryFn: () => {
      if (isSearching) {
        return userApi.searchFollowers(debouncedSearch);
      } else {
        return title === "Followers"
          ? userApi.getUserFollowers(userId)
          : userApi.getUserFollowing(userId);
      }
    },
    placeholderData: (prev) => prev,
  });

  // Follow mutation
  const followMutation = useMutation({
    mutationFn: (targetId: string) => userApi.follow(targetId),
    onSuccess: (_, targetId) => {
      // Optimistic cache update
      const toggleFollowing = (oldData: any) => {
        if (!oldData) return oldData;
        return oldData.map((u: any) =>
          u._id === targetId ? { ...u, isFollowing: true } : u
        );
      };
      qc.setQueriesData({ queryKey: ["user-followers", userId] }, toggleFollowing);
      qc.setQueriesData({ queryKey: ["user-following", userId] }, toggleFollowing);
      qc.setQueriesData({ queryKey: ["search-followers", debouncedSearch] }, toggleFollowing);

      qc.invalidateQueries({ queryKey: ["user-followers", userId] });
      qc.invalidateQueries({ queryKey: ["user-following", userId] });
      qc.invalidateQueries({ queryKey: ["search-followers"] });
      refreshUser().catch((err) => console.error(err));
    },
  });

  // Unfollow mutation
  const unfollowMutation = useMutation({
    mutationFn: (targetId: string) => userApi.unfollow(targetId),
    onSuccess: (_, targetId) => {
      // Optimistic cache update
      const filterOut = (oldData: any) => {
        if (!oldData) return oldData;
        return oldData.filter((u: any) => u._id !== targetId);
      };
      const toggleFollowing = (oldData: any) => {
        if (!oldData) return oldData;
        return oldData.map((u: any) =>
          u._id === targetId ? { ...u, isFollowing: false } : u
        );
      };

      qc.setQueriesData({ queryKey: ["user-followers", userId] }, toggleFollowing);
      qc.setQueriesData({ queryKey: ["user-following", userId] }, filterOut);
      qc.setQueriesData({ queryKey: ["search-followers", debouncedSearch] }, toggleFollowing);

      qc.invalidateQueries({ queryKey: ["user-followers", userId] });
      qc.invalidateQueries({ queryKey: ["user-following", userId] });
      qc.invalidateQueries({ queryKey: ["search-followers"] });
      refreshUser().catch((err) => console.error(err));
      
      setConfirmAction(null);
      setSelectedUserOptions(null);
      toast.success("Unfollowed successfully");
    },
  });

  // Remove follower mutation
  const removeFollowerMutation = useMutation({
    mutationFn: (targetId: string) => userApi.removeFollower(targetId),
    onSuccess: (_, targetId) => {
      // Optimistic cache update
      const filterOut = (oldData: any) => {
        if (!oldData) return oldData;
        return oldData.filter((u: any) => u._id !== targetId);
      };

      qc.setQueriesData({ queryKey: ["user-followers", userId] }, filterOut);
      qc.setQueriesData({ queryKey: ["user-following", userId] }, filterOut);
      qc.setQueriesData({ queryKey: ["search-followers", debouncedSearch] }, filterOut);

      qc.invalidateQueries({ queryKey: ["user-followers", userId] });
      qc.invalidateQueries({ queryKey: ["user-following", userId] });
      qc.invalidateQueries({ queryKey: ["search-followers"] });
      refreshUser().catch((err) => console.error(err));

      setConfirmAction(null);
      setSelectedUserOptions(null);
      toast.success("Follower removed");
    },
  });

  // Block User mutation
  const blockMutation = useMutation({
    mutationFn: (targetId: string) => userApi.block(targetId),
    onSuccess: (_, targetId) => {
      const toggleBlocked = (oldData: any) => {
        if (!oldData) return oldData;
        return oldData.map((u: any) =>
          u._id === targetId ? { ...u, isBlocked: true } : u
        );
      };
      qc.setQueriesData({ queryKey: ["user-followers", userId] }, toggleBlocked);
      qc.setQueriesData({ queryKey: ["user-following", userId] }, toggleBlocked);
      qc.setQueriesData({ queryKey: ["search-followers", debouncedSearch] }, toggleBlocked);

      qc.invalidateQueries({ queryKey: ["user-followers", userId] });
      qc.invalidateQueries({ queryKey: ["user-following", userId] });
      qc.invalidateQueries({ queryKey: ["search-followers"] });

      setSelectedUserOptions(null);
      toast.success("User blocked");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Unblock User mutation
  const unblockMutation = useMutation({
    mutationFn: (targetId: string) => userApi.unblock(targetId),
    onSuccess: (_, targetId) => {
      const toggleBlocked = (oldData: any) => {
        if (!oldData) return oldData;
        return oldData.map((u: any) =>
          u._id === targetId ? { ...u, isBlocked: false } : u
        );
      };
      qc.setQueriesData({ queryKey: ["user-followers", userId] }, toggleBlocked);
      qc.setQueriesData({ queryKey: ["user-following", userId] }, toggleBlocked);
      qc.setQueriesData({ queryKey: ["search-followers", debouncedSearch] }, toggleBlocked);

      qc.invalidateQueries({ queryKey: ["user-followers", userId] });
      qc.invalidateQueries({ queryKey: ["user-following", userId] });
      qc.invalidateQueries({ queryKey: ["search-followers"] });

      setSelectedUserOptions(null);
      toast.success("User unblocked");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Mute User mutation
  const muteMutation = useMutation({
    mutationFn: (targetId: string) => userApi.mute(targetId),
    onSuccess: (_, targetId) => {
      const toggleMuted = (oldData: any) => {
        if (!oldData) return oldData;
        return oldData.map((u: any) =>
          u._id === targetId ? { ...u, isMuted: true } : u
        );
      };
      qc.setQueriesData({ queryKey: ["user-followers", userId] }, toggleMuted);
      qc.setQueriesData({ queryKey: ["user-following", userId] }, toggleMuted);
      qc.setQueriesData({ queryKey: ["search-followers", debouncedSearch] }, toggleMuted);

      qc.invalidateQueries({ queryKey: ["user-followers", userId] });
      qc.invalidateQueries({ queryKey: ["user-following", userId] });
      qc.invalidateQueries({ queryKey: ["search-followers"] });

      setSelectedUserOptions(null);
      toast.success("User muted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Unmute User mutation
  const unmuteMutation = useMutation({
    mutationFn: (targetId: string) => userApi.unmute(targetId),
    onSuccess: (_, targetId) => {
      const toggleMuted = (oldData: any) => {
        if (!oldData) return oldData;
        return oldData.map((u: any) =>
          u._id === targetId ? { ...u, isMuted: false } : u
        );
      };
      qc.setQueriesData({ queryKey: ["user-followers", userId] }, toggleMuted);
      qc.setQueriesData({ queryKey: ["user-following", userId] }, toggleMuted);
      qc.setQueriesData({ queryKey: ["search-followers", debouncedSearch] }, toggleMuted);

      qc.invalidateQueries({ queryKey: ["user-followers", userId] });
      qc.invalidateQueries({ queryKey: ["user-following", userId] });
      qc.invalidateQueries({ queryKey: ["search-followers"] });

      setSelectedUserOptions(null);
      toast.success("User unmuted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleFollowClick = (u: FollowUser) => {
    followMutation.mutate(u._id);
  };

  const handleUnfollowConfirm = () => {
    if (confirmAction && confirmAction.type === "unfollow") {
      unfollowMutation.mutate(confirmAction.user._id);
    }
  };

  const handleRemoveConfirm = () => {
    if (confirmAction && confirmAction.type === "remove_follower") {
      removeFollowerMutation.mutate(confirmAction.user._id);
    }
  };

  const handleMessageClick = async (targetUser: FollowUser) => {
    try {
      await messagesApi.getOrCreateConversation(targetUser._id);
      onClose();
      navigate({ to: "/messages" });
    } catch (err) {
      toast.error("Failed to start chat");
    }
  };

  const memoizedUsers = useMemo(() => users, [users]);

  const renderUserRow = (u: FollowUser) => {
    const isSelf = u._id === currentUser?._id;
    const isPendingFollow = followMutation.isPending && followMutation.variables === u._id;
    const isPendingUnfollow = unfollowMutation.isPending && unfollowMutation.variables === u._id;
    const isPending = isPendingFollow || isPendingUnfollow;

    return (
      <div
        key={u._id}
        className="flex items-center justify-between px-4 py-2 hover:bg-secondary/20 active:bg-secondary/40 transition-colors duration-150 h-[62px]"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            onClick={() => {
              if (u.username) {
                navigate({ to: "/profile/$username", params: { username: u.username } });
              } else {
                navigate({ to: "/profile/$username", params: { username: u._id } });
              }
              onClose();
            }}
            className="shrink-0 hover:opacity-90 transition-opacity cursor-pointer"
          >
            <img
              src={u.profilePicture}
              alt={u.username}
              className="size-11 rounded-full object-cover ring-1 ring-border"
            />
          </div>
          <div className="min-w-0 flex flex-col justify-center">
            <div
              onClick={() => {
                if (u.username) {
                  navigate({ to: "/profile/$username", params: { username: u.username } });
                } else {
                  navigate({ to: "/profile/$username", params: { username: u._id } });
                }
                onClose();
              }}
              className="text-sm font-semibold text-foreground truncate flex items-center hover:underline leading-snug cursor-pointer"
            >
              {u.username}
              {u.isVerified && (
                <span
                  title="Verified Account"
                  className="inline-flex items-center justify-center size-3.5 rounded-full bg-sky-500 text-white ml-1.5 shrink-0"
                >
                  <Check className="size-2.5 stroke-[4]" />
                </span>
              )}
            </div>
            <span className="text-xs text-muted-foreground truncate leading-normal">
              {u.fullName || u.username}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-4">
          {!isSelf && (
            <div>
              {u.isFollowing ? (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => setConfirmAction({ type: "unfollow", user: u })}
                  className="px-4 h-8 rounded-lg text-xs font-semibold bg-secondary text-foreground hover:bg-secondary/80 border border-border transition-colors disabled:opacity-60"
                >
                  Following
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleFollowClick(u)}
                  className="px-4 h-8 rounded-lg text-xs font-semibold bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white transition-colors disabled:opacity-60"
                >
                  {isPending ? "Following..." : title === "Followers" ? "Follow Back" : "Follow"}
                </button>
              )}
            </div>
          )}

          {/* Three Dot Options Button */}
          {!isSelf && (
            <button
              type="button"
              onClick={() => setSelectedUserOptions(u)}
              className="size-8 rounded-full hover:bg-secondary/80 flex items-center justify-center text-foreground transition-colors"
              aria-label="Options"
            >
              <MoreHorizontal className="size-4" />
            </button>
          )}
        </div>
      </div>
    );
  };

  const isActionPending =
    blockMutation.isPending ||
    unblockMutation.isPending ||
    muteMutation.isPending ||
    unmuteMutation.isPending;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm grid place-items-center p-4 animate-fade-in"
        onClick={onClose}
      >
        <div
          className="w-full max-w-[420px] max-h-[80vh] overflow-hidden rounded-[16px] border border-border bg-background shadow-[var(--shadow-lift)] flex flex-col animate-scale-in"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-4 py-3.5 border-b border-border flex items-center justify-between relative">
            <div className="w-8" />
            <h2 className="text-[16px] font-semibold text-foreground tracking-tight">{title}</h2>
            <button
              onClick={onClose}
              className="text-foreground hover:opacity-70 transition-opacity p-1"
              aria-label="Close"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Sticky Search bar */}
          <div className="p-3 bg-background border-b border-border">
            <div className="relative flex items-center bg-secondary/60 dark:bg-secondary/40 rounded-lg px-3 py-1.5">
              <Search className="size-4 text-muted-foreground mr-2 shrink-0" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search"
                className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/85"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="text-muted-foreground hover:text-foreground shrink-0"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
          </div>

          {/* Scrollable list */}
          <div className="flex-1 overflow-hidden min-h-[340px] max-h-[380px] flex flex-col justify-start">
            {isLoading ? (
              <div className="divide-y divide-transparent">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <UserRowSkeleton key={idx} />
                ))}
              </div>
            ) : memoizedUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                <p className="text-sm text-muted-foreground font-medium">
                  {isSearching ? "No users found." : `No ${title.toLowerCase()} yet.`}
                </p>
              </div>
            ) : memoizedUsers.length > 500 ? (
              <VirtualizedList
                items={memoizedUsers}
                itemHeight={62}
                renderItem={renderUserRow}
                className="divide-y divide-transparent"
              />
            ) : (
              <div className="overflow-y-auto max-h-[380px] divide-y divide-transparent no-scrollbar">
                {memoizedUsers.map(renderUserRow)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Options Dropdown/Sheet Menu */}
      {selectedUserOptions && (
        <UserActionsOverlay
          user={selectedUserOptions}
          title={title}
          onClose={() => setSelectedUserOptions(null)}
          onUnfollowClick={() => {
            setConfirmAction({ type: "unfollow", user: selectedUserOptions });
            setSelectedUserOptions(null);
          }}
          onRemoveClick={() => {
            setConfirmAction({ type: "remove_follower", user: selectedUserOptions });
            setSelectedUserOptions(null);
          }}
          onMuteClick={() =>
            selectedUserOptions.isMuted
              ? unmuteMutation.mutate(selectedUserOptions._id)
              : muteMutation.mutate(selectedUserOptions._id)
          }
          onBlockClick={() =>
            selectedUserOptions.isBlocked
              ? unblockMutation.mutate(selectedUserOptions._id)
              : blockMutation.mutate(selectedUserOptions._id)
          }
          onMessageClick={() => handleMessageClick(selectedUserOptions)}
          isActionPending={isActionPending}
        />
      )}

      {/* Unfollow / Remove Follower Confirmation Dialog */}
      {confirmAction && (
        <ConfirmationModal
          type={confirmAction.type}
          user={confirmAction.user}
          onClose={() => setConfirmAction(null)}
          onConfirm={confirmAction.type === "unfollow" ? handleUnfollowConfirm : handleRemoveConfirm}
          loading={unfollowMutation.isPending || removeFollowerMutation.isPending}
        />
      )}
    </>
  );
}
