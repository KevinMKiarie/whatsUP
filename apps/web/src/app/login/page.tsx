'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authClient } from '@/lib/auth-client';

export default function LoginPage() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error: err } = await authClient.signIn.email({ email, password });

    if (err) {
      setError(err.message ?? 'Invalid credentials');
      setLoading(false);
    } else {
      router.push('/dashboard');
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F5F4EF]">
      <div className="w-full max-w-sm rounded-2xl border border-black/[0.06] bg-white px-8 py-10 shadow-sm">
        <div className="mb-8 text-center">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#FF9500] text-white font-bold text-lg mb-3">W</span>
          <h1 className="text-[15px] font-semibold text-[#1C1C1E]">WhatsUP Dashboard</h1>
          <p className="mt-1 text-[11.5px] text-[#AEAEB2]">Sign in to continue</p>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full rounded-xl border border-black/[0.1] bg-[#FAFAF8] px-3.5 py-2.5 text-[13px] text-[#1C1C1E] placeholder:text-[#AEAEB2] outline-none focus:border-[#FF9500] focus:ring-2 focus:ring-[rgba(255,149,0,0.15)] transition-all"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full rounded-xl border border-black/[0.1] bg-[#FAFAF8] px-3.5 py-2.5 text-[13px] text-[#1C1C1E] placeholder:text-[#AEAEB2] outline-none focus:border-[#FF9500] focus:ring-2 focus:ring-[rgba(255,149,0,0.15)] transition-all"
            required
          />
          {error && <p className="text-[11px] text-[#FF3B30]">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#FF9500] py-2.5 text-[13px] font-semibold text-white hover:bg-[#E68900] disabled:opacity-60 transition-colors"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-5 text-center text-[11.5px] text-[#AEAEB2]">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-semibold text-[#FF9500] hover:text-[#E68900] transition-colors">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
