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

// Server-side authentication function for API routes
export async function getServerAuth(request: Request) {
  const API = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:4000';
  
  // Extract cookies from the request
  const cookies = request.headers.get('cookie') || '';
  
  try {
    const res = await fetch(`${API}/auth/me`, {
      method: 'GET',
      headers: {
        cookie: cookies,
      },
    });
    
    if (!res.ok) {
      return { user: null, error: 'Unauthorized' };
    }
    
    const data = await res.json() as { user: { id: string; fullName: string; email: string; username: string; emailVerifiedAt: string | null; role: 'USER' | 'ADMIN' } };
    return { user: data.user, error: null };
  } catch (error) {
    console.error('Server auth error:', error);
    return { user: null, error: 'Authentication failed' };
  }
}
