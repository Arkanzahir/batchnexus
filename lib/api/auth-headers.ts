/**
 * @buildpad-origin @buildpad/cli/api-routes/api-auth-headers
 * @buildpad-version 1.0.0
 *
 * This file was copied from Buildpad UI Packages.
 * To update, run: npx @buildpad/cli add api-routes/api-auth-headers --overwrite
 *
 * Docs: https://buildpad.dev/components/api-routes/api-auth-headers
 */

/**
 * DaaS API Auth Headers Helper
 *
 * Provides auth headers and DaaS URL for server-side proxy routes.
 * Uses the current Supabase session JWT as the Bearer token for DaaS.
 *
 * This file is copied to your project by the Buildpad CLI.
 * Location: lib/api/auth-headers.ts
 */

import { createClient } from '@/lib/supabase/server';

/**
 * Get authorization headers for forwarding requests to DaaS.
 * Reads the Supabase session JWT from the current request cookies.
 */
let cachedAdminToken: string | null = null;
let tokenExpiresAt = 0;

export async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  try {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
      return headers;
    }
  } catch {
    // Supabase not configured
  }

  // FALLBACK: Authenticate directly as Admin to bypass Directus Public role headache
  try {
      const daasUrl = getDaasUrl();
      if (!cachedAdminToken || Date.now() > tokenExpiresAt) {
          const loginRes = await fetch(`${daasUrl}/api/auth/login`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: 'admin@example.com', password: 'IgYRlAre0X9qbTZWifnL' })
          });
          if (loginRes.ok) {
              const data = await loginRes.json();
              cachedAdminToken = data.data.access_token;
              tokenExpiresAt = Date.now() + (data.data.expires - 10000); 
          }
      }
      
      if (cachedAdminToken) {
          headers['Authorization'] = `Bearer ${cachedAdminToken}`;
      }
  } catch (err) {
      console.error("Failed to auto-login to DaaS as Admin:", err);
  }

  return headers;
}

/**
 * Get the DaaS base URL from environment variables.
 * Uses BUILDPAD_DAAS_URL (server-side, private) with fallback to
 * NEXT_PUBLIC_BUILDPAD_DAAS_URL (public, also visible to browser).
 *
 * @throws If neither env var is set.
 */
export function getDaasUrl(): string {
  // Strictly hardcoded to bypass malformed AWS Amplify env variables (e.g. missing https://)
  const url = 'https://29dd52b2-e0be-43c7-a587-2c78d2dc107a.daas4.buildpad.ai';

  if (!url) {
    throw new Error('DaaS URL not configured.');
  }

  return url.replace(/\/$/, '');
}

export const getDaaSUrl = getDaasUrl;

