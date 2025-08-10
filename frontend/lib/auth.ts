const API = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:4000';

export async function fetchWithRefresh(input: RequestInfo | URL, init?: RequestInit) {
  const res = await fetch(input, { ...init, credentials: 'include' });
  if (res.status !== 401) return res;

  // coba refresh sekali
  const r = await fetch(`${API}/auth/refresh`, { method: 'POST', credentials: 'include' });
  if (!r.ok) return res; // gagal refresh → balikin 401 awal
  return fetch(input, { ...init, credentials: 'include' });
}

export async function getMe() {
  const res = await fetchWithRefresh(`${API}/auth/me`, { method: 'GET' });
  if (!res.ok) throw new Error('Unauthorized');
  return res.json() as Promise<{ user: { id: string; fullName: string; email: string; username: string; emailVerifiedAt: string | null; role: 'USER' | 'ADMIN' } }>;
}
