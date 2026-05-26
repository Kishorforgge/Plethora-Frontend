export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
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

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
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

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
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
}

export const postsApi = {
  following: (params?: { page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set("page", String(params.page));
    if (params?.limit) q.set("limit", String(params.limit));
    const qs = q.toString();
    return apiFetch<ApiPost[]>(`/api/posts/following${qs ? `?${qs}` : ""}`);
  },

  list: (params?: { page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set("page", String(params.page));
    if (params?.limit) q.set("limit", String(params.limit));
    const qs = q.toString();
    return apiFetch<ApiPost[]>(`/api/posts${qs ? `?${qs}` : ""}`);
  },

  myUploads: () => apiFetch<ApiPost[]>("/api/posts/me/uploads"),
  mySaved: () => apiFetch<ApiPost[]>("/api/posts/me/saved"),
  myLiked: () => apiFetch<ApiPost[]>("/api/posts/me/liked"),

  upload: (file: File, caption: string, tags: string) => {
    const form = new FormData();
    form.append("image", file);
    form.append("caption", caption);
    form.append("tags", tags);
    return apiFetch<ApiPost>("/api/posts/upload", { method: "POST", body: form });
  },

  like: (id: string) => apiFetch<{ likesCount: number }>(`/api/posts/${id}/like`, { method: "POST" }),
  unlike: (id: string) => apiFetch<{ likesCount: number }>(`/api/posts/${id}/unlike`, { method: "POST" }),
  bookmark: (id: string) => apiFetch<null>(`/api/posts/${id}/bookmark`, { method: "POST" }),
  unbookmark: (id: string) => apiFetch<null>(`/api/posts/${id}/unbookmark`, { method: "POST" }),
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
  list: () => apiFetch<ApiConversation[]>("/api/discussions"),

  create: (body: { participantIds: string[]; title?: string; initialMessage?: string }) =>
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
};
