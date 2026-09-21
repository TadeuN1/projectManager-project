const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';
const API_KEY = import.meta.env.VITE_API_KEY ?? 'thekey';

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      ...(init?.headers ?? {}),
    },
  });
  if (res.status === 204) return undefined as T;
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()) as T;
}

export function apiUrl(): string {
  return API_URL;
}
