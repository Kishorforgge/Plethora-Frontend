import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/components/auth-provider";
import { ApiConversation, ApiMessage, discussionsApi, userApi } from "@/lib/api";
import { requireAuth } from "@/lib/require-auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { MessageCircle, Plus, Send, Copy, Edit3, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

export const Route = createFileRoute("/discussions")({
  beforeLoad: requireAuth,
  head: () => ({
    meta: [{ title: "Discussions — Plethora" }],
  }),
  component: DiscussionsPage,
});

function DiscussionsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [newMsg, setNewMsg] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [roomTitle, setRoomTitle] = useState("");
  const [initialMessage, setInitialMessage] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const [editingMessage, setEditingMessage] = useState<ApiMessage | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<ApiMessage | null>(null);
  const [editMsgText, setEditMsgText] = useState("");

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ["discussions", "public"],
    queryFn: () => discussionsApi.list("public"),
  });

  const { data: thread } = useQuery({
    queryKey: ["discussion", activeId],
    queryFn: () => discussionsApi.messages(activeId!),
    enabled: !!activeId,
    refetchInterval: 5000,
  });

  const sendMutation = useMutation({
    mutationFn: ({ id, text }: { id: string; text: string }) => discussionsApi.send(id, text),
    onSuccess: () => {
      setNewMsg("");
      qc.invalidateQueries({ queryKey: ["discussion", activeId] });
      qc.invalidateQueries({ queryKey: ["discussions", "public"] });
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
      qc.invalidateQueries({ queryKey: ["discussions", "public"] });
      toast.success("Message updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (messageId: string) => discussionsApi.deleteMessage(messageId),
    onSuccess: () => {
      setSelectedMessage(null);
      qc.invalidateQueries({ queryKey: ["discussion", activeId] });
      qc.invalidateQueries({ queryKey: ["discussions", "public"] });
      toast.success("Message deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      discussionsApi.create({
        title: roomTitle,
        initialMessage: initialMessage || undefined,
        isPublic: true,
      }),
    onSuccess: (conv) => {
      setShowNew(false);
      setRoomTitle("");
      setInitialMessage("");
      qc.invalidateQueries({ queryKey: ["discussions", "public"] });
      setActiveId(conv._id);
      toast.success("Public room created");
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

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto px-4 lg:px-8 pt-8 lg:pt-12 h-[calc(100vh-8rem)]">
        <header className="flex items-center justify-between mb-6">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-2">
              Disclosure
            </p>
            <h1 className="text-3xl font-semibold tracking-tight">Discussions</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Public rooms where anyone can view and participate in chats.
            </p>
          </div>
          <button
            onClick={() => setShowNew(!showNew)}
            className="h-11 px-5 rounded-full bg-foreground text-background text-sm font-medium inline-flex items-center gap-2"
          >
            <Plus className="size-4" /> New
          </button>
        </header>

        {showNew && (
          <div className="mb-6 p-5 rounded-[1.5rem] border border-border bg-surface animate-fade-up">
            <p className="text-sm font-medium mb-3">Create a Public Room</p>
            <input
              value={roomTitle}
              onChange={(e) => setRoomTitle(e.target.value)}
              placeholder="Room topic or title (e.g., General, Sports, Programming)..."
              className="w-full h-11 px-4 rounded-2xl border border-border bg-background mb-3"
            />
            <textarea
              value={initialMessage}
              onChange={(e) => setInitialMessage(e.target.value)}
              placeholder="Optional first message…"
              rows={2}
              className="w-full px-4 py-3 rounded-2xl border border-border bg-background mb-3 resize-none"
            />
            <button
              disabled={!roomTitle.trim() || createMutation.isPending}
              onClick={() => createMutation.mutate()}
              className="h-10 px-5 rounded-full bg-foreground text-background text-sm disabled:opacity-50"
            >
              Create room
            </button>
          </div>
        )}

        <div className="grid lg:grid-cols-[280px_1fr] gap-4 h-[calc(100%-8rem)] min-h-[400px]">
          <aside className="rounded-[1.5rem] border border-border bg-surface overflow-hidden flex flex-col">
            <p className="px-4 py-3 text-[11px] font-mono uppercase tracking-widest text-muted-foreground border-b border-border">
              Public Rooms
            </p>
            <div className="flex-1 overflow-y-auto">
              {isLoading && (
                <p className="p-4 text-sm text-muted-foreground">Loading…</p>
              )}
              {!isLoading && conversations.length === 0 && (
                <p className="p-4 text-sm text-muted-foreground flex items-center gap-2">
                  <MessageCircle className="size-4" /> No conversations yet
                </p>
              )}
              {conversations.map((c) => (
                <button
                  key={c._id}
                  onClick={() => setActiveId(c._id)}
                  className={`w-full text-left px-4 py-3 border-b border-border hover:bg-secondary transition-colors ${
                    activeId === c._id ? "bg-secondary" : ""
                  }`}
                >
                  <p className="text-sm font-medium truncate">{convTitle(c)}</p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {(c as ApiConversation & { lastMessage?: { text: string } }).lastMessage?.text ||
                      "No messages yet"}
                  </p>
                </button>
              ))}
            </div>
          </aside>

          <section className="rounded-[1.5rem] border border-border bg-surface flex flex-col overflow-hidden">
            {!activeId ? (
              <div className="flex-1 grid place-items-center text-sm text-muted-foreground">
                Select a conversation or start a new one
              </div>
            ) : (
              <>
                <div className="px-4 py-3 border-b border-border text-sm font-medium">
                  {conversations.find((c) => c._id === activeId)
                    ? convTitle(conversations.find((c) => c._id === activeId)!)
                    : "Conversation"}
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {thread?.messages.map((m: ApiMessage) => {
                    const mine = m.sender._id === user?._id;
                    const isEditing = editingMessage?._id === m._id;
                    return (
                      <div
                        key={m._id}
                        className={`flex ${mine ? "justify-end" : "justify-start"}`}
                      >
                        <ContextMenu>
                          <ContextMenuTrigger className="max-w-[75%]">
                            <div
                              className={`w-full px-4 py-2.5 rounded-2xl text-sm ${
                                mine
                                  ? "bg-foreground text-background rounded-br-md"
                                  : "bg-secondary rounded-bl-md"
                              }`}
                            >
                              {!mine && (
                                <p className="text-[10px] font-mono uppercase tracking-wider opacity-70 mb-1">
                                  {m.sender.username}
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
                                        if (!editMsgText.trim()) return;
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
                                  {m.text}
                                  {m.edited === true && (
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
                              onClick={() => handleCopyMessage(m.text)}
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
                                    setEditMsgText(m.text);
                                  }}
                                  className="flex items-center gap-2 cursor-pointer"
                                >
                                  <Edit3 className="size-3.5" />
                                  <span>Edit Message</span>
                                </ContextMenuItem>
                                <ContextMenuItem
                                  onClick={() => {
                                    setSelectedMessage(m);
                                    deleteMutation.mutate(m._id);
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
                <form
                  className="p-3 border-t border-border flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!newMsg.trim() || !activeId) return;
                    sendMutation.mutate({ id: activeId, text: newMsg.trim() });
                  }}
                >
                  <input
                    value={newMsg}
                    onChange={(e) => setNewMsg(e.target.value)}
                    placeholder="Write a message…"
                    className="flex-1 h-11 px-4 rounded-full border border-border bg-background"
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
