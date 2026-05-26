import { Link } from "@tanstack/react-router";

export const LOGO_SRC = "/plethora-logo.png";

const sizeClasses = {
  sm: "size-8",
  md: "size-11",
  lg: "size-14",
  xl: "size-20",
} as const;

type BrandLogoProps = {
  size?: keyof typeof sizeClasses;
  to?: string;
  showWordmark?: boolean;
  className?: string;
  imgClassName?: string;
};

export function BrandLogo({
  size = "md",
  to,
  showWordmark = false,
  className = "",
  imgClassName = "",
}: BrandLogoProps) {
  const content = (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <img
        src={LOGO_SRC}
        alt="Plethora"
        className={`${sizeClasses[size]} rounded-full object-cover shadow-[var(--shadow-soft)] ring-1 ring-border/40 ${imgClassName}`}
      />
      {showWordmark && (
        <span className="font-mono text-sm font-semibold tracking-tight">Plethora</span>
      )}
    </span>
  );

  if (to) {
    return (
      <Link to={to} aria-label="Plethora home" className="hover:opacity-90 transition-opacity">
        {content}
      </Link>
    );
  }

  return content;
}
