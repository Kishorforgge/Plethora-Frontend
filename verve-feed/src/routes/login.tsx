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
  if (href) {
    return (
      <a
        href={href}
        className="h-12 rounded-full border border-border bg-surface hover:bg-secondary text-sm font-medium flex items-center justify-center gap-3 transition-colors"
      >
        <span className="size-4 rounded-sm bg-gradient-to-br from-blue-500 via-red-500 to-yellow-500" />
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
      <span
        className={`size-4 rounded-sm ${provider === "Google" ? "bg-gradient-to-br from-blue-500 via-red-500 to-yellow-500" : "bg-foreground"}`}
      />
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
