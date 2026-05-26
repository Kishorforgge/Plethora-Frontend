import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { POSTS } from "@/lib/mock-data";
import { ArrowLeft } from "lucide-react";
import { SocialButton, Field } from "./login";
import { useAuth, ApiError } from "@/components/auth-provider";
import { API_URL } from "@/lib/api";
import { BrandLogo } from "@/components/brand-logo";
import { redirectIfAuthed } from "@/lib/require-guest";

export const Route = createFileRoute("/signup")({
  beforeLoad: redirectIfAuthed,
  head: () => ({
    meta: [
      { title: "Create account — Plethora" },
      {
        name: "description",
        content: "Create your Plethora account and start building intentional visual collections.",
      },
    ],
  }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [name, n_set] = useState("");
  const [username, u_set] = useState("");
  const [email, e_set] = useState("");
  const [password, p_set] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username.length < 3) {
      toast.error("Username must be at least 3 characters");
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      toast.error("Username can only use letters, numbers, and underscores");
      return;
    }
    setLoading(true);
    try {
      await register({
        username: username.toLowerCase(),
        email,
        password,
        fullName: name,
      });
      toast.success("Welcome to Plethora");
      navigate({ to: "/feed" });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="flex flex-col px-6 py-10 lg:p-12 bg-background order-2 lg:order-1 animate-fade-up">
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
              Begin
            </p>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-10">
              Create your Plethora.
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
              <Field label="Name" value={name} onChange={n_set} placeholder="Your studio name" />
              <Field
                label="Username"
                value={username}
                onChange={u_set}
                placeholder="your_handle"
              />
              <Field
                label="Email"
                type="email"
                value={email}
                onChange={e_set}
                placeholder="you@studio.com"
              />
              <Field
                label="Password"
                type="password"
                value={password}
                onChange={p_set}
                placeholder="At least 6 characters"
              />
              <button
                type="submit"
                disabled={loading}
                className="mt-3 h-12 rounded-full bg-foreground text-background text-sm font-medium hover:scale-[1.01] active:scale-95 transition-transform disabled:opacity-60"
              >
                {loading ? "Creating…" : "Create account"}
              </button>
            </form>
            <p className="text-sm text-muted-foreground text-center mt-8">
              Already have an account?{" "}
              <Link to="/login" className="text-foreground underline underline-offset-4">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>

      <div className="hidden lg:block relative overflow-hidden bg-foreground order-1 lg:order-2">
        <div className="absolute inset-0 grid grid-cols-2 gap-3 p-3 opacity-90">
          {POSTS.slice(6, 12).map((p, i) => (
            <div
              key={p.id}
              className={`overflow-hidden rounded-[1.5rem] ${i % 3 === 1 ? "row-span-2" : ""}`}
            >
              <img src={p.image} alt="" className="size-full object-cover" />
            </div>
          ))}
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-foreground via-foreground/30 to-transparent" />
        <div className="absolute top-12 left-12 right-12 text-background">
          <div className="mb-4">
            <BrandLogo size="lg" imgClassName="ring-2 ring-background/20" />
          </div>
          <p className="text-2xl font-medium tracking-tight max-w-md">
            A quieter place for visual research.
          </p>
        </div>
      </div>
    </div>
  );
}
