import type { Post } from "@/lib/mock-data";
import type { ApiPost } from "@/lib/api";

export function mapApiPostToDisplay(post: ApiPost): Post {
  const creator = post.user;
  
  const hasSeparator = post.caption?.includes(" — ");
  const title = hasSeparator 
    ? post.caption.split(" — ")[0] 
    : (post.caption?.slice(0, 50) || "Untitled");
  const caption = hasSeparator 
    ? post.caption.split(" — ")[1] 
    : post.caption;

  return {
    id: post._id,
    image: post.imageUrl,
    width: 800,
    height: 1000,
    title,
    caption,
    tags: post.tags || [],
    creator: {
      id: creator._id,
      username: creator.username,
      name: creator.fullName || creator.username,
      avatar: creator.profilePicture,
      followers: 0,
      following: 0,
      posts: 0,
    },
    likes: post.likesCount ?? 0,
    comments: post.commentsCount ?? 0,
    saved: post.isBookmarked ?? false,
    liked: post.isLiked ?? false,
    category: post.category,
  };
}
