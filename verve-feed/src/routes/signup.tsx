import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { POSTS } from "@/lib/mock-data";
import { ArrowLeft } from "lucide-react";
import { SocialButton, Field } from "./login";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create account — Plethora" },
      { name: "description", content: "Create your Plethora account and start building intentional visual collections." },
    ],
  }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const [name, n_set] = useState("");
  const [email, e_set] = useState("");
  const [password, p_set] = useState("");

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="flex flex-col px-6 py-10 lg:p-12 bg-background order-2 lg:order-1 animate-fade-up">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit">
          <ArrowLeft className="size-4" /> Back
        </Link>
        <div className="flex-1 grid place-items-center">
          <div className="w-full max-w-sm">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-3">Begin</p>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-10">Create your Plethora.</h1>

            <div className="flex flex-col gap-3 mb-6">
              <SocialButton provider="Google" />
              <SocialButton provider="GitHub" />
            </div>
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px flex-1 bg-border" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">or</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <form onSubmit={(e) => { e.preventDefault(); toast("Welcome to Plethora"); navigate({ to: "/feed" }); }} className="flex flex-col gap-3">
              <Field label="Name" value={name} onChange={n_set} placeholder="Your studio name" />
              <Field label="Email" type="email" value={email} onChange={e_set} placeholder="you@studio.com" />
              <Field label="Password" type="password" value={password} onChange={p_set} placeholder="At least 8 characters" />
              <button type="submit" className="mt-3 h-12 rounded-full bg-foreground text-background text-sm font-medium hover:scale-[1.01] active:scale-95 transition-transform">
                Create account
              </button>
            </form>
            <p className="text-sm text-muted-foreground text-center mt-8">
              Already have an account? <Link to="/login" className="text-foreground underline underline-offset-4">Sign in</Link>
            </p>
          </div>
        </div>
      </div>

      <div className="hidden lg:block relative overflow-hidden bg-foreground order-1 lg:order-2">
        <div className="absolute inset-0 grid grid-cols-2 gap-3 p-3 opacity-90">
          {POSTS.slice(6, 12).map((p, i) => (
            <div key={p.id} className={`overflow-hidden rounded-[1.5rem] ${i % 3 === 1 ? "row-span-2" : ""}`}>
              <img src={p.image} alt="" className="size-full object-cover" />
            </div>
          ))}
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-foreground via-foreground/30 to-transparent" />
        <div className="absolute top-12 left-12 right-12 text-background">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-background/60 mb-3">PLETHORA</p>
          <p className="text-2xl font-medium tracking-tight max-w-md">A quieter place for visual research.</p>
        </div>
      </div>
    </div>
  );
}
