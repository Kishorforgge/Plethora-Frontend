import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { userApi } from "@/lib/api";
import { useAuth } from "@/components/auth-provider";

export interface CreatorCardUser {
  _id: string;
  username: string;
  fullName: string;
  profilePicture: string;
  followersCount?: number;
  isFollowing?: boolean;
}

export function CreatorCard({ creator }: { creator: CreatorCardUser }) {
  const { refreshUser } = useAuth();
  const qc = useQueryClient();
  const [following, setFollowing] = useState(creator.isFollowing ?? false);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    setLoading(true);
    try {
      if (following) {
        await userApi.unfollow(creator._id);
        setFollowing(false);
        toast.success(`Unfollowed @${creator.username}`);
      } else {
        await userApi.follow(creator._id);
        setFollowing(true);
        toast.success(`Following @${creator.username}`);
      }
      await refreshUser();
      qc.invalidateQueries({ queryKey: ["following-feed"] });
      qc.invalidateQueries({ queryKey: ["suggested-creators"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update follow");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="shrink-0 w-44 bg-surface rounded-2xl p-4 border border-border hover:-translate-y-1 hover:shadow-[var(--shadow-soft)] transition-all">
      <img
        src={creator.profilePicture}
        alt={creator.fullName || creator.username}
        className="size-12 rounded-full object-cover mb-3"
      />
      <p className="text-sm font-medium truncate">{creator.fullName || creator.username}</p>
      <p className="text-[11px] text-muted-foreground truncate mb-1">@{creator.username}</p>
      {creator.followersCount !== undefined && (
        <p className="text-[10px] text-muted-foreground mb-3">
          {creator.followersCount.toLocaleString()} followers
        </p>
      )}
      <button
        type="button"
        disabled={loading}
        onClick={toggle}
        className={`w-full h-8 rounded-full text-xs font-medium transition-colors disabled:opacity-60 ${
          following
            ? "border border-border bg-transparent hover:bg-secondary"
            : "bg-foreground text-background"
        }`}
      >
        {loading ? "…" : following ? "Following" : "Follow"}
      </button>
    </div>
  );
}
