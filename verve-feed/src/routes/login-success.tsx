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
    if (error) {
      toast.error("Sign-in failed. Please try again.");
      navigate({ to: "/login" });
      return;
    }
    if (!token) {
      toast.error("No session token received.");
      navigate({ to: "/login" });
      return;
    }
    setUserFromToken(token)
      .then(() => {
        toast.success("Signed in successfully");
        navigate({ to: "/feed" });
      })
      .catch(() => {
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
