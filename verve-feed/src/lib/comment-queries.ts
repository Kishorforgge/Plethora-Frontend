import type { QueryClient } from "@tanstack/react-query";

export const commentQueryKeys = {
  byPost: (postId: string) => ["comments", postId] as const,
};

export function invalidateCommentCaches(qc: QueryClient, postId: string) {
  qc.invalidateQueries({ queryKey: commentQueryKeys.byPost(postId) });
  qc.invalidateQueries({ queryKey: ["following-feed"] });
  qc.invalidateQueries({ queryKey: ["discover-feed"] });
  qc.invalidateQueries({ queryKey: ["explore-posts"] });
  qc.invalidateQueries({ queryKey: ["related-posts", postId] });
  qc.invalidateQueries({ queryKey: ["my-uploads"] });
  qc.invalidateQueries({ queryKey: ["my-saved"] });
  qc.invalidateQueries({ queryKey: ["my-liked"] });
  qc.invalidateQueries({ queryKey: ["notifications"] });
}
