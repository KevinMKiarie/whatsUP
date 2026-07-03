'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authClient } from '@/lib/auth-client';

export default function RegisterPage() {
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError('');

    const { error: err } = await authClient.signUp.email({ name, email, password });

    if (err) {
      setError(err.message ?? 'Registration failed');
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
          <h1 className="text-[15px] font-semibold text-[#1C1C1E]">Create your account</h1>
          <p className="mt-1 text-[11.5px] text-[#AEAEB2]">WhatsUP Dashboard</p>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <input
            type="text"
            placeholder="Full name"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full rounded-xl border border-black/[0.1] bg-[#FAFAF8] px-3.5 py-2.5 text-[13px] text-[#1C1C1E] placeholder:text-[#AEAEB2] outline-none focus:border-[#FF9500] focus:ring-2 focus:ring-[rgba(255,149,0,0.15)] transition-all"
            required
          />
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
            minLength={8}
            className="w-full rounded-xl border border-black/[0.1] bg-[#FAFAF8] px-3.5 py-2.5 text-[13px] text-[#1C1C1E] placeholder:text-[#AEAEB2] outline-none focus:border-[#FF9500] focus:ring-2 focus:ring-[rgba(255,149,0,0.15)] transition-all"
            required
          />
          <input
            type="password"
            placeholder="Confirm password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            minLength={8}
            className={`w-full rounded-xl border bg-[#FAFAF8] px-3.5 py-2.5 text-[13px] text-[#1C1C1E] placeholder:text-[#AEAEB2] outline-none focus:ring-2 transition-all ${
              confirm && confirm !== password
                ? 'border-[#FF3B30] focus:border-[#FF3B30] focus:ring-[rgba(255,59,48,0.15)]'
                : 'border-black/[0.1] focus:border-[#FF9500] focus:ring-[rgba(255,149,0,0.15)]'
            }`}
            required
          />

          {error && <p className="text-[11px] text-[#FF3B30]">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#FF9500] py-2.5 text-[13px] font-semibold text-white hover:bg-[#E68900] disabled:opacity-60 transition-colors"
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="mt-5 text-center text-[11.5px] text-[#AEAEB2]">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-[#FF9500] hover:text-[#E68900] transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
