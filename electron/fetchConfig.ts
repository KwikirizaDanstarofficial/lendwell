// Railway API URL — not a secret, intentionally bundled.
// Override via RAILWAY_API_URL env var during build for your actual URL.
const API_URL = process.env.RAILWAY_API_URL || 'https://config-server-production.up.railway.app';

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  config: Record<string, string>;
}

export async function loginAndFetchConfig(
  email: string,
  password: string
): Promise<LoginResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const body: any = await response.json().catch(() => ({}));
      throw new Error(body.detail || 'Login failed');
    }

    const data: any = await response.json();
    return data as LoginResponse;
  } finally {
    clearTimeout(timeout);
  }
}

export function getApiUrl(): string {
  return API_URL;
}
