import { TanStackDevtools } from "@tanstack/react-devtools";
import { Link, Outlet, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { Toaster } from "../components/ui/sonner";
import { clearAuth, readAuth } from "../lib/auth";
import "../styles.css";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  const auth = readAuth();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(217,119,69,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(15,118,110,0.16),transparent_28%),linear-gradient(180deg,#fbf7f1_0%,#f2e7d7_100%)] text-stone-900">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-6 sm:px-6 lg:px-8">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-stone-500">
            Панель оператора
          </p>
          <Link to="/">
            <h1 className="text-2xl font-semibold tracking-tight">
              Ферма Telegram-ботов
            </h1>
          </Link>
        </div>
        <div className="flex items-center gap-3">
          {auth ? (
            <Link
              className="rounded-full border border-black/10 bg-white/70 px-4 py-2 text-sm text-stone-600 transition hover:bg-stone-100"
              to="/errors"
            >
              Ошибки
            </Link>
          ) : null}

          {auth ? (
            <Link
              className="rounded-full border border-black/10 bg-white/70 px-4 py-2 text-sm text-stone-600 transition hover:bg-stone-100"
              to="/"
            >
              Главная
            </Link>
          ) : null}

          {auth ? (
            <span className="rounded-full border border-black/10 bg-white/70 px-4 py-2 text-sm text-stone-600">
              {auth.username}@{new URL(auth.serverUrl).host}
            </span>
          ) : null}
          {auth ? (
            <button
              className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm transition hover:bg-stone-100"
              onClick={() => {
                clearAuth();
                window.location.href = "/login";
              }}
              type="button"
            >
              Выйти
            </button>
          ) : null}
        </div>
      </header>
      <Outlet />
      <Toaster position="top-right" />
      <TanStackDevtools
        config={{
          position: "bottom-right",
        }}
        plugins={[
          {
            name: "TanStack Router",
            render: <TanStackRouterDevtoolsPanel />,
          },
        ]}
      />
    </div>
  );
}
