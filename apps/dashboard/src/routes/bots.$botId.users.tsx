import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Button } from "../components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import type { BotRecord, BotUserRecord, BotUsersPageData } from "../lib/api";
import { apiFetch } from "../lib/api";
import { readAuth } from "../lib/auth";

export const Route = createFileRoute("/bots/$botId/users")({
  beforeLoad: () => {
    if (typeof window !== "undefined" && !readAuth()) {
      throw redirect({ to: "/login" });
    }
  },
  component: BotUsersPage,
});

const PAGE_SIZE = 20;

const columns: ColumnDef<BotUserRecord>[] = [
  {
    accessorKey: "chatId",
    header: "Chat ID",
    cell: ({ getValue }) => (
      <span className="font-mono text-xs">{String(getValue())}</span>
    ),
  },
  {
    accessorKey: "userId",
    header: "Username / User ID",
    cell: ({ getValue }) => (
      <span className="font-mono text-xs text-stone-600">
        {String(getValue())}
      </span>
    ),
  },
  {
    accessorKey: "countryName",
    header: "Country",
    cell: ({ row }) => (
      <span className="text-sm">
        {row.original.countryName}
        <span className="ml-1.5 text-xs text-stone-400">
          {row.original.countryCode}
        </span>
      </span>
    ),
  },
  {
    accessorKey: "totalChars",
    header: "Token usage (chars)",
    cell: ({ getValue }) => (
      <span className="tabular-nums text-sm">
        {Number(getValue()).toLocaleString()}
      </span>
    ),
  },
  {
    accessorKey: "lastMessageText",
    header: "Last message",
    cell: ({ getValue, row }) => {
      const text = getValue() as string | null;
      return (
        <div className="max-w-[280px]">
          {text ? (
            <p className="truncate text-sm text-stone-700">{text}</p>
          ) : (
            <span className="text-xs text-stone-400">—</span>
          )}
          {row.original.lastMessageAt && (
            <p className="mt-0.5 text-[10px] text-stone-400">
              {new Date(row.original.lastMessageAt).toLocaleString()}
            </p>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "modelsUsed",
    header: "Models used",
    cell: ({ getValue }) => {
      const models = getValue() as string[];
      if (!models.length)
        return <span className="text-xs text-stone-400">—</span>;
      return (
        <div className="flex flex-wrap gap-1">
          {models.map((m) => (
            <span
              key={m}
              className="rounded-full bg-stone-100 px-2 py-0.5 font-mono text-[10px] text-stone-600"
            >
              {m}
            </span>
          ))}
        </div>
      );
    },
  },
];

function BotUsersPage() {
  const auth = readAuth()!;
  const { botId } = Route.useParams();
  const [page, setPage] = useState(1);

  const botQuery = useQuery({
    queryKey: ["bot", auth.serverUrl, botId],
    queryFn: () => apiFetch<BotRecord>(auth, `/api/admin/db/bots/${botId}`),
    staleTime: 30_000,
  });

  const usersQuery = useQuery({
    queryKey: ["bot-users", auth.serverUrl, botId, page],
    queryFn: () =>
      apiFetch<BotUsersPageData>(
        auth,
        `/api/admin/db/bots/${botId}/users?page=${page}&pageSize=${PAGE_SIZE}`,
      ),
    staleTime: 10_000,
    placeholderData: (prev) => prev,
  });

  const bot = botQuery.data;
  const data = usersQuery.data;
  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const table = useReactTable({
    data: items,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: totalPages,
  });

  return (
    <main className="mx-auto w-full max-w-[1400px] px-4 pb-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <Link
          className="text-xs text-stone-400 hover:text-stone-600 uppercase tracking-widest"
          to="/"
        >
          ← Dashboard
        </Link>
        <p className="text-[11px] uppercase tracking-[0.28em] text-stone-500 mt-4">
          Пользователи бота
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          {bot?.name ?? `Bot #${botId}`}
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          {total > 0 ? `${total.toLocaleString()} диалогов` : "Загрузка..."}
        </p>
      </div>

      <div className="rounded-[1.5rem] border border-black/10 bg-white/80 shadow-[0_20px_50px_rgba(0,0,0,0.05)] backdrop-blur overflow-hidden">
        {usersQuery.isError ? (
          <div className="px-6 py-12 text-center text-sm text-red-600">
            Не удалось загрузить данные.
          </div>
        ) : items.length === 0 && !usersQuery.isLoading ? (
          <div className="px-6 py-12 text-center text-sm text-stone-400">
            Нет пользователей
          </div>
        ) : (
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow
                  key={headerGroup.id}
                  className="border-b border-black/8"
                >
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {usersQuery.isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {columns.map((_, j) => (
                        <TableCell key={j}>
                          <div className="h-4 rounded bg-stone-100 animate-pulse" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                : table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-black/5 px-6 py-3">
            <p className="text-xs text-stone-400">
              Страница {page} из {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                size="sm"
                type="button"
                variant="outline"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                size="sm"
                type="button"
                variant="outline"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
