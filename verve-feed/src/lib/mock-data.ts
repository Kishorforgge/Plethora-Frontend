// Mock data sourced from Unsplash (public CDN, no API key required).
// Using fixed image IDs ensures stable masonry layouts across reloads.

export interface Creator {
  id: string;
  username: string;
  name: string;
  avatar: string;
  bio?: string;
  followers: number;
  following: number;
  posts: number;
}

export interface Post {
  id: string;
  image: string;
  width: number;
  height: number;
  title: string;
  caption?: string;
  tags: string[];
  creator: Creator;
  likes: number;
  comments: number;
  saved: boolean;
  liked?: boolean;
  category?: string;
}

export interface Comment {
  id: string;
  author: Creator;
  text: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  type: "like" | "comment" | "follow" | "save";
  actor: Creator;
  postImage?: string;
  text: string;
  time: string;
  read: boolean;
}

const u = (id: string, w = 800) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

const creators: Creator[] = [
  { id: "c1", username: "elena.rossi", name: "Elena Rossi", avatar: u("1494790108377-be9c29b29330", 200), bio: "Architect. Light archivist.", followers: 12400, following: 312, posts: 184 },
  { id: "c2", username: "marcus.chen", name: "Marcus Chen", avatar: u("1500648767791-00dcc994a43e", 200), bio: "Spatial design & quiet objects.", followers: 8920, following: 188, posts: 92 },
  { id: "c3", username: "ayanna.k", name: "Ayanna Kelly", avatar: u("1438761681033-6461ffad8d80", 200), bio: "Editorial photographer.", followers: 24100, following: 421, posts: 312 },
  { id: "c4", username: "ren.takeda", name: "Ren Takeda", avatar: u("1535713875002-d1d0cf377fde", 200), bio: "Minimalism is a discipline.", followers: 5400, following: 99, posts: 64 },
  { id: "c5", username: "juno.west", name: "Juno West", avatar: u("1534528741775-53994a69daeb", 200), bio: "Material studies.", followers: 31200, following: 502, posts: 428 },
  { id: "c6", username: "amir.h", name: "Amir Hassan", avatar: u("1463453091185-61582044d556", 200), bio: "Mountain documentarian.", followers: 9800, following: 220, posts: 148 },
];

const palette: Array<Omit<Post, "id" | "creator" | "saved"> & { creatorIdx: number }> = [
  { image: u("1487958449943-2429e8be8625"), width: 800, height: 1200, title: "Stairwell No. 4", caption: "Concrete, light, repetition.", tags: ["architecture", "brutalism"], likes: 1240, comments: 32, creatorIdx: 0 },
  { image: u("1493809842364-78817add7ffb"), width: 800, height: 800, title: "Folded Linen", caption: "A study in soft folds.", tags: ["textile", "study"], likes: 421, comments: 12, creatorIdx: 1 },
  { image: u("1494522855154-9297ac14b55f"), width: 800, height: 1000, title: "Morning Espresso", caption: "First light, last cup.", tags: ["object", "morning"], likes: 982, comments: 18, creatorIdx: 2 },
  { image: u("1469474968028-56623f02e42e"), width: 800, height: 1200, title: "Mountain Fog", caption: "Distance dissolving.", tags: ["landscape", "fog"], likes: 3120, comments: 64, creatorIdx: 5 },
  { image: u("1416339306562-f3d12fefd36f"), width: 800, height: 1200, title: "Forest Cathedral", tags: ["nature", "forest"], likes: 2210, comments: 41, creatorIdx: 5 },
  { image: u("1441974231531-c6227db76b6e"), width: 800, height: 1000, title: "Palm Shadow", caption: "Light writing on walls.", tags: ["light", "minimal"], likes: 1860, comments: 27, creatorIdx: 3 },
  { image: u("1518791841217-8f162f1e1131"), width: 800, height: 800, title: "Soft Companion", tags: ["nature", "warm"], likes: 4520, comments: 88, creatorIdx: 4 },
  { image: u("1502082553048-f009c37129b9"), width: 800, height: 1200, title: "Highway North", tags: ["landscape", "road"], likes: 712, comments: 9, creatorIdx: 5 },
  { image: u("1517021897933-0e0319cfbc28"), width: 800, height: 1000, title: "Garden Rooms", tags: ["nature", "garden"], likes: 654, comments: 14, creatorIdx: 0 },
  { image: u("1470071459604-3b5ec3a7fe05"), width: 800, height: 1200, title: "Fjord Quiet", tags: ["landscape", "water"], likes: 2980, comments: 53, creatorIdx: 5 },
  { image: u("1444065381814-865dc9da92c0"), width: 800, height: 800, title: "Citrus Study", tags: ["still-life", "warm"], likes: 1240, comments: 22, creatorIdx: 4 },
  { image: u("1465146344425-f00d5f5c8f07"), width: 800, height: 1000, title: "Bloom", tags: ["floral", "soft"], likes: 1920, comments: 36, creatorIdx: 2 },
  { image: u("1426604966848-d7adac402bff"), width: 800, height: 1200, title: "Glacier Edge", tags: ["landscape", "ice"], likes: 2410, comments: 47, creatorIdx: 5 },
  { image: u("1501785888041-af3ef285b470"), width: 800, height: 800, title: "Reflection Pool", tags: ["water", "minimal"], likes: 880, comments: 16, creatorIdx: 1 },
  { image: u("1472214103451-9374bd1c798e"), width: 800, height: 1100, title: "Hillside", tags: ["landscape", "warm"], likes: 1130, comments: 21, creatorIdx: 5 },
  { image: u("1500534314209-a25ddb2bd429"), width: 800, height: 1000, title: "Hidden Lake", tags: ["water", "calm"], likes: 1640, comments: 29, creatorIdx: 4 },
  { image: u("1490750967868-88aa4486c946"), width: 800, height: 1200, title: "Petal Geometry", tags: ["floral", "macro"], likes: 920, comments: 17, creatorIdx: 2 },
  { image: u("1455218873509-8097305ee378"), width: 800, height: 800, title: "Drift", tags: ["mood", "calm"], likes: 540, comments: 8, creatorIdx: 3 },
  { image: u("1418065460487-3e41a6c84dc5"), width: 800, height: 1100, title: "Coastal Line", tags: ["water", "horizon"], likes: 1810, comments: 33, creatorIdx: 5 },
  { image: u("1447752875215-b2761acb3c5d"), width: 800, height: 1200, title: "Tall Trees", tags: ["forest", "vertical"], likes: 2150, comments: 38, creatorIdx: 0 },
  { image: u("1505765050516-f72dcac9c60e"), width: 800, height: 900, title: "Wave Memory", tags: ["water", "motion"], likes: 1240, comments: 19, creatorIdx: 4 },
  { image: u("1502318217862-aa4e294ba657"), width: 800, height: 1100, title: "Tiled Geometry", tags: ["pattern", "warm"], likes: 760, comments: 11, creatorIdx: 1 },
];

