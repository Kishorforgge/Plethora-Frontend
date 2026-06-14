import { useEffect, useRef, useState } from "react";
import { X, Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareUrl: string;
}

export function ShareModal({ isOpen, onClose, shareUrl }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      // Prevent scrolling of body when modal is open
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  // Close on click outside
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy link");
    }
  };

  if (!isOpen) return null;

  // Social share links
  const socialShares = [
    {
      name: "WhatsApp",
      url: `https://api.whatsapp.com/send?text=${encodeURIComponent(shareUrl)}`,
      color: "hover:bg-emerald-500/10 hover:text-emerald-500",
      icon: (
        <svg className="size-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.705 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      ),
    },
    {
      name: "Facebook",
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      color: "hover:bg-blue-600/10 hover:text-blue-600",
      icon: (
        <svg className="size-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      ),
    },
    {
      name: "X (Twitter)",
      url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}`,
      color: "hover:bg-foreground/10 hover:text-foreground",
      icon: (
        <svg className="size-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      ),
    },
    {
      name: "Telegram",
      url: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}`,
      color: "hover:bg-sky-500/10 hover:text-sky-500",
      icon: (
        <svg className="size-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M11.944 0C5.344 0 0 5.344 0 12c0 6.656 5.344 12 12 12 6.656 0 12-5.344 12-12C24 5.344 18.656 0 11.944 0zm5.892 8.354l-1.948 9.176c-.144.654-.532.813-1.077.508l-2.969-2.188-1.433 1.38c-.158.158-.291.291-.597.291l.213-3.022 5.5-4.97c.239-.213-.052-.332-.372-.119l-6.8 4.281-2.928-.916c-.636-.2-1.144-.54-1.144-.881 0-.34.508-.68 1.144-.881l11.4-4.4c.528-.2 1-.06.84.88z"/>
        </svg>
      ),
    },
  ];

  return (
    <div
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
    >
      <div
        ref={modalRef}
        className="w-full max-w-sm rounded-[2rem] bg-surface/90 border border-border p-6 shadow-[var(--shadow-soft)] backdrop-blur-md animate-scale-up"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-mono uppercase tracking-widest text-muted-foreground">
            Share this frame
          </h3>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="size-8 rounded-full grid place-items-center hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* URL Input and Copy Button */}
        <div className="flex gap-2 mb-6">
          <input
            type="text"
            readOnly
            value={shareUrl}
            className="flex-1 h-11 px-4 rounded-full border border-border bg-background/50 focus:outline-none text-xs text-muted-foreground truncate"
          />
          <button
            onClick={handleCopy}
            className="h-11 px-4 rounded-full bg-foreground text-background text-xs font-medium hover:opacity-90 active:scale-95 transition-all flex items-center gap-1.5 shrink-0"
          >
            {copied ? (
              <>
                <Check className="size-3.5" /> Copied
              </>
            ) : (
              <>
                <Copy className="size-3.5" /> Copy
              </>
            )}
          </button>
        </div>

        {/* Social Platforms Grid */}
        <div className="grid grid-cols-4 gap-3">
          {socialShares.map((platform) => (
            <a
              key={platform.name}
              href={platform.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-background/30 p-3 text-muted-foreground transition-all duration-300 ${platform.color}`}
            >
              {platform.icon}
              <span className="text-[10px] font-mono tracking-tight">{platform.name.split(" ")[0]}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
