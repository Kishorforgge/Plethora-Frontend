import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/components/auth-provider";
import { toast } from "sonner";
import { BrandLogo } from "@/components/brand-logo";

export const Route = createFileRoute("/login-success")({
  validateSearch: (search: Record<string, unknown>) => ({
    token: (search.token as string) || "",
    error: (search.error as string) || "",
  }),
  component: LoginSuccessPage,
});

function LoginSuccessPage() {
  const navigate = useNavigate();
  const { token, error } = Route.useSearch();
  const { setUserFromToken } = useAuth();

  useEffect(() => {
    console.log("[LoginSuccessPage] Mounted. Search parameters:", { 
      token: token ? `${token.substring(0, 10)}... [length: ${token.length}]` : "undefined", 
      error: error || "none" 
    });
    
    if (error) {
      console.error("[LoginSuccessPage] Sign-in failed error parameter present:", error);
      toast.error("Sign-in failed. Please try again.");
      navigate({ to: "/login" });
      return;
    }
    if (!token) {
      console.error("[LoginSuccessPage] No token query parameter found.");
      toast.error("No session token received.");
      navigate({ to: "/login" });
      return;
    }
    
    console.log("[LoginSuccessPage] Initiating setUserFromToken...");
    setUserFromToken(token)
      .then(() => {
        console.log("[LoginSuccessPage] setUserFromToken success, redirecting to /feed");
        toast.success("Signed in successfully");
        navigate({ to: "/feed" });
      })
      .catch((err) => {
        console.error("[LoginSuccessPage] setUserFromToken failed:", err);
        toast.error("Could not complete sign-in.");
        navigate({ to: "/login" });
      });
  }, [token, error, navigate, setUserFromToken]);

  return (
    <div className="min-h-screen grid place-items-center bg-background gap-4">
      <BrandLogo size="lg" />
      <p className="text-sm text-muted-foreground font-mono uppercase tracking-widest">
        Completing sign-in…
      </p>
    </div>
  );
}
