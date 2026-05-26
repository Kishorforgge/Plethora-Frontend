import { redirect } from "@tanstack/react-router";
import { TOKEN_KEY } from "@/lib/api";

/** Redirect authenticated users away from public pages (landing, login, signup). */
export function redirectIfAuthed() {
  if (typeof window === "undefined") return;
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    throw redirect({ to: "/feed" });
  }
}
