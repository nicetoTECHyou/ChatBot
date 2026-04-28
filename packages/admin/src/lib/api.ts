// API Client with Basic Auth for nicetoAIyou Bot

const API_BASE = typeof window !== 'undefined' 
  ? (process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001/api')
  : '';

interface AuthCredentials {
  username: string;
  password: string;
}

function getCredentials(): AuthCredentials | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem('sf_credentials');
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

function getAuthHeader(): HeadersInit {
  const creds = getCredentials();
  if (!creds) return {};
  const encoded = btoa(`${creds.username}:${creds.password}`);
  return {
    'Authorization': `Basic ${encoded}`,
    'Content-Type': 'application/json',
  };
}

export async function apiGet<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'GET',
    headers: getAuthHeader(),
  });
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

export async function apiPost<T>(endpoint: string, body?: unknown): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: getAuthHeader(),
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

export async function apiPut<T>(endpoint: string, body?: unknown): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'PUT',
    headers: getAuthHeader(),
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

export async function apiDelete<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'DELETE',
    headers: getAuthHeader(),
  });
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

export async function verifyCredentials(username: string, password: string): Promise<boolean> {
  try {
    const encoded = btoa(`${username}:${password}`);
    const response = await fetch(`${API_BASE}/status`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${encoded}`,
        'Content-Type': 'application/json',
      },
    });
    return response.ok;
  } catch {
    return false;
  }
}

export function setCredentials(username: string, password: string): void {
  localStorage.setItem('sf_credentials', JSON.stringify({ username, password }));
}

export function clearCredentials(): void {
  localStorage.removeItem('sf_credentials');
}

export function hasCredentials(): boolean {
  return getCredentials() !== null;
}
