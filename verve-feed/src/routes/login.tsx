import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { POSTS } from "@/lib/mock-data";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Plethora" },
      { name: "description", content: "Sign in to your Plethora account to continue building your visual collections." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, set_email] = useState("");
  const [password, set_password] = useState("");

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Visual side */}
      <div className="hidden lg:block relative overflow-hidden bg-foreground">
        <div className="absolute inset-0 grid grid-cols-2 gap-3 p-3 opacity-90">
          {POSTS.slice(0, 6).map((p, i) => (
            <div key={p.id} className={`overflow-hidden rounded-[1.5rem] ${i % 3 === 0 ? "row-span-2" : ""}`}>
              <img src={p.image} alt="" className="size-full object-cover" />
            </div>
          ))}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-foreground via-foreground/30 to-transparent" />
        <div className="absolute bottom-12 left-12 right-12 text-background">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-background/60 mb-3">PLETHORA</p>
          <p className="text-2xl font-medium tracking-tight max-w-md">Pick up where your last collection left off.</p>
        </div>
      </div>

      {/* Form */}
      <div className="flex flex-col px-6 py-10 lg:p-12 bg-background animate-fade-up">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit">
          <ArrowLeft className="size-4" /> Back
        </Link>

        <div className="flex-1 grid place-items-center">
          <div className="w-full max-w-sm">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-3">Welcome back</p>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-10">Sign in to Plethora.</h1>

            <div className="flex flex-col gap-3 mb-6">
              <SocialButton provider="Google" />
              <SocialButton provider="GitHub" />
            </div>

            <div className="flex items-center gap-3 mb-6">
              <div className="h-px flex-1 bg-border" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">or</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <form
              onSubmit={(e) => { e.preventDefault(); toast("Demo: authentication not wired."); navigate({ to: "/feed" }); }}
              className="flex flex-col gap-3"
            >
              <Field label="Email" type="email" value={email} onChange={set_email} placeholder="you@studio.com" />
              <Field label="Password" type="password" value={password} onChange={set_password} placeholder="••••••••" />
              <button type="submit" className="mt-3 h-12 rounded-full bg-foreground text-background text-sm font-medium hover:scale-[1.01] active:scale-95 transition-transform">
                Continue
              </button>
            </form>

            <p className="text-sm text-muted-foreground text-center mt-8">
              New here? <Link to="/signup" className="text-foreground underline underline-offset-4">Create an account</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SocialButton({ provider }: { provider: "Google" | "GitHub" }) {
  return (
    <button
      onClick={() => toast(`${provider} sign-in (demo)`)}
      className="h-12 rounded-full border border-border bg-surface hover:bg-secondary text-sm font-medium flex items-center justify-center gap-3 transition-colors"
    >
      <span className={`size-4 rounded-sm ${provider === "Google" ? "bg-gradient-to-br from-blue-500 via-red-500 to-yellow-500" : "bg-foreground"}`} />
      Continue with {provider}
    </button>
  );
}

export function Field({ label, type = "text", value, onChange, placeholder }: { label: string; type?: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">{label}</span>
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
