import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { postsApi } from "@/lib/api";
import { requireAuth } from "@/lib/require-auth";
import { useRef, useState } from "react";
import { Upload, X, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { CATEGORIES } from "@/lib/mock-data";

export const Route = createFileRoute("/upload")({
  beforeLoad: requireAuth,
  head: () => ({
    meta: [{ title: "Upload — Plethora" }],
  }),
  component: UploadPage,
});

function UploadPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [preview, set_preview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [drag, set_drag] = useState(false);
  const [caption, set_caption] = useState("");
  const [tags, set_tags] = useState("");
  const [category, setCategory] = useState("");
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    if (!f.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    setFile(f);
    set_preview(URL.createObjectURL(f));
  };

  const submit = async () => {
    if (!file) {
      toast.error("Add an image first.");
      return;
    }
    setUploading(true);
    try {
      await postsApi.upload(file, caption, tags, category || undefined);
      qc.invalidateQueries({ queryKey: ["my-uploads"] });
      toast.success("Posted to your collection");
      navigate({ to: "/profile" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto px-4 lg:px-8 pt-8 lg:pt-12">
        <header className="mb-10 animate-fade-up">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-3">
            New upload
          </p>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tighter">
            Add to your collection.
          </h1>
        </header>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            set_drag(true);
          }}
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
                type="button"
                onClick={() => {
                  set_preview(null);
                  setFile(null);
                }}
                aria-label="Remove image"
                className="absolute top-4 right-4 size-9 rounded-full glass-strong grid place-items-center hover:bg-secondary"
              >
                <X className="size-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="w-full aspect-[3/2] flex flex-col items-center justify-center gap-4 hover:bg-secondary transition-colors"
            >
              <div className="size-14 rounded-full bg-secondary grid place-items-center">
                <Upload className="size-6 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">Drag and drop, or click to browse</p>
                <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WEBP — up to 5MB</p>
              </div>
            </button>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
        </div>

        <div className="grid gap-4 mt-8">
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
              Caption
            </span>
            <textarea
              value={caption}
              onChange={(e) => set_caption(e.target.value)}
              rows={3}
              placeholder="Add a short note about this frame…"
              className="px-4 py-3 rounded-2xl border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
              Tags
            </span>
            <input
              value={tags}
              onChange={(e) => set_tags(e.target.value)}
              placeholder="architecture, light, minimal"
              className="h-12 px-4 rounded-2xl border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
              Category
            </span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-12 px-4 rounded-2xl border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-ring text-sm"
            >
              <option value="">None (Uncategorized)</option>
              {CATEGORIES.filter((c) => c !== "All").map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
        </div>

        {uploading && (
          <div className="mt-6 flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-muted-foreground">
            <ImageIcon className="size-3" /> Uploading to Cloudinary…
          </div>
        )}

        <div className="mt-8 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => {
              set_preview(null);
              setFile(null);
              set_caption("");
              set_tags("");
              setCategory("");
            }}
            className="px-6 h-12 rounded-full border border-border text-sm hover:bg-secondary transition-colors"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={uploading}
            className="px-7 h-12 rounded-full bg-foreground text-background text-sm font-medium hover:scale-[1.02] active:scale-95 transition-transform disabled:opacity-60"
          >
            {uploading ? "Publishing…" : "Publish"}
          </button>
        </div>
      </div>
    </AppShell>
  );
}
