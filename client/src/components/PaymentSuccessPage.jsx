import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('confirming');
  const [certificateUrl, setCertificateUrl] = useState('');

  const txRef = useMemo(() => searchParams.get('tx_ref') || '', [searchParams]);
  const email = useMemo(() => searchParams.get('email') || '', [searchParams]);

  useEffect(() => {
    const confirmPayment = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/payments/confirm`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ txRef, email })
        });
        const data = await res.json();
        if (data?.ok) {
          setCertificateUrl(data.certificateUrl || '');
          setStatus('ready');
        } else {
          setStatus('error');
        }
      } catch (error) {
        setStatus('error');
      }
    };

    if (txRef) {
      confirmPayment();
    } else {
      setStatus('error');
    }
  }, [txRef, email]);

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-16 text-slate-50">
      <div className="mx-auto max-w-2xl rounded-[32px] border border-emerald-400/20 bg-slate-900/80 p-8 shadow-[0_0_70px_rgba(16,185,129,0.16)]">
        <p className="text-sm uppercase tracking-[0.35em] text-emerald-300">Payment complete</p>
        <h1 className="mt-3 text-3xl font-semibold">Your certificate is ready</h1>
        <p className="mt-3 text-slate-400">Your premium unlock is confirmed. Use the link below to view your certified report.</p>

        {status === 'confirming' ? (
          <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-800/70 p-4 text-sm text-slate-300">Confirming your unlock...</div>
        ) : status === 'ready' ? (
          <div className="mt-6 space-y-3">
            <a href={certificateUrl} target="_blank" rel="noreferrer" className="inline-flex rounded-2xl bg-gradient-to-r from-cyan-500 to-fuchsia-500 px-4 py-3 font-semibold text-white">Open certificate</a>
            <p className="text-sm text-slate-400">You can also return to the main assessment experience and continue exploring the course library.</p>
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-300">We could not confirm your unlock. Please contact support.</div>
        )}
      </div>
    </div>
  );
}
