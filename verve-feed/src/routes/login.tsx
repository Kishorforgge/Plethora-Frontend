import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { POSTS } from "@/lib/mock-data";
import { ArrowLeft } from "lucide-react";
import { useAuth, ApiError } from "@/components/auth-provider";
import { API_URL } from "@/lib/api";
import { BrandLogo } from "@/components/brand-logo";
import { redirectIfAuthed } from "@/lib/require-guest";

export const Route = createFileRoute("/login")({
  beforeLoad: redirectIfAuthed,
  head: () => ({
    meta: [
      { title: "Sign in — Plethora" },
      {
        name: "description",
        content: "Sign in to your Plethora account to continue building your visual collections.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, set_email] = useState("");
  const [password, set_password] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Welcome back");
      navigate({ to: "/feed" });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:block relative overflow-hidden bg-foreground">
        <div className="absolute inset-0 grid grid-cols-2 gap-3 p-3 opacity-90">
          {POSTS.slice(0, 6).map((p, i) => (
            <div
              key={p.id}
              className={`overflow-hidden rounded-[1.5rem] ${i % 3 === 0 ? "row-span-2" : ""}`}
            >
              <img src={p.image} alt="" className="size-full object-cover" />
            </div>
          ))}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-foreground via-foreground/30 to-transparent" />
        <div className="absolute bottom-12 left-12 right-12 text-background">
          <div className="mb-4">
            <BrandLogo size="lg" imgClassName="ring-2 ring-background/20" />
          </div>
          <p className="text-2xl font-medium tracking-tight max-w-md">
            Pick up where your last collection left off.
          </p>
        </div>
      </div>

      <div className="flex flex-col px-6 py-10 lg:p-12 bg-background animate-fade-up">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
        >
          <ArrowLeft className="size-4" /> Back
        </Link>

        <div className="flex-1 grid place-items-center">
          <div className="w-full max-w-sm">
            <BrandLogo to="/" size="md" className="mb-6" />
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-3">
              Welcome back
            </p>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-10">
              Sign in to Plethora.
            </h1>

            <div className="flex flex-col gap-3 mb-6">
              <SocialButton provider="Google" href={`${API_URL}/api/auth/google`} />
            </div>

            <div className="flex items-center gap-3 mb-6">
              <div className="h-px flex-1 bg-border" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                or
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <Field
                label="Email"
                type="email"
                value={email}
                onChange={set_email}
                placeholder="you@studio.com"
              />
              <Field
                label="Password"
                type="password"
                value={password}
                onChange={set_password}
                placeholder="••••••••"
              />
              <button
                type="submit"
                disabled={loading}
                className="mt-3 h-12 rounded-full bg-foreground text-background text-sm font-medium hover:scale-[1.01] active:scale-95 transition-transform disabled:opacity-60"
              >
                {loading ? "Signing in…" : "Continue"}
              </button>
            </form>

            <p className="text-sm text-muted-foreground text-center mt-8">
              New here?{" "}
              <Link to="/signup" className="text-foreground underline underline-offset-4">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SocialButton({
  provider,
  href,
}: {
  provider: "Google" | "GitHub";
  href?: string;
}) {
  const GoogleLogo = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="size-[18px] shrink-0 select-none">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22-.03-.63z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
    </svg>
  );

  if (href) {
    return (
      <a
        href={href}
        className="h-12 rounded-full border border-border bg-surface hover:bg-secondary text-sm font-medium flex items-center justify-center gap-3 transition-colors"
      >
        {provider === "Google" ? (
          <GoogleLogo />
        ) : (
          <span className="size-[18px] rounded-sm bg-foreground" />
        )}
        Continue with {provider}
      </a>
    );
  }

  return (
    <button
      type="button"
      disabled
      className="h-12 rounded-full border border-border bg-surface text-sm font-medium flex items-center justify-center gap-3 opacity-50"
    >
      {provider === "Google" ? (
        <GoogleLogo />
      ) : (
        <span className="size-[18px] rounded-sm bg-foreground" />
      )}
      {provider} (coming soon)
    </button>
  );
}

export function Field({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-12 px-4 rounded-2xl border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-ring transition-all"
      />
    </label>
  );
}