export const POSTS: Post[] = palette.map((p, i) => ({
  id: `p${i + 1}`,
  image: p.image,
  width: p.width,
  height: p.height,
  title: p.title,
  caption: p.caption,
  tags: p.tags,
  likes: p.likes,
  comments: p.comments,
  creator: creators[p.creatorIdx],
  saved: false,
}));

export const CREATORS = creators;

export const CATEGORIES = [
  "All", "Architecture", "Nature", "Minimal", "Interiors", "Photography",
  "Texture", "Mood", "Editorial", "Object", "Pattern", "Light", "Gaming",
];

export const NOTIFICATIONS: Notification[] = [
  { id: "n1", type: "like", actor: creators[2], postImage: POSTS[0].image, text: "liked your post", time: "2m ago", read: false },
  { id: "n2", type: "follow", actor: creators[1], text: "started following you", time: "18m ago", read: false },
  { id: "n3", type: "comment", actor: creators[3], postImage: POSTS[3].image, text: "commented: \"Stunning composition.\"", time: "1h ago", read: false },
  { id: "n4", type: "save", actor: creators[4], postImage: POSTS[5].image, text: "saved your post to Quiet Light", time: "3h ago", read: true },
  { id: "n5", type: "like", actor: creators[5], postImage: POSTS[7].image, text: "liked your post", time: "Yesterday", read: true },
  { id: "n6", type: "follow", actor: creators[0], text: "started following you", time: "2d ago", read: true },
];

export const COMMENTS: Record<string, Comment[]> = {
  p1: [
    { id: "cm1", author: creators[2], text: "The light on this is unreal.", createdAt: "2h" },
    { id: "cm2", author: creators[4], text: "Quietly powerful.", createdAt: "5h" },
  ],
};

export const ME: Creator = {
  id: "me",
  username: "you",
  name: "Your Studio",
  avatar: u("1534528741775-53994a69daeb", 200),
  bio: "Collecting frames worth a second look.",
  followers: 1280,
  following: 142,
  posts: 24,
};

export function getPost(id: string): Post | undefined {
  return POSTS.find((p) => p.id === id);
}
export function relatedPosts(id: string, n = 8): Post[] {
  return POSTS.filter((p) => p.id !== id).slice(0, n);
}
