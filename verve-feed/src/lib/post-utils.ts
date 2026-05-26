import type { Post } from "@/lib/mock-data";
import type { ApiPost } from "@/lib/api";

export function mapApiPostToDisplay(post: ApiPost): Post {
  const creator = post.user;
  return {
    id: post._id,
    image: post.imageUrl,
    width: 800,
    height: 1000,
    title: post.caption?.slice(0, 80) || "Untitled",
    caption: post.caption,
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
  };
}
