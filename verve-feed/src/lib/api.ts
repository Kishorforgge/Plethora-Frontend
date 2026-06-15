const rawApiUrl = import.meta.env.VITE_API_URL?.trim();
const defaultHost = import.meta.env.DEV
  ? "http://localhost:5000"
  : "https://plethora-p5ei.onrender.com";

export const API_URL = rawApiUrl
  ? rawApiUrl.replace(/\/$/, "")
  : `${defaultHost}/api`;

export const BACKEND_HOST = rawApiUrl
  ? rawApiUrl.replace(/\/api\/?$/, "")
  : defaultHost;

export const TOKEN_KEY = "plethora_token";

export interface ApiUser {
  _id: string;
  username: string;
  email: string;
  fullName: string;
  bio: string;
  profilePicture: string;
  followersCount: number;
  followingCount: number;
  token?: string;
}

interface ApiResponse<T> {
  status: string;
  data: T;
  message?: string;
  errors?: string[];
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function getCookie(name: string): string | null {
  if (typeof window === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]*)"));
  return match ? decodeURIComponent(match[2]) : null;
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem(TOKEN_KEY) || getCookie(TOKEN_KEY);
  if (token && !localStorage.getItem(TOKEN_KEY)) {
    localStorage.setItem(TOKEN_KEY, token);
  }
  return token;
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
    document.cookie = `${TOKEN_KEY}=${encodeURIComponent(token)}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
  } else {
    localStorage.removeItem(TOKEN_KEY);
    document.cookie = `${TOKEN_KEY}=; path=/; max-age=0; SameSite=Lax`;
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers);

  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    ...options,
    headers,
  });
  const json = (await res.json().catch(() => ({}))) as ApiResponse<T> & {
    message?: string;
    errors?: string[];
  };

  if (!res.ok) {
    const msg =
      json.message ||
      (Array.isArray(json.errors) ? json.errors[0] : undefined) ||
      "Request failed";
    throw new ApiError(msg, res.status);
  }

  return json.data;
}

export const authApi = {
  register: (body: { username: string; email: string; password: string; fullName: string }) =>
    apiFetch<ApiUser>("/api/auth/register", { method: "POST", body: JSON.stringify(body) }),

  login: (body: { email: string; password: string }) =>
    apiFetch<ApiUser>("/api/auth/login", { method: "POST", body: JSON.stringify(body) }),

  logout: () => apiFetch<null>("/api/auth/logout", { method: "POST" }),

  me: () => apiFetch<ApiUser & { bookmarks?: string[] }>("/api/auth/me"),
};

export const userApi = {
  updateProfile: (body: { fullName?: string; bio?: string }) =>
    apiFetch<ApiUser>("/api/users/profile", { method: "PUT", body: JSON.stringify(body) }),

  updateProfilePicture: (file: File) => {
    const form = new FormData();
    form.append("image", file);
    return apiFetch<{ profilePicture: string }>("/api/users/profile-picture", {
      method: "PUT",
      body: form,
    });
  },

  search: (q: string) =>
    apiFetch<
      Array<{
        _id: string;
        username: string;
        fullName: string;
        profilePicture: string;
        followersCount: number;
        isFollowing?: boolean;
      }>
    >(`/api/users/search?q=${encodeURIComponent(q)}`),

  suggested: () =>
    apiFetch<
      Array<{
        _id: string;
        username: string;
        fullName: string;
        profilePicture: string;
        bio?: string;
        followersCount: number;
        isFollowing: boolean;
      }>
    >("/api/users/suggested"),

  getByUsername: (username: string) =>
    apiFetch<{
      _id: string;
      username: string;
      fullName: string;
      bio: string;
      profilePicture: string;
      followersCount: number;
      followingCount: number;
      isFollowing: boolean;
    }>(`/api/users/${encodeURIComponent(username)}`),

  getUserProfile: (username: string) =>
    apiFetch<{
      _id: string;
      username: string;
      fullName: string;
      bio: string;
      profilePicture: string;
      followersCount: number;
      followingCount: number;
      postsCount: number;
      isFollowing: boolean;
      createdAt: string;
    }>(`/api/users/profile/${encodeURIComponent(username)}`),

  follow: (userId: string) =>
    apiFetch<null>(`/api/users/${userId}/follow`, { method: "POST" }),

  unfollow: (userId: string) =>
    apiFetch<null>(`/api/users/${userId}/unfollow`, { method: "POST" }),

  myFollowers: () =>
    apiFetch<
      Array<{
        _id: string;
        username: string;
        fullName: string;
        profilePicture: string;
      }>
    >("/api/users/me/followers"),

  myFollowing: () =>
    apiFetch<
      Array<{
        _id: string;
        username: string;
        fullName: string;
        profilePicture: string;
      }>
    >("/api/users/me/following"),

  followers: () =>
    apiFetch<
      Array<{
        _id: string;
        username: string;
        fullName: string;
        profilePicture: string;
      }>
    >("/api/users/followers"),

  following: () =>
    apiFetch<
      Array<{
        _id: string;
        username: string;
        fullName: string;
        profilePicture: string;
      }>
    >("/api/users/following"),

  getUserFollowers: (userId: string) =>
    apiFetch<
      Array<{
        _id: string;
        username: string;
        fullName: string;
        profilePicture: string;
        isVerified: boolean;
        isFollowing: boolean;
        isBlocked: boolean;
        isMuted: boolean;
      }>
    >(`/api/users/${encodeURIComponent(userId)}/followers`),

  getUserFollowing: (userId: string) =>
    apiFetch<
      Array<{
        _id: string;
        username: string;
        fullName: string;
        profilePicture: string;
        isVerified: boolean;
        isFollowing: boolean;
        isBlocked: boolean;
        isMuted: boolean;
      }>
    >(`/api/users/${encodeURIComponent(userId)}/following`),

  searchFollowers: (query: string) =>
    apiFetch<
      Array<{
        _id: string;
        username: string;
        fullName: string;
        profilePicture: string;
        isVerified: boolean;
        isFollowing: boolean;
        isBlocked: boolean;
        isMuted: boolean;
      }>
    >(`/api/users/search-followers?q=${encodeURIComponent(query)}`),

  removeFollower: (userId: string) =>
    apiFetch<null>(`/api/users/${encodeURIComponent(userId)}/remove-follower`, { method: "POST" }),

  block: (userId: string) =>
    apiFetch<{ success: boolean; isBlocked: boolean }>(`/api/users/${encodeURIComponent(userId)}/block`, { method: "POST" }),

  unblock: (userId: string) =>
    apiFetch<{ success: boolean; isBlocked: boolean }>(`/api/users/${encodeURIComponent(userId)}/unblock`, { method: "POST" }),

  mute: (userId: string) =>
    apiFetch<{ success: boolean; isMuted: boolean }>(`/api/users/${encodeURIComponent(userId)}/mute`, { method: "POST" }),

  unmute: (userId: string) =>
    apiFetch<{ success: boolean; isMuted: boolean }>(`/api/users/${encodeURIComponent(userId)}/unmute`, { method: "POST" }),
};

export interface ApiPost {
  _id: string;
  imageUrl: string;
  caption: string;
  tags: string[];
  likesCount: number;
  commentsCount: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
  user: {
    _id: string;
    username: string;
    fullName: string;
    profilePicture: string;
  };
  createdAt: string;
  category?: string;
}

export const postsApi = {
  following: (params?: { page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set("page", String(params.page));
    if (params?.limit) q.set("limit", String(params.limit));
    const qs = q.toString();
    return apiFetch<ApiPost[]>(`/api/posts/following${qs ? `?${qs}` : ""}`);
  },

  list: (params?: { page?: number; limit?: number; q?: string; tag?: string; category?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.limit) searchParams.set("limit", String(params.limit));
    if (params?.q) searchParams.set("q", params.q);
    if (params?.tag) searchParams.set("tag", params.tag);
    if (params?.category) searchParams.set("category", params.category);
    const qs = searchParams.toString();
    return apiFetch<ApiPost[]>(`/api/posts${qs ? `?${qs}` : ""}`);
  },

  myUploads: () => apiFetch<ApiPost[]>("/api/posts/me/uploads"),
  mySaved: () => apiFetch<ApiPost[]>("/api/posts/me/saved"),
  myLiked: () => apiFetch<ApiPost[]>("/api/posts/me/liked"),
  userUploads: (userId: string) =>
    apiFetch<ApiPost[]>(`/api/posts/user/${encodeURIComponent(userId)}/uploads`),

  upload: (file: File, caption: string, tags: string, category?: string) => {
    const form = new FormData();
    form.append("image", file);
    form.append("caption", caption);
    form.append("tags", tags);
    if (category) {
      form.append("category", category);
    }
    return apiFetch<ApiPost>("/api/posts/upload", { method: "POST", body: form });
  },

  like: (id: string) => apiFetch<{ likesCount: number }>(`/api/posts/${id}/like`, { method: "POST" }),
  unlike: (id: string) => apiFetch<{ likesCount: number }>(`/api/posts/${id}/unlike`, { method: "POST" }),
  bookmark: (id: string) => apiFetch<null>(`/api/posts/${id}/bookmark`, { method: "POST" }),
  unbookmark: (id: string) => apiFetch<null>(`/api/posts/${id}/unbookmark`, { method: "POST" }),
  delete: (id: string) => apiFetch<null>(`/api/posts/${id}`, { method: "DELETE" }),
  getPostById: (id: string) => apiFetch<ApiPost>(`/api/posts/${id}`),
};

export interface ApiComment {
  _id: string;
  postId: string;
  userId: string;
  username: string;
  profilePicture: string;
  text: string;
  createdAt: string;
}

export const commentsApi = {
  getByPost: (postId: string, params?: { page?: number; limit?: number }) => {
    const search = new URLSearchParams();
    if (params?.page) search.set("page", String(params.page));
    if (params?.limit) search.set("limit", String(params.limit));
    const qs = search.toString();
    return apiFetch<ApiComment[]>(`/api/comments/${postId}${qs ? `?${qs}` : ""}`);
  },
  add: (postId: string, text: string) =>
    apiFetch<ApiComment>(`/api/comments/${postId}`, {
      method: "POST",
      body: JSON.stringify({ text }),
    }),
  update: (commentId: string, text: string) =>
    apiFetch<ApiComment>(`/api/comments/${commentId}`, {
      method: "PUT",
      body: JSON.stringify({ text }),
    }),
  delete: (commentId: string) =>
    apiFetch<null>(`/api/comments/${commentId}`, { method: "DELETE" }),
};

export interface ApiConversation {
  _id: string;
  title: string;
  otherParticipants: Array<{
    _id: string;
    username: string;
    fullName: string;
    profilePicture: string;
  }>;
  lastMessage?: { text: string; createdAt: string };
  lastMessageAt: string;
}

export interface ApiMessage {
  _id: string;
  text: string;
  createdAt: string;
  sender: {
    _id: string;
    username: string;
    fullName: string;
    profilePicture: string;
  };
  edited?: boolean;
}

export interface ApiNotification {
  _id: string;
  type: "like" | "comment" | "follow" | "new_post";
  isRead: boolean;
  createdAt: string;
  sender: {
    _id: string;
    username: string;
    fullName: string;
    profilePicture: string;
  };
  post?: { _id: string; imageUrl: string };
  comment?: { text: string };
}

export const notificationsApi = {
  list: () => apiFetch<ApiNotification[]>("/api/notifications"),
  markAllRead: () => apiFetch<null>("/api/notifications/mark-read", { method: "PUT" }),
};

export const discussionsApi = {
  list: (type?: "public" | "private") =>
    apiFetch<ApiConversation[]>(`/api/discussions${type ? `?type=${type}` : ""}`),

  create: (body: {
    participantIds?: string[];
    title?: string;
    initialMessage?: string;
    isPublic?: boolean;
  }) =>
    apiFetch<ApiConversation>("/api/discussions", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  messages: (id: string) =>
    apiFetch<{ conversation: ApiConversation; messages: ApiMessage[] }>(
      `/api/discussions/${id}/messages`
    ),

  send: (id: string, text: string) =>
    apiFetch<ApiMessage>(`/api/discussions/${id}/messages`, {
      method: "POST",
      body: JSON.stringify({ text }),
    }),

  editMessage: (messageId: string, text: string) =>
    apiFetch<ApiMessage>(`/api/discussions/messages/${messageId}`, {
      method: "PATCH",
      body: JSON.stringify({ text }),
    }),

  deleteMessage: (messageId: string) =>
    apiFetch<null>(`/api/discussions/messages/${messageId}`, {
      method: "DELETE",
    }),
};

export interface DirectChatUser {
  _id: string;
  userId: string;
  username: string;
  profilePicture: string;
  isOnline: boolean;
  lastMessage: string;
  unreadCount: number;
}

export const messagesApi = {
  conversations: () =>
    apiFetch<DirectChatUser[]>("/api/messages/conversations"),

  getOrCreateConversation: (targetUserId: string) =>
    apiFetch<ApiConversation>("/api/messages/conversation", {
      method: "POST",
      body: JSON.stringify({ targetUserId }),
    }),

  markAsRead: (id: string) =>
    apiFetch<null>(`/api/messages/conversations/${id}/read`, {
      method: "PUT",
    }),
};
