import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/components/auth-provider";
import { ApiConversation, ApiMessage, discussionsApi, userApi } from "@/lib/api";
import { requireAuth } from "@/lib/require-auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { MessageCircle, Plus, Send } from "lucide-react";
import { toast } from "sonner";

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
  const [searchQ, setSearchQ] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [initialMessage, setInitialMessage] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ["discussions"],
    queryFn: discussionsApi.list,
  });

  const { data: thread } = useQuery({
    queryKey: ["discussion", activeId],
    queryFn: () => discussionsApi.messages(activeId!),
    enabled: !!activeId,
    refetchInterval: 5000,
  });

  const { data: searchResults = [] } = useQuery({
    queryKey: ["user-search", searchQ],
    queryFn: () => userApi.search(searchQ),
    enabled: searchQ.length >= 2,
  });

  const sendMutation = useMutation({
    mutationFn: ({ id, text }: { id: string; text: string }) => discussionsApi.send(id, text),
    onSuccess: () => {
      setNewMsg("");
      qc.invalidateQueries({ queryKey: ["discussion", activeId] });
      qc.invalidateQueries({ queryKey: ["discussions"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      discussionsApi.create({
        participantIds: selectedUsers,
        initialMessage: initialMessage || undefined,
      }),
    onSuccess: (conv) => {
      setShowNew(false);
      setSelectedUsers([]);
      setInitialMessage("");
      setSearchQ("");
      qc.invalidateQueries({ queryKey: ["discussions"] });
      setActiveId(conv._id);
      toast.success("Conversation started");
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
              Private conversations between you and other members.
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
            <p className="text-sm font-medium mb-3">Start a conversation</p>
            <input
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder="Search users by name or username…"
              className="w-full h-11 px-4 rounded-2xl border border-border bg-background mb-3"
            />
            {searchResults.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {searchResults.map((u) => (
                  <button
                    key={u._id}
                    type="button"
                    onClick={() =>
                      setSelectedUsers((prev) =>
                        prev.includes(u._id) ? prev.filter((id) => id !== u._id) : [...prev, u._id]
                      )
                    }
                    className={`px-3 py-1.5 rounded-full text-xs border ${
                      selectedUsers.includes(u._id)
                        ? "bg-foreground text-background border-foreground"
                        : "border-border"
                    }`}
                  >
                    @{u.username}
                  </button>
                ))}
              </div>
            )}
            <textarea
              value={initialMessage}
              onChange={(e) => setInitialMessage(e.target.value)}
              placeholder="Optional first message…"
              rows={2}
              className="w-full px-4 py-3 rounded-2xl border border-border bg-background mb-3 resize-none"
            />
            <button
              disabled={selectedUsers.length === 0 || createMutation.isPending}
              onClick={() => createMutation.mutate()}
              className="h-10 px-5 rounded-full bg-foreground text-background text-sm disabled:opacity-50"
            >
              Create conversation
            </button>
          </div>
        )}

        <div className="grid lg:grid-cols-[280px_1fr] gap-4 h-[calc(100%-8rem)] min-h-[400px]">
          <aside className="rounded-[1.5rem] border border-border bg-surface overflow-hidden flex flex-col">
            <p className="px-4 py-3 text-[11px] font-mono uppercase tracking-widest text-muted-foreground border-b border-border">
              Your chats
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
                    return (
                      <div
                        key={m._id}
                        className={`flex ${mine ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
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
                          {m.text}
                        </div>
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
