import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { useRef, useState } from "react";
import { Upload, X, ImageIcon } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/upload")({
  head: () => ({
    meta: [
      { title: "Upload — Plethora" },
      { name: "description", content: "Share a new image to your Plethora collection." },
    ],
  }),
  component: UploadPage,
});

function UploadPage() {
  const navigate = useNavigate();
  const [preview, set_preview] = useState<string | null>(null);
  const [drag, set_drag] = useState(false);
  const [caption, set_caption] = useState("");
  const [tags, set_tags] = useState("");
  const [progress, set_progress] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast("Please choose an image file.");
      return;
    }
    const url = URL.createObjectURL(file);
    set_preview(url);
  };

  const submit = () => {
    if (!preview) { toast("Add an image first."); return; }
    set_progress(0);
    const id = window.setInterval(() => {
      set_progress((p) => {
        const next = (p ?? 0) + 8;
        if (next >= 100) {
          window.clearInterval(id);
          toast("Posted to your feed");
          setTimeout(() => navigate({ to: "/profile" }), 400);
          return 100;
        }
        return next;
      });
    }, 80);
  };

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto px-4 lg:px-8 pt-8 lg:pt-12">
        <header className="mb-10 animate-fade-up">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-3">New upload</p>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tighter">Add to your collection.</h1>
        </header>

        <div
          onDragOver={(e) => { e.preventDefault(); set_drag(true); }}
          onDragLeave={() => set_drag(false)}
          onDrop={(e) => {
            e.preventDefault();
            set_drag(false);
            const f = e.dataTransfer.files?.[0];
            if (f) handleFile(f);
          }}
          className={`relative rounded-[2rem] border-2 border-dashed transition-all overflow-hidden ${
            drag ? "border-foreground bg-secondary" : "border-border bg-surface"
          }`}
        >
          {preview ? (
            <div className="relative">
              <img src={preview} alt="Preview" className="w-full max-h-[60vh] object-contain bg-muted" />
              <button
                onClick={() => set_preview(null)}
                aria-label="Remove image"
                className="absolute top-4 right-4 size-9 rounded-full glass-strong grid place-items-center hover:bg-secondary"
              >
                <X className="size-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => inputRef.current?.click()}
              className="w-full aspect-[3/2] flex flex-col items-center justify-center gap-4 hover:bg-secondary transition-colors"
            >
              <div className="size-14 rounded-full bg-secondary grid place-items-center">
                <Upload className="size-6 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">Drag and drop, or click to browse</p>
                <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WEBP — up to 20MB</p>
              </div>
            </button>
          )}
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
        </div>

        <div className="grid gap-4 mt-8">
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">Caption</span>
            <textarea
              value={caption}
              onChange={(e) => set_caption(e.target.value)}
              rows={3}
              placeholder="Add a short note about this frame…"
              className="px-4 py-3 rounded-2xl border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">Tags</span>
            <input
              value={tags}
              onChange={(e) => set_tags(e.target.value)}
              placeholder="architecture, light, minimal"
              className="h-12 px-4 rounded-2xl border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </label>
        </div>

        {progress !== null && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2 text-xs font-mono uppercase tracking-widest text-muted-foreground">
              <span><ImageIcon className="size-3 inline mr-2" />Uploading</span>
              <span>{progress}%</span>
            </div>
            <div className="h-1 rounded-full bg-secondary overflow-hidden">
              <div className="h-full bg-foreground transition-all duration-200" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        <div className="mt-8 flex justify-end gap-3">
          <button onClick={() => { set_preview(null); set_caption(""); set_tags(""); }} className="px-6 h-12 rounded-full border border-border text-sm hover:bg-secondary transition-colors">
            Reset
          </button>
          <button onClick={submit} disabled={progress !== null} className="px-7 h-12 rounded-full bg-foreground text-background text-sm font-medium hover:scale-[1.02] active:scale-95 transition-transform disabled:opacity-60">
            Publish
          </button>
        </div>
      </div>
    </AppShell>
  );
}
