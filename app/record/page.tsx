'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getNickname, clearNickname } from '@/lib/auth';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import RecordButton from '@/components/RecordButton';
import PreviewModal from '@/components/PreviewModal';
import { DreamAnalysis } from '@/lib/types';

interface PendingRecording {
  id: string;
  blob: Blob;
  timestamp: Date;
  duration: number;
  status: 'pending' | 'processing' | 'error';
  error?: string;
}

interface PreviewData {
  analysis: DreamAnalysis;
  transcript: string;
  recordingId: string;
}

function formatTimestamp(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const hhmm = date.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false });
  if (d.getTime() === today.getTime()) return `今天 ${hhmm}`;
  if (d.getTime() === yesterday.getTime()) return `昨天 ${hhmm}`;
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${mm}/${dd} ${hhmm}`;
}

function formatDuration(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function RecordPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [recordings, setRecordings] = useState<PendingRecording[]>([]);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const nick = getNickname();
    if (!nick) router.replace('/');
    else setUserId(nick);
  }, [router]);

  const handleRecordingComplete = (blob: Blob, duration: number) => {
    setRecordings((prev) => [
      { id: String(Date.now()), blob, timestamp: new Date(), duration, status: 'pending' },
      ...prev,
    ]);
  };

  const handleAnalyze = async (id: string) => {
    const rec = recordings.find((r) => r.id === id);
    if (!rec) return;

    setRecordings((prev) =>
      prev.map((r) => r.id === id ? { ...r, status: 'processing', error: undefined } : r)
    );

    try {
      // Step 1: Groq Whisper transcription
      const formData = new FormData();
      const ext = rec.blob.type.includes('mp4') || rec.blob.type.includes('m4a') ? 'audio.m4a'
        : rec.blob.type.includes('ogg') ? 'audio.ogg'
        : 'audio.webm';
      formData.append('audio', rec.blob, ext);

      const transcribeRes = await fetch('/api/transcribe', { method: 'POST', body: formData });
      if (!transcribeRes.ok) {
        const e = await transcribeRes.json().catch(() => ({}));
        throw new Error((e.error || '語音辨識失敗') + (e.detail ? ` (${e.detail})` : ''));
      }
      const { transcript } = await transcribeRes.json();

      // Step 2: Claude analysis
      const analyzeRes = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript }),
      });
      if (!analyzeRes.ok) {
        const e = await analyzeRes.json().catch(() => ({}));
        throw new Error((e.error || '夢境分析失敗') + (e.detail ? ` (${e.detail})` : ''));
      }
      const analysis: DreamAnalysis = await analyzeRes.json();

      setRecordings((prev) =>
        prev.map((r) => r.id === id ? { ...r, status: 'pending' } : r)
      );
      setPreviewData({ analysis, transcript, recordingId: id });
    } catch (err) {
      const msg = err instanceof Error ? err.message : '發生錯誤';
      setRecordings((prev) =>
        prev.map((r) => r.id === id ? { ...r, status: 'error', error: msg } : r)
      );
    }
  };

  const handleSave = async (editedAnalysis: DreamAnalysis, editedTranscript: string) => {
    if (!userId || !previewData) return;
    setIsSaving(true);
    try {
      // Strip undefined values — Firestore does not accept undefined fields
      const cleanedAnalysis = Object.fromEntries(
        Object.entries(editedAnalysis).filter(([, v]) => v !== undefined && v !== '')
      );
      await addDoc(collection(db, 'dreams'), {
        userId,
        createdAt: serverTimestamp(),
        transcript: editedTranscript,
        ...cleanedAnalysis,
      });
      setRecordings((prev) => prev.filter((r) => r.id !== previewData.recordingId));
      setPreviewData(null);
      router.push('/dreams');
    } catch {
      alert('儲存失敗，請稍後再試');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    clearNickname();
    router.push('/');
  };

  if (!userId) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <header
        className="flex items-center justify-between px-5 py-3 sticky top-0 z-20"
        style={{
          background: 'rgba(8,8,18,0.85)',
          borderBottom: '1px solid var(--border)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        }}
      >
        <button onClick={() => router.push('/dreams')} className="text-sm" style={{ color: 'var(--muted)' }}>
          我的夢境
        </button>
        <span className="text-sm mono" style={{ color: 'var(--accent)' }}>🌙 {userId}</span>
        <button onClick={handleLogout} className="text-sm" style={{ color: 'var(--muted)' }}>登出</button>
      </header>

      <main className="flex-1 flex flex-col px-4 pb-8">
        {recordings.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-6">
            <div className="text-center mb-2">
              <h1 className="text-2xl font-semibold mb-1" style={{ color: 'var(--text)' }}>記錄夢境</h1>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>點擊麥克風，說出你的夢</p>
            </div>
            <RecordButton onRecordingComplete={handleRecordingComplete} />
          </div>
        ) : (
          <div className="flex flex-col gap-5 pt-5">
            <div className="flex flex-col items-center">
              <RecordButton onRecordingComplete={handleRecordingComplete} compact />
            </div>
            <div className="space-y-3">
              <h2 className="text-xs mono px-1" style={{ color: 'var(--muted)' }}>
                待分析錄音 ({recordings.length})
              </h2>
              {recordings.map((rec) => (
                <RecordingCard
                  key={rec.id}
                  rec={rec}
                  onAnalyze={handleAnalyze}
                  onDelete={(id) => setRecordings((prev) => prev.filter((r) => r.id !== id))}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      {previewData && (
        <PreviewModal
          transcript={previewData.transcript}
          analysis={previewData.analysis}
          onSave={handleSave}
          onDiscard={() => setPreviewData(null)}
          isSaving={isSaving}
        />
      )}
    </div>
  );
}

function RecordingCard({
  rec,
  onAnalyze,
  onDelete,
}: {
  rec: PendingRecording;
  onAnalyze: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div
      className="panel p-4 flex items-center gap-3"
      style={rec.status === 'error' ? { borderColor: 'rgba(248,113,113,0.3)', background: 'rgba(248,113,113,0.06)' } : {}}
    >
      <div className="shrink-0">
        {rec.status === 'pending' && <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--accent)' }} />}
        {rec.status === 'processing' && <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: 'var(--sky)' }} />}
        {rec.status === 'error' && <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--danger)' }} />}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm mono font-medium" style={{ color: 'var(--text)' }}>
            {formatTimestamp(rec.timestamp)}
          </span>
          <span className="text-xs mono px-1.5 py-0.5 rounded" style={{ background: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid var(--border)' }}>
            {formatDuration(rec.duration)}
          </span>
        </div>
        {rec.status === 'error' && rec.error && (
          <p className="text-xs mt-1" style={{ color: 'var(--danger)', wordBreak: 'break-all' }}>{rec.error}</p>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => {
            const url = URL.createObjectURL(rec.blob);
            const a = document.createElement('a');
            const ext = rec.blob.type.includes('mp4') || rec.blob.type.includes('m4a') ? 'm4a'
              : rec.blob.type.includes('ogg') ? 'ogg' : 'webm';
            a.href = url;
            a.download = `dream-${rec.id}.${ext}`;
            a.click();
            URL.revokeObjectURL(url);
          }}
          className="text-xs px-2 py-1.5 rounded-lg"
          style={{ color: 'var(--muted)', border: '1px solid var(--border)' }}
          title="下載音檔"
        >
          ⬇
        </button>
        {rec.status === 'pending' && (
          <button onClick={() => onAnalyze(rec.id)} className="btn-accent text-xs px-3 py-1.5">
            辨識
          </button>
        )}
        {rec.status === 'processing' && (
          <span className="text-xs mono" style={{ color: 'var(--sky)' }}>辨識中...</span>
        )}
        {rec.status === 'error' && (
          <button
            onClick={() => onAnalyze(rec.id)}
            className="text-xs px-3 py-1.5 rounded-lg"
            style={{ background: 'var(--danger-dim)', color: 'var(--danger)', border: '1px solid rgba(248,113,113,0.3)' }}
          >
            重試
          </button>
        )}
        {rec.status !== 'processing' && (
          <button onClick={() => onDelete(rec.id)} className="w-7 h-7 flex items-center justify-center rounded-lg text-sm" style={{ color: 'var(--muted)' }}>
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
