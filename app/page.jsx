"use client";
import { useState } from "react";

export default function Home() {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [waLink, setWaLink] = useState(null);
  const [session, setSession] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const startCheck = async () => {
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch("/api/getcontact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memulai proses");
      // data: { wa, phone, tkn, aks, hash }
      setWaLink(data.wa);
      setSession({ phone: data.phone, tkn: data.tkn, aks: data.aks, hash: data.hash });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const checkStatus = async () => {
    if (!session) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/getcontact/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(session)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memeriksa status");
      if (data.success && data.tags) {
        setResult(data.tags);
      } else {
        setError(data.message || "Belum terverifikasi");
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: 24, maxWidth: 800, margin: '0 auto' }}>
      <h1>GETCONTACT Checker — Web</h1>
      <p>Masukkan nomor (contoh: 08123456789). Gunakan hanya untuk nomor yang Anda miliki izin untuk cek.</p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="08123456789" />
        <button onClick={startCheck} disabled={loading}>Mulai</button>
        <button onClick={checkStatus} disabled={!session || loading}>Cek Status</button>
      </div>

      {waLink && (
        <div style={{ marginBottom: 12 }}>
          <p>Silakan klik tautan WhatsApp berikut dan kirim pesan verifikasi:</p>
          <a href={waLink} target="_blank" rel="noreferrer">{waLink}</a>
        </div>
      )}

      {loading && <p>Loading…</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {result && (
        <div>
          <h3>Daftar Tag / Nama yang menyimpan nomor:</h3>
          <ul>
            {result.map((t, i) => <li key={i}>{t}</li>)}
          </ul>
        </div>
      )}

    </main>
  );
}
