import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/components/auth-provider";
import { ApiConversation, ApiMessage, discussionsApi, userApi, messagesApi } from "@/lib/api";
import { requireAuth } from "@/lib/require-auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState, useMemo } from "react";
import { MessageCircle, Send, Copy, Edit3, Trash2, Search, X } from "lucide-react";
import { toast } from "sonner";
import { io, Socket } from "socket.io-client";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

export const Route = createFileRoute("/messages")({
  beforeLoad: requireAuth,
  validateSearch: (search: Record<string, unknown>): { select?: string } => {
    return {
      select: typeof search.select === "string" ? search.select : undefined,
    };
  },
  head: () => ({
    meta: [{ title: "Messages — Plethora" }],
  }),
  component: MessagesPage,
});

function MessagesPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [newMsg, setNewMsg] = useState("");

  const search = Route.useSearch() as { select?: string };
  const selectParam = search.select;

  // Sync activeId with window global for notifications suppression
  useEffect(() => {
    (window as any).__activeConversationId = activeId;
    return () => {
      (window as any).__activeConversationId = null;
    };
  }, [activeId]);

  // Set activeId from select URL search parameter
  useEffect(() => {
    if (selectParam) {
      setActiveId(selectParam);
    }
  }, [selectParam]);
  
  // Search dropdown variables
  const [searchTerm, setSearchTerm] = useState("");
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const [selectedChat, setSelectedChat] = useState<any | null>(null);

  const [editingMessage, setEditingMessage] = useState<ApiMessage | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<ApiMessage | null>(null);
  const [editMsgText, setEditMsgText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  // Socket.IO client setup
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socketUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
    const socket = io(socketUrl, {
      withCredentials: true,
      transports: ["websocket", "polling"]
    });

    socketRef.current = socket;

    if (user?._id) {
      socket.emit("join", user._id);
    }

    socket.on("user_status", ({ userId, isOnline }) => {
      // Invalidate queries so that online indicators update in real-time
      qc.invalidateQueries({ queryKey: ["conversations"] });
    });

    socket.on("new_message", (message: ApiMessage & { conversation?: string }) => {
      qc.invalidateQueries({ queryKey: ["conversations"] });
      if (message.conversation && activeId === message.conversation) {
        qc.invalidateQueries({ queryKey: ["discussion", activeId] });
        // Mark as read immediately if user has the chat open
        messagesApi.markAsRead(activeId).then(() => {
          qc.invalidateQueries({ queryKey: ["conversations"] });
        }).catch((err) => console.error(err));
      }
    });

    socket.on("conversation_created", (conv: ApiConversation) => {
      qc.invalidateQueries({ queryKey: ["conversations"] });
    });

    return () => {
      socket.disconnect();
    };
  }, [user?._id, activeId, qc]);

  // Click outside listener for search dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setShowSearchDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Mark conversations read when activeId opens
  useEffect(() => {
    if (activeId && !activeId.startsWith("temp-")) {
      messagesApi.markAsRead(activeId).then(() => {
        qc.invalidateQueries({ queryKey: ["conversations"] });
      }).catch((e) => console.error("Failed to mark messages as read:", e));
    }
  }, [activeId, qc]);

  // API Queries
  const { data: followers = [] } = useQuery({
    queryKey: ["followers"],
    queryFn: userApi.followers,
  });

  const { data: following = [] } = useQuery({
    queryKey: ["following"],
    queryFn: userApi.following,
  });

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: messagesApi.conversations,
  });

  const { data: thread } = useQuery({
    queryKey: ["discussion", activeId],
    queryFn: () => discussionsApi.messages(activeId!),
    enabled: !!activeId && !activeId.startsWith("temp-"),
  });

  // Global search for users outside followers/following when search term is provided
  const { data: searchResults = [] } = useQuery({
    queryKey: ["user-search", searchTerm],
    queryFn: () => userApi.search(searchTerm),
    enabled: searchTerm.length >= 2,
  });

  // Merge followers and following list de-duplicated
  const allUsers = useMemo(() => {
    const userMap = new Map<string, any>();

    // 1. Process followers
    followers.forEach((f) => {
      userMap.set(f._id, {
        _id: f._id,
        username: f.username,
        fullName: f.fullName,
        profilePicture: f.profilePicture,
        isOnline: false,
        lastMessage: "",
        unreadCount: 0,
        conversationId: null,
      });
    });

    // 2. Process following
    following.forEach((f) => {
      userMap.set(f._id, {
        _id: f._id,
        username: f.username,
        fullName: f.fullName,
        profilePicture: f.profilePicture,
        isOnline: false,
        lastMessage: "",
        unreadCount: 0,
        conversationId: null,
      });
    });

    // 3. Process active conversations
    conversations.forEach((c) => {
      const existingUser = userMap.get(c.userId);
      if (existingUser) {
        existingUser.conversationId = c._id;
        existingUser.lastMessage = c.lastMessage;
        existingUser.unreadCount = c.unreadCount;
        existingUser.isOnline = c.isOnline;
      } else {
        // If a conversation exists but user is not in followers/following, still show them
        userMap.set(c.userId, {
          _id: c.userId,
          username: c.username,
          fullName: c.username,
          profilePicture: c.profilePicture,
          isOnline: c.isOnline,
          lastMessage: c.lastMessage,
          unreadCount: c.unreadCount,
          conversationId: c._id,
        });
      }
    });

    return Array.from(userMap.values());
  }, [followers, following, conversations]);

  // Memoized instant filter (username, followers, following, or lastMessage text)
  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) return allUsers;
    const term = searchTerm.toLowerCase();
    return allUsers.filter(
      (u) =>
        u.username.toLowerCase().includes(term) ||
        (u.fullName && u.fullName.toLowerCase().includes(term)) ||
        (u.lastMessage && u.lastMessage.toLowerCase().includes(term))
    );
  }, [allUsers, searchTerm]);

  // Debug logs for selected user, active conversation, conversation ID, thread ID
  useEffect(() => {
    const activeConv = conversations.find((c) => c?._id === activeId);
    console.log("Messages Page State Change:", {
      selectedUser: selectedChat,
      activeConversation: activeConv || null,
      conversationId: activeId,
      threadId: thread?.conversation?._id || thread?.conversation || null,
    });
  }, [selectedChat, activeId, conversations, thread]);

  // Mutations
  const sendMutation = useMutation({
    mutationFn: ({ id, text }: { id: string; text: string }) => discussionsApi.send(id, text),
    onSuccess: (data, variables) => {
      setNewMsg("");
      qc.invalidateQueries({ queryKey: ["discussion", variables.id] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const editMutation = useMutation({
    mutationFn: ({ messageId, text }: { messageId: string; text: string }) =>
      discussionsApi.editMessage(messageId, text),
    onSuccess: () => {
      setEditingMessage(null);
      setEditMsgText("");
      qc.invalidateQueries({ queryKey: ["discussion", activeId] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
      toast.success("Message updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (messageId: string) => discussionsApi.deleteMessage(messageId),
    onSuccess: () => {
      setSelectedMessage(null);
      qc.invalidateQueries({ queryKey: ["discussion", activeId] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
      toast.success("Message deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Get or Create conversation mutation
  const getOrCreateMutation = useMutation({
    mutationFn: (targetUserId: string) => messagesApi.getOrCreateConversation(targetUserId),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["conversations"] });
      setActiveId(res?._id);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread?.messages]);

  const convTitle = (c: ApiConversation) => {
    if (c.title) return c.title;
    const names = c.otherParticipants?.map((p) => p.fullName || p.username).join(", ");
    return names || "Conversation";
  };

  const handleCopyMessage = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Message copied to clipboard");
  };

  // Click handler to open existing or initialize new conversation automatically
  const handleUserClick = (targetUser: any) => {
    setSelectedChat(targetUser);
    if (targetUser?.conversationId) {
      setActiveId(targetUser.conversationId);
    } else {
      setActiveId(`temp-${targetUser?._id}`);
    }
  };

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto px-4 lg:px-8 pt-4 pb-4 h-[calc(100vh-6rem)] animate-fade-in">
        <div className="grid lg:grid-cols-[300px_1fr] gap-0 border border-border bg-surface rounded-3xl shadow-2xl h-full overflow-hidden">
          
          {/* Direct Messages Sidebar */}
          <aside className="border-r border-border bg-surface flex flex-col overflow-hidden">
            
            {/* Sidebar Header with Search input */}
            <div className="px-4 py-3.5 border-b border-border flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-base tracking-tight truncate">
                  {user?.username || "messages"}
                </span>
              </div>
              
              <div ref={searchContainerRef} className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground shrink-0 pointer-events-none" />
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => setShowSearchDropdown(true)}
                  placeholder="Search users..."
                  className="w-full h-9 pl-9 pr-8 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground shrink-0"
                  >
                    <X className="size-3.5" />
                  </button>
                )}

                {/* Dropdown Menu Overlay */}
                {showSearchDropdown && (
                  <div
                    ref={dropdownRef}
                    className="absolute left-0 right-0 top-full mt-1.5 bg-surface border border-border rounded-2xl shadow-xl z-50 flex flex-col max-h-[350px] overflow-y-auto no-scrollbar animate-scale-in"
                  >
                    {/* Empty Search Term: Recent Chats and Followers & Following */}
                    {!searchTerm.trim() && (
                      <div className="p-3 space-y-4">
                        <div>
                          <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2 px-2">Recent Chats</p>
                          {conversations.length === 0 ? (
                            <p className="text-xs text-muted-foreground px-2 py-1">No recent chats</p>
                          ) : (
                            <div className="space-y-1">
                              {conversations.slice(0, 5).map((c) => (
                                <button
                                  key={c._id}
                                  type="button"
                                  onClick={() => {
                                    setActiveId(c._id);
                                    setShowSearchDropdown(false);
                                  }}
                                  className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-secondary text-left transition-colors"
                                >
                                  <img src={c.profilePicture} alt={c.username} className="size-8 rounded-full object-cover border border-border" />
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs font-semibold truncate text-foreground leading-none">{c.username}</p>
                                    <p className="text-[10px] text-muted-foreground truncate mt-1">@{c.username}</p>
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        <div>
                          <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2 px-2">Followers & Following</p>
                          {allUsers.length === 0 ? (
                            <p className="text-xs text-muted-foreground px-2 py-1">No connections yet</p>
                          ) : (
                            <div className="space-y-1 max-h-[160px] overflow-y-auto no-scrollbar">
                              {allUsers.map((u) => (
                                <div
                                  key={u._id}
                                  onClick={() => {
                                    setShowSearchDropdown(false);
                                    if (u.username) {
                                      navigate({ to: "/profile/$username", params: { username: u.username } });
                                    } else {
                                      navigate({ to: "/profile/$username", params: { username: u._id } });
                                    }
                                  }}
                                  className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-secondary text-left transition-colors cursor-pointer"
                                >
                                  <img src={u.profilePicture} alt={u.username} className="size-8 rounded-full object-cover border border-border" />
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs font-semibold truncate text-foreground leading-none">{u.username}</p>
                                    <p className="text-[10px] text-muted-foreground truncate mt-1">{u.fullName || `@${u.username}`}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Active search typing */}
                    {searchTerm.trim() && (
                      <div className="p-3">
                        {filteredUsers.length > 0 && (
                          <div className="space-y-1">
                            {filteredUsers.map((u) => (
                              <div
                                key={u._id}
                                onClick={() => {
                                  setShowSearchDropdown(false);
                                  setSearchTerm("");
                                  if (u.username) {
                                    navigate({ to: "/profile/$username", params: { username: u.username } });
                                  } else {
                                    navigate({ to: "/profile/$username", params: { username: u._id } });
                                  }
                                }}
                                className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-secondary text-left transition-colors cursor-pointer"
                              >
                                <img src={u.profilePicture} alt={u.username} className="size-8 rounded-full object-cover border border-border" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-semibold truncate text-foreground leading-none">{u.username}</p>
                                  <p className="text-[10px] text-muted-foreground truncate mt-1">{u.fullName || `@${u.username}`}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {searchTerm.trim().length >= 2 && searchResults.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-border">
                            <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2 px-2">Other users</p>
                            <div className="space-y-1">
                              {searchResults
                                .filter(sr => !allUsers.some(au => au._id === sr._id))
                                .map((u) => (
                                  <div
                                    key={u._id}
                                    onClick={() => {
                                      setShowSearchDropdown(false);
                                      setSearchTerm("");
                                      if (u.username) {
                                        navigate({ to: "/profile/$username", params: { username: u.username } });
                                      } else {
                                        navigate({ to: "/profile/$username", params: { username: u._id } });
                                      }
                                    }}
                                    className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-secondary text-left transition-colors cursor-pointer"
                                  >
                                    <img src={u.profilePicture} alt={u.username} className="size-8 rounded-full object-cover border border-border" />
                                    <div className="min-w-0 flex-1">
                                      <p className="text-xs font-semibold truncate text-foreground leading-none">{u.username}</p>
                                      <p className="text-[10px] text-muted-foreground truncate mt-1">{u.fullName || `@${u.username}`}</p>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}

                        {filteredUsers.length === 0 && (searchTerm.trim().length < 2 || searchResults.length === 0) && (
                          <p className="text-xs text-muted-foreground text-center py-4">No users found.</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* Sidebar Users list (followers + following unique merged list) */}
            <div className="flex-1 overflow-y-auto">
              {isLoading && (
                <p className="p-4 text-xs text-muted-foreground">Loading…</p>
              )}
              {!isLoading && filteredUsers.length === 0 && (
                <p className="p-4 text-xs text-muted-foreground flex items-center gap-2">
                  <MessageCircle className="size-4" /> No chats found
                </p>
              )}
              {filteredUsers.map((u) => {
                const isActive = activeId === u.conversationId;
                return (
                  <button
                    key={u._id}
                    onClick={() => handleUserClick(u)}
                    className={`w-full flex items-center gap-3 px-4 py-3 border-b border-border hover:bg-secondary transition-colors ${
                      isActive ? "bg-secondary" : ""
                    }`}
                  >
                    <div className="relative size-11 flex-shrink-0">
                      <div className="size-full rounded-full overflow-hidden border border-border">
                        {u.profilePicture ? (
                          <img src={u.profilePicture} alt={u.username} className="size-full object-cover" />
                        ) : (
                          <span className="size-full grid place-items-center bg-muted text-sm font-mono text-muted-foreground">?</span>
                        )}
                      </div>
                      
                      {/* Real-time online status green indicator */}
                      {u.isOnline && (
                        <span className="absolute bottom-0 right-0 size-3 rounded-full bg-green-500 ring-2 ring-surface" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center justify-between">
                        <p className={`text-sm truncate text-foreground ${u.unreadCount > 0 ? "font-bold" : "font-medium"}`}>
                          {u.username}
                        </p>
                        {u.unreadCount > 0 && (
                          <span className="bg-foreground text-background text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-4 text-center">
                            {u.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className={`text-xs truncate mt-0.5 ${u.unreadCount > 0 ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                        {u.lastMessage || "No messages yet"}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Active Conversation Panel */}
          <section className="bg-surface flex flex-col overflow-hidden">
            {!activeId ? (
              <div className="flex-1 grid place-items-center text-xs text-muted-foreground">
                Select a conversation or start a new one
              </div>
            ) : (
              <>
                {/* Active Chat Header */}
                <div className="px-4 py-3.5 border-b border-border flex items-center gap-3">
                  {(() => {
                    const activeConv = conversations.find((c) => c?._id === activeId);
                    const chatUser = activeConv || selectedChat;
                    if (!chatUser) return <span className="font-bold text-sm text-foreground">Conversation</span>;
                    return (
                      <Link
                        to="/profile/$username"
                        params={{ username: chatUser.username }}
                        className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                      >
                        <div className="size-9 rounded-full overflow-hidden border border-border flex-shrink-0">
                          {chatUser.profilePicture ? (
                            <img src={chatUser.profilePicture} alt={chatUser.username} className="size-full object-cover" />
                          ) : (
                            <span className="size-full grid place-items-center bg-muted text-xs font-mono text-muted-foreground">?</span>
                          )}
                        </div>
                        <span className="font-bold text-sm text-foreground">
                          {chatUser.username}
                        </span>
                      </Link>
                    );
                  })()}
                </div>
                
                {/* Messages Thread list */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {thread?.messages?.map((m: ApiMessage) => {
                    const mine = m?.sender?._id === user?._id;
                    const isEditing = editingMessage?._id === m?._id;
                    return (
                      <div
                        key={m?._id}
                        className={`flex gap-2.5 items-end ${mine ? "justify-end" : "justify-start"}`}
                      >
                        {!mine && (
                          <div className="size-7 rounded-full overflow-hidden border border-border flex-shrink-0 mb-1">
                            {m?.sender?.profilePicture ? (
                              <img src={m?.sender?.profilePicture} alt={m?.sender?.username} className="size-full object-cover" />
                            ) : (
                              <span className="size-full grid place-items-center bg-muted text-[10px] font-mono">?</span>
                            )}
                          </div>
                        )}
                        <ContextMenu>
                          <ContextMenuTrigger className="max-w-[70%]">
                            <div
                               className={`w-full px-4 py-2.5 rounded-2xl text-sm ${
                                mine
                                  ? "bg-foreground text-background rounded-br-md font-medium"
                                  : "bg-secondary rounded-bl-md text-foreground"
                              }`}
                            >
                              {!mine && (
                                <p className="text-[10px] font-mono uppercase tracking-wider opacity-70 mb-1">
                                  {m?.sender?.username}
                                </p>
                              )}
                              {isEditing ? (
                                <div className="space-y-2 mt-1 min-w-[200px]">
                                  <textarea
                                    value={editMsgText}
                                    onChange={(e) => setEditMsgText(e.target.value)}
                                    className="w-full text-foreground bg-background rounded-lg border border-border px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                                    rows={2}
                                  />
                                  <div className="flex justify-end gap-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingMessage(null);
                                        setEditMsgText("");
                                      }}
                                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                                        mine
                                          ? "bg-background/20 text-background hover:bg-background/30"
                                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                                      }`}
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      type="button"
                                      disabled={editMutation.isPending}
                                      onClick={() => {
                                        if (!editMsgText.trim() || !m?._id) return;
                                        editMutation.mutate({
                                          messageId: m._id,
                                          text: editMsgText.trim(),
                                        });
                                      }}
                                      className={`px-3 py-1 rounded-full text-xs font-medium disabled:opacity-50 ${
                                        mine
                                          ? "bg-background text-foreground hover:bg-background/90"
                                          : "bg-foreground text-background hover:bg-foreground/90"
                                      }`}
                                    >
                                      Save
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="break-words">
                                  {m?.text}
                                  {m?.edited === true && (
                                    <span className="text-[10px] opacity-60 ml-1.5 select-none">
                                      (edited)
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </ContextMenuTrigger>
                          <ContextMenuContent className="w-48">
                            <ContextMenuItem
                              onClick={() => handleCopyMessage(m?.text || "")}
                              className="flex items-center gap-2 cursor-pointer"
                            >
                              <Copy className="size-3.5" />
                              <span>Copy Message</span>
                            </ContextMenuItem>
                            {mine && (
                              <>
                                <ContextMenuItem
                                  onClick={() => {
                                    setEditingMessage(m);
                                    setEditMsgText(m?.text || "");
                                  }}
                                  className="flex items-center gap-2 cursor-pointer"
                                >
                                  <Edit3 className="size-3.5" />
                                  <span>Edit Message</span>
                                </ContextMenuItem>
                                <ContextMenuItem
                                  onClick={() => {
                                    if (m?._id) {
                                      setSelectedMessage(m);
                                      deleteMutation.mutate(m._id);
                                    }
                                  }}
                                  className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                                >
                                  <Trash2 className="size-3.5" />
                                  <span>Delete Message</span>
                                </ContextMenuItem>
                              </>
                            )}
                          </ContextMenuContent>
                        </ContextMenu>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>
                
                {/* Input send bar */}
                <form
                  className="p-3 border-t border-border flex gap-2"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const trimmedMsg = newMsg.trim();
                    if (!trimmedMsg || !activeId) return;

                    if (activeId.startsWith("temp-")) {
                      const targetUserId = activeId.replace("temp-", "");
                      try {
                        const conv = await messagesApi.getOrCreateConversation(targetUserId);
                        const realId = conv?._id;
                        if (!realId) throw new Error("Could not retrieve conversation ID");
                        
                        // Update UI states
                        setActiveId(realId);
                        
                        // Send the message using the newly created conversation ID
                        sendMutation.mutate({ id: realId, text: trimmedMsg });
                      } catch (error: any) {
                        toast.error(error.message || "Failed to start conversation");
                      }
                    } else {
                      sendMutation.mutate({ id: activeId, text: trimmedMsg });
                    }
                  }}
                >
                  <input
                    value={newMsg}
                    onChange={(e) => setNewMsg(e.target.value)}
                    placeholder="Write a message…"
                    className="flex-1 h-11 px-4 rounded-full border border-border bg-background text-foreground focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={sendMutation.isPending}
                    className="size-11 rounded-full bg-foreground text-background grid place-items-center"
                    aria-label="Send"
                  >
                    <Send className="size-4" />
                  </button>
                </form>
              </>
            )}
          </section>
        </div>
      </div>
    </AppShell>
  );
}
