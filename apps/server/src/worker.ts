import { startTelegramLongPolling } from "./services/telegram-poller";

startTelegramLongPolling();

// Keep the worker alive while the polling loop reschedules itself.
await new Promise(() => {});
