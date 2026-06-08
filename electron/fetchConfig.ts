// Config Server URL (Render/Railway/etc.) — not a secret, intentionally bundled.
// Override via CONFIG_SERVER_URL env var during CI build or set it below.
const API_URL = process.env.CONFIG_SERVER_URL || 'https://lendwell-config-server.onrender.com';

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
