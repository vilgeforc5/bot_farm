import { startTransition, useState, type FormEvent } from "react";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { apiFetch } from "../lib/api";
import { readAuth, type StoredAuth, writeAuth } from "../lib/auth";

export const Route = createFileRoute("/login")({
  beforeLoad: () => {
    if (typeof window !== "undefined" && readAuth()) {
      throw redirect({ to: "/" });
    }
  },
  component: LoginPage
});

function LoginPage() {
  const navigate = useNavigate();
  const [serverUrl, setServerUrl] = useState(import.meta.env.VITE_SERVER_URL || "http://localhost:3001");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const auth: StoredAuth = {
      serverUrl: serverUrl.replace(/\/$/, ""),
      username,
      password
    };

    try {
      await apiFetch<{ ok: true }>(auth, "/api/admin/session");
      writeAuth(auth);
      startTransition(() => {
        void navigate({ to: "/" });
      });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="mx-auto grid min-h-[calc(100vh-104px)] w-full max-w-7xl place-items-center px-4 pb-10 sm:px-6 lg:px-8">
      <section className="w-full max-w-lg rounded-[2rem] border border-black/10 bg-white/80 p-8 shadow-[0_24px_60px_rgba(0,0,0,0.08)] backdrop-blur">
        <p className="text-xs uppercase tracking-[0.3em] text-stone-500">Admin Gate</p>
        <h2 className="mt-3 text-4xl font-semibold tracking-tight">Connect Dashboard</h2>
        <p className="mt-4 text-sm leading-6 text-stone-600">
          This dashboard stores a Basic Auth credential locally and uses it for admin API requests to the server package.
        </p>

        <form className="mt-8 grid gap-4" onSubmit={onSubmit}>
          <label className="grid gap-2 text-sm">
            <span className="text-stone-600">Server URL</span>
            <input
              className="rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
              onChange={(event) => setServerUrl(event.target.value)}
              required
              value={serverUrl}
            />
          </label>
          <label className="grid gap-2 text-sm">
            <span className="text-stone-600">Username</span>
            <input
              className="rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
              onChange={(event) => setUsername(event.target.value)}
              required
              value={username}
            />
          </label>
          <label className="grid gap-2 text-sm">
            <span className="text-stone-600">Password</span>
            <input
              className="rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </label>
          {error ? <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
          <button
            className="rounded-full bg-orange-600 px-5 py-3 text-sm font-medium text-white transition hover:-translate-y-0.5 hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "Connecting..." : "Login"}
          </button>
        </form>
      </section>
    </main>
  );
}
