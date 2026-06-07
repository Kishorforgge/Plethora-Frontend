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
  const searchParams = Route.useSearch();
  const { setUserFromToken } = useAuth();

  useEffect(() => {
    console.log("TanStack Router query params:", searchParams);

    let token = searchParams.token || "";
    let error = searchParams.error || "";

    // Fall back to direct window search parsing if not found by router
    if (typeof window !== "undefined") {
      const query = new URLSearchParams(window.location.search);
      const windowToken = query.get("token") || "";
      const windowError = query.get("error") || "";

      console.log("Direct window.location.search params - token:", windowToken ? "Found" : "Not Found", "error:", windowError);

      if (!token && windowToken) {
        console.log("Using token extracted directly from window.location");
        token = windowToken;
      }
      if (!error && windowError) {
        console.log("Using error extracted directly from window.location");
        error = windowError;
      }
    }

    if (error) {
      console.error("Sign-in error received:", error);
      toast.error(`Sign-in failed: ${error || "Please try again."}`);
      navigate({ to: "/login" });
      return;
    }

    if (!token) {
      console.error("No token found in query parameters.");
      toast.error("No session token received.");
      navigate({ to: "/login" });
      return;
    }

    console.log("Token successfully resolved. Setting user...");
    setUserFromToken(token)
      .then(() => {
        console.log("User successfully loaded from token.");
        toast.success("Signed in successfully");
        navigate({ to: "/feed" });
      })
      .catch((err) => {
        console.error("Failed to load user from token:", err);
        toast.error("Could not complete sign-in.");
        navigate({ to: "/login" });
      });
  }, [searchParams, navigate, setUserFromToken]);

  return (
    <div className="min-h-screen grid place-items-center bg-background gap-4">
      <BrandLogo size="lg" />
      <p className="text-sm text-muted-foreground font-mono uppercase tracking-widest">
        Completing sign-in…
      </p>
    </div>
  );
}
