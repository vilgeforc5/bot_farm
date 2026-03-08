export interface StoredAuth {
  serverUrl: string;
  username: string;
  password: string;
}

const storageKey = "bot-farm-admin-auth";

export const buildBasicAuthHeader = (auth: StoredAuth): string =>
  `Basic ${btoa(`${auth.username}:${auth.password}`)}`;

export const readAuth = (): StoredAuth | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(storageKey);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as StoredAuth;
  } catch {
    return null;
  }
};

export const writeAuth = (auth: StoredAuth): void => {
  window.localStorage.setItem(storageKey, JSON.stringify(auth));
};

export const clearAuth = (): void => {
  window.localStorage.removeItem(storageKey);
};
