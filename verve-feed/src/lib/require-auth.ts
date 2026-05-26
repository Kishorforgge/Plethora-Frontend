import { redirect } from "@tanstack/react-router";
import { TOKEN_KEY } from "@/lib/api";

export function requireAuth() {
  if (typeof window === "undefined") return;
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) {
    throw redirect({ to: "/login", search: { redirect: location.pathname } });
  }
}
