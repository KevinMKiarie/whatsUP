/**
 * Creates the first admin user for the dashboard.
 * Run once after setup: pnpm --filter @whatsup/web create-admin
 *
 * Reads from env (or falls back to defaults):
 *   ADMIN_EMAIL    — email address
 *   ADMIN_PASSWORD — password (min 8 chars)
 *   ADMIN_NAME     — display name
 */
import { config } from 'dotenv';
import { resolve } from 'path';
import { auth } from '../src/lib/auth';

config({ path: resolve(__dirname, '../../../.env') });

async function main() {
  const email    = process.env.ADMIN_EMAIL    ?? 'admin@glowstudio.co';
  const password = process.env.ADMIN_PASSWORD ?? 'admin1234';
  const name     = process.env.ADMIN_NAME     ?? 'Admin';

  try {
    const result = await auth.api.signUpEmail({
      body: { name, email, password },
    });

    if (result.error) {
      console.error('Error:', (result.error as { message?: string }).message ?? result.error);
      process.exit(1);
    }

    console.log(`✓ Admin created: ${result.user?.email}`);
  } catch (err: unknown) {
    console.error('Failed:', err instanceof Error ? err.message : err);
    process.exit(1);
  }
}

main();
