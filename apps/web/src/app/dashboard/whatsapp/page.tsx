'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Smartphone, RefreshCw, CheckCircle2, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { API_BASE } from '@/lib/api';

type ConnectionState = 'open' | 'connecting' | 'close' | 'unreachable' | 'unknown' | 'error';

interface Status {
  state: ConnectionState;
  phoneNumber?: string;
}

interface QrData {
  qr?: string;
  state: string;
}

const STATE_LABELS: Record<ConnectionState, string> = {
  open:        'Connected',
  connecting:  'Connecting…',
  close:       'Disconnected',
  unreachable: 'Evolution API unreachable',
  unknown:     'Unknown',
  error:       'Error',
};

const STATE_COLORS: Record<ConnectionState, string> = {
  open:        'bg-[#34C759]/10 text-[#34C759]',
  connecting:  'bg-[#FF9500]/10 text-[#FF9500]',
  close:       'bg-[#FF3B30]/10 text-[#FF3B30]',
  unreachable: 'bg-[#8E8E93]/10 text-[#8E8E93]',
  unknown:     'bg-[#8E8E93]/10 text-[#8E8E93]',
  error:       'bg-[#FF3B30]/10 text-[#FF3B30]',
};

export default function WhatsAppPage() {
  const [status, setStatus]           = useState<Status | null>(null);
  const [qrData, setQrData]           = useState<QrData | null>(null);
  const [creating, setCreating]       = useState(false);
  const [createMsg, setCreateMsg]     = useState('');
  const [loadingQr, setLoadingQr]     = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/whatsapp/status`);
      const data: Status = await res.json();
      setStatus(data);
      return data.state;
    } catch {
      setStatus({ state: 'unreachable' });
      return 'unreachable';
    }
  }, []);

  const fetchQr = useCallback(async () => {
    setLoadingQr(true);
    try {
      const res = await fetch(`${API_BASE}/whatsapp/qr`);
      const data: QrData = await res.json();
      setQrData(data);
    } finally {
      setLoadingQr(false);
    }
  }, []);

  // Poll status every 5 s; fetch QR when disconnected
  useEffect(() => {
    fetchStatus();

    pollRef.current = setInterval(async () => {
      const state = await fetchStatus();
      if (state === 'open') {
        setQrData(null);
        if (pollRef.current) clearInterval(pollRef.current);
      }
    }, 5000);

    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchStatus]);

  // Auto-load QR when state is 'close'
  useEffect(() => {
    if (status?.state === 'close') fetchQr();
  }, [status?.state, fetchQr]);

  async function handleCreateInstance() {
    setCreating(true);
    setCreateMsg('');
    try {
      const webhookUrl = `${window.location.origin.replace('3000', '3001')}/api/whatsapp/webhook`;
      const res = await fetch(`${API_BASE}/whatsapp/instance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookUrl }),
      });
      const data = await res.json();
      setCreateMsg(data.message);
      if (data.created) {
        await fetchStatus();
        await fetchQr();
      }
    } finally {
      setCreating(false);
    }
  }

  const state = status?.state ?? 'unknown';
  const isConnected = state === 'open';

  return (
    <div className="flex-1 p-6 space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#25D366]/10">
          <Smartphone className="h-4.5 w-4.5 text-[#25D366]" />
        </div>
        <div>
          <h1 className="text-[17px] font-semibold text-[#1C1C1E] tracking-[-0.02em]">WhatsApp</h1>
          <p className="text-[12px] text-[#8E8E93]">Connect your business WhatsApp number</p>
        </div>
      </div>

      {/* Status card */}
      <div className="rounded-2xl border border-black/[0.06] bg-white p-5 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-medium text-[#1C1C1E]">Connection status</span>
          <button
            onClick={fetchStatus}
            className="flex items-center gap-1.5 text-[11px] text-[#8E8E93] hover:text-[#1C1C1E] transition-colors"
          >
            <RefreshCw className="h-3 w-3" />
            Refresh
          </button>
        </div>

        <div className="flex items-center gap-3">
          {isConnected
            ? <CheckCircle2 className="h-8 w-8 text-[#34C759]" />
            : state === 'unreachable'
              ? <WifiOff className="h-8 w-8 text-[#8E8E93]" />
              : state === 'close'
                ? <AlertCircle className="h-8 w-8 text-[#FF3B30]" />
                : <Wifi className="h-8 w-8 text-[#FF9500]" />
          }
          <div>
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STATE_COLORS[state as ConnectionState] ?? STATE_COLORS.unknown}`}>
              {STATE_LABELS[state as ConnectionState] ?? state}
            </span>
            {isConnected && status?.phoneNumber && (
              <p className="mt-0.5 text-[12px] text-[#8E8E93]">{status.phoneNumber}</p>
            )}
          </div>
        </div>

        {/* Unreachable — guide to start Evolution API */}
        {state === 'unreachable' && (
          <div className="rounded-xl bg-[#F2F2F7] p-4 space-y-2">
            <p className="text-[12px] font-medium text-[#1C1C1E]">Evolution API is not running</p>
            <p className="text-[11px] text-[#6E6E73]">Start it with:</p>
            <pre className="rounded-lg bg-[#1C1C1E] px-3 py-2 text-[11px] text-[#F2F2F7] font-mono overflow-x-auto">
              docker compose up evolution -d
            </pre>
          </div>
        )}
      </div>

      {/* Create instance section — only when Evolution is reachable but no instance yet */}
      {(state === 'unknown' || state === 'error') && (
        <div className="rounded-2xl border border-black/[0.06] bg-white p-5 space-y-3">
          <p className="text-[13px] font-medium text-[#1C1C1E]">First-time setup</p>
          <p className="text-[12px] text-[#8E8E93]">
            Create a WhatsApp instance in Evolution API and configure the webhook automatically.
          </p>
          <button
            onClick={handleCreateInstance}
            disabled={creating}
            className="flex items-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 text-[13px] font-semibold text-white transition-opacity disabled:opacity-50"
          >
            {creating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Smartphone className="h-4 w-4" />}
            {creating ? 'Creating instance…' : 'Create instance & connect'}
          </button>
          {createMsg && (
            <p className="text-[11px] text-[#8E8E93]">{createMsg}</p>
          )}
        </div>
      )}

      {/* QR Code section */}
      {state === 'close' && (
        <div className="rounded-2xl border border-black/[0.06] bg-white p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-medium text-[#1C1C1E]">Scan QR code</p>
            <button
              onClick={fetchQr}
              disabled={loadingQr}
              className="flex items-center gap-1.5 text-[11px] text-[#8E8E93] hover:text-[#1C1C1E] transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-3 w-3 ${loadingQr ? 'animate-spin' : ''}`} />
              Regenerate
            </button>
          </div>
          <ol className="space-y-1 text-[12px] text-[#6E6E73] list-decimal list-inside">
            <li>Open WhatsApp on your phone</li>
            <li>Tap <strong>Linked Devices</strong> → <strong>Link a Device</strong></li>
            <li>Point your camera at the QR code below</li>
          </ol>
          <div className="flex justify-center">
            {loadingQr ? (
              <div className="h-48 w-48 rounded-2xl bg-[#F2F2F7] flex items-center justify-center">
                <RefreshCw className="h-6 w-6 text-[#8E8E93] animate-spin" />
              </div>
            ) : qrData?.qr ? (
              <img
                src={qrData.qr}
                alt="WhatsApp QR code"
                className="h-48 w-48 rounded-2xl border border-black/[0.06]"
              />
            ) : (
              <div className="h-48 w-48 rounded-2xl bg-[#F2F2F7] flex flex-col items-center justify-center gap-2">
                <AlertCircle className="h-6 w-6 text-[#8E8E93]" />
                <p className="text-[11px] text-[#8E8E93]">No QR code available</p>
              </div>
            )}
          </div>
          <p className="text-center text-[11px] text-[#8E8E93]">
            QR codes expire after 45 seconds — tap Regenerate if it stops working.
          </p>
        </div>
      )}

      {/* Connected — success state */}
      {isConnected && (
        <div className="rounded-2xl border border-[#34C759]/20 bg-[#34C759]/[0.04] p-5 flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-[#34C759] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-[13px] font-medium text-[#1C1C1E]">WhatsApp is connected</p>
            <p className="text-[12px] text-[#6E6E73]">
              Incoming messages will be processed by the AI and bookings will be created automatically.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
