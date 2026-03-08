import { startTransition, useState, type FormEvent } from "react";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { apiFetch } from "../lib/api";
import { readAuth, type StoredAuth, writeAuth } from "../lib/auth";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

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
      setError(submitError instanceof Error ? submitError.message : "Не удалось войти");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="mx-auto grid min-h-[calc(100vh-104px)] w-full max-w-7xl place-items-center px-4 pb-10 sm:px-6 lg:px-8">
      <Card className="w-full max-w-lg">
        <CardContent className="p-8">
        <p className="text-xs uppercase tracking-[0.3em] text-stone-500">Вход администратора</p>
        <h2 className="mt-3 text-4xl font-semibold tracking-tight">Подключение панели</h2>
        <p className="mt-4 text-sm leading-6 text-stone-600">
          Панель хранит локально данные Basic Auth и использует их для запросов к административному API сервера.
        </p>

        <form className="mt-8 grid gap-4" onSubmit={onSubmit}>
          <div className="grid gap-2">
            <Label>Адрес сервера</Label>
            <Input
              onChange={(event) => setServerUrl(event.target.value)}
              required
              value={serverUrl}
            />
          </div>
          <div className="grid gap-2">
            <Label>Имя пользователя</Label>
            <Input
              onChange={(event) => setUsername(event.target.value)}
              required
              value={username}
            />
          </div>
          <div className="grid gap-2">
            <Label>Пароль</Label>
            <Input
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </div>
          {error ? <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
          <Button disabled={isSubmitting} type="submit">
            {isSubmitting ? "Подключение..." : "Войти"}
          </Button>
        </form>
        </CardContent>
      </Card>
    </main>
  );
}
