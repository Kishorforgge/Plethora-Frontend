import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2, X, Check } from "lucide-react";
import { toast } from "sonner";
import { commentsApi, type ApiComment } from "@/lib/api";
import { commentQueryKeys, invalidateCommentCaches } from "@/lib/comment-queries";
import { useAuth } from "@/components/auth-provider";

interface Props {
  postId: string;
  onCommentCountChange: Dispatch<SetStateAction<number>>;
}

function formatDate(dateStr: string) {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return dateStr;
  }
}

export function CommentSection({ postId, onCommentCountChange }: Props) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");

  const { data: comments = [], isLoading, isSuccess } = useQuery({
    queryKey: commentQueryKeys.byPost(postId),
    queryFn: () => commentsApi.getByPost(postId, { limit: 100 }),
  });

  useEffect(() => {
    if (isSuccess) {
      onCommentCountChange((prev) => Math.max(prev, comments.length));
    }
  }, [isSuccess, comments.length, onCommentCountChange]);

  const addMutation = useMutation({
    mutationFn: (text: string) => commentsApi.add(postId, text),
    onMutate: async (text) => {
      await qc.cancelQueries({ queryKey: commentQueryKeys.byPost(postId) });
      const previous = qc.getQueryData<ApiComment[]>(commentQueryKeys.byPost(postId));
      const optimistic: ApiComment = {
        _id: `temp-${Date.now()}`,
        postId,
        userId: user!._id,
        username: user!.username,
        profilePicture: user!.profilePicture,
        text,
        createdAt: new Date().toISOString(),
      };
      qc.setQueryData<ApiComment[]>(commentQueryKeys.byPost(postId), (old = []) => [optimistic, ...old]);
      onCommentCountChange((c) => c + 1);
      setDraft("");
      return { previous };
    },
    onSuccess: () => {
      invalidateCommentCaches(qc, postId);
      toast.success("Comment added");
    },
    onError: (_err, _text, context) => {
      if (context?.previous) {
        qc.setQueryData(commentQueryKeys.byPost(postId), context.previous);
      }
      onCommentCountChange((c) => Math.max(0, c - 1));
      toast.error("Could not add comment.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ commentId, text }: { commentId: string; text: string }) =>
      commentsApi.update(commentId, text),
    onSuccess: () => {
      setEditingId(null);
      setEditDraft("");
      invalidateCommentCaches(qc, postId);
      toast.success("Comment updated");
    },
    onError: () => toast.error("Could not update comment."),
  });

  const deleteMutation = useMutation({
    mutationFn: (commentId: string) => commentsApi.delete(commentId),
    onMutate: async (commentId) => {
      await qc.cancelQueries({ queryKey: commentQueryKeys.byPost(postId) });
      const previous = qc.getQueryData<ApiComment[]>(commentQueryKeys.byPost(postId));
      qc.setQueryData<ApiComment[]>(
        commentQueryKeys.byPost(postId),
        (old = []) => old.filter((c) => c._id !== commentId)
      );
      onCommentCountChange((c) => Math.max(0, c - 1));
      return { previous };
    },
    onSuccess: () => {
      invalidateCommentCaches(qc, postId);
      toast.success("Comment deleted");
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        qc.setQueryData(commentQueryKeys.byPost(postId), context.previous);
      }
      onCommentCountChange((c) => c + 1);
      toast.error("Could not delete comment.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please sign in to comment.");
      return;
    }
    if (!draft.trim()) return;
    addMutation.mutate(draft.trim());
  };

  const startEdit = (comment: ApiComment) => {
    setEditingId(comment._id);
    setEditDraft(comment.text);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDraft("");
  };

  const saveEdit = (commentId: string) => {
    if (!editDraft.trim()) return;
    updateMutation.mutate({ commentId, text: editDraft.trim() });
  };

  return (
    <>
      <h2 className="text-sm font-mono uppercase tracking-widest text-muted-foreground mb-4">Comments</h2>
      <div className="flex-1 space-y-4 mb-4 max-h-[30vh] overflow-y-auto pr-1">
        {isLoading ? (
          <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider animate-pulse">Loading comments…</p>
        ) : comments.length === 0 ? (
          <p className="text-sm text-muted-foreground">Be the first to leave a quiet word.</p>
        ) : (
          comments.map((c) => {
            const isOwner = user?._id === c.userId;
            const isEditing = editingId === c._id;

            return (
              <div key={c._id} className="flex gap-3 group">
                <img
                  src={c.profilePicture}
                  className="size-8 rounded-full object-cover shrink-0"
                  alt={c.username}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs">
                      <span className="font-semibold">@{c.username}</span>
                      <span className="text-muted-foreground ml-1">{formatDate(c.createdAt)}</span>
                    </p>
                    {isOwner && !isEditing && (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => startEdit(c)}
                          aria-label="Edit comment"
                          className="size-6 rounded-full grid place-items-center hover:bg-secondary transition-colors"
                        >
                          <Pencil className="size-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteMutation.mutate(c._id)}
                          disabled={deleteMutation.isPending}
                          aria-label="Delete comment"
                          className="size-6 rounded-full grid place-items-center hover:bg-secondary transition-colors text-red-500"
                        >
                          <Trash2 className="size-3" />
                        </button>
                      </div>
                    )}
                  </div>
                  {isEditing ? (
                    <div className="mt-1 flex gap-2">
                      <input
                        value={editDraft}
                        onChange={(e) => setEditDraft(e.target.value)}
                        className="flex-1 h-9 px-3 rounded-full border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                      <button
                        type="button"
                        onClick={() => saveEdit(c._id)}
                        disabled={updateMutation.isPending || !editDraft.trim()}
                        className="size-9 rounded-full grid place-items-center bg-foreground text-background"
                      >
                        <Check className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="size-9 rounded-full grid place-items-center hover:bg-secondary"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm text-foreground/90 mt-0.5">{c.text}</p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 mt-auto">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={user ? "Add a comment…" : "Sign in to leave a comment"}
          disabled={!user || addMutation.isPending}
          className="flex-1 h-11 px-4 rounded-full border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring text-sm disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!user || !draft.trim() || addMutation.isPending}
          className="px-5 h-11 rounded-full bg-foreground text-background text-sm font-medium hover:scale-[1.02] active:scale-95 transition-transform disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </>
  );
}
