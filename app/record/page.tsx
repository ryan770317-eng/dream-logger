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
    if (!nick) {
      router.replace('/');
    } else {
      setUserId(nick);
    }
  }, [router]);

  const handleRecordingComplete = (blob: Blob, duration: number) => {
    const newRec: PendingRecording = {
      id: String(Date.now()),
      blob,
      timestamp: new Date(),
      duration,
      status: 'pending',
    };
    setRecordings((prev) => [newRec, ...prev]);
  };

  const handleTranscribe = async (id: string) => {
    const rec = recordings.find((r) => r.id === id);
    if (!rec) return;

    setRecordings((prev) =>
      prev.map((r) => r.id === id ? { ...r, status: 'processing', error: undefined } : r)
    );

    try {
      const formData = new FormData();
      const ext = rec.blob.type.includes('mp4') ? 'audio.m4a' : 'audio.webm';
      formData.append('audio', rec.blob, ext);

      const transcribeRes = await fetch('/api/transcribe', { method: 'POST', body: formData });
      if (!transcribeRes.ok) {
        const errData = await transcribeRes.json().catch(() => ({}));
        throw new Error(errData.error || '語音辨識失敗');
      }
      const { transcript } = await transcribeRes.json();

      const analyzeRes = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript }),
      });
      if (!analyzeRes.ok) {
        const errData = await analyzeRes.json().catch(() => ({}));
        throw new Error(errData.error || '夢境分析失敗');
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
      await addDoc(collection(db, 'dreams'), {
        userId,
        createdAt: serverTimestamp(),
        transcript: editedTranscript,
        ...editedAnalysis,
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

  const handleDiscard = () => {
    setPreviewData(null);
  };

  const handleDeleteRecording = (id: string) => {
    setRecordings((prev) => prev.filter((r) => r.id !== id));
  };

  const handleLogout = () => {
    clearNickname();
    router.push('/');
  };

  if (!userId) return null;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header
        className="flex items-center justify-between px-5 py-3 sticky top-0 z-20"
        style={{
          background: 'rgba(8,8,18,0.85)',
          borderBottom: '1px solid var(--border)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        }}
      >
        <button
          onClick={() => router.push('/dreams')}
          className="text-sm transition-colors"
          style={{ color: 'var(--muted)' }}
        >
          我的夢境
        </button>
        <span className="text-sm mono" style={{ color: 'var(--accent)' }}>
          🌙 {userId}
        </span>
        <button
          onClick={handleLogout}
          className="text-sm transition-colors"
          style={{ color: 'var(--muted)' }}
        >
          登出
        </button>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col px-4 pb-8">
        {recordings.length === 0 ? (
          /* Empty state: centered big record button */
          <div className="flex-1 flex flex-col items-center justify-center gap-6">
            <div className="text-center mb-2">
              <h1 className="text-2xl font-semibold mb-1" style={{ color: 'var(--text)' }}>
                記錄夢境
              </h1>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                按住麥克風，說出你的夢
              </p>
            </div>
            <RecordButton onRecordingComplete={handleRecordingComplete} />
          </div>
        ) : (
          /* Has recordings: compact button + list */
          <div className="flex flex-col gap-5 pt-5">
            {/* Compact record button */}
            <div className="flex flex-col items-center gap-2">
              <RecordButton onRecordingComplete={handleRecordingComplete} compact />
              <p className="text-xs mono" style={{ color: 'var(--muted)' }}>
                按住錄製新夢境
              </p>
            </div>

            {/* Recordings list */}
            <div className="space-y-3">
              <h2 className="text-xs mono px-1" style={{ color: 'var(--muted)' }}>
                待辨識錄音 ({recordings.length})
              </h2>
              {recordings.map((rec) => (
                <RecordingCard
                  key={rec.id}
                  rec={rec}
                  onTranscribe={handleTranscribe}
                  onDelete={handleDeleteRecording}
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
          onDiscard={handleDiscard}
          isSaving={isSaving}
        />
      )}
    </div>
  );
}

function RecordingCard({
  rec,
  onTranscribe,
  onDelete,
}: {
  rec: PendingRecording;
  onTranscribe: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div
      className="panel p-4 flex items-center gap-3"
      style={
        rec.status === 'error'
          ? { borderColor: 'rgba(248,113,113,0.3)', background: 'rgba(248,113,113,0.06)' }
          : {}
      }
    >
      {/* Status dot */}
      <div className="shrink-0">
        {rec.status === 'pending' && (
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ background: 'var(--accent)' }}
          />
        )}
        {rec.status === 'processing' && (
          <div
            className="w-2.5 h-2.5 rounded-full animate-pulse"
            style={{ background: 'var(--sky)' }}
          />
        )}
        {rec.status === 'error' && (
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ background: 'var(--danger)' }}
          />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm mono font-medium" style={{ color: 'var(--text)' }}>
            {formatTimestamp(rec.timestamp)}
          </span>
          <span
            className="text-xs mono px-1.5 py-0.5 rounded"
            style={{
              background: 'var(--accent-dim)',
              color: 'var(--accent)',
              border: '1px solid var(--border)',
            }}
          >
            {formatDuration(rec.duration)}
          </span>
        </div>
        {rec.status === 'error' && rec.error && (
          <p className="text-xs mt-1 truncate" style={{ color: 'var(--danger)' }}>
            {rec.error}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {rec.status === 'pending' && (
          <button
            onClick={() => onTranscribe(rec.id)}
            className="btn-accent text-xs px-3 py-1.5"
          >
            開始辨識
          </button>
        )}
        {rec.status === 'processing' && (
          <span className="text-xs mono" style={{ color: 'var(--sky)' }}>
            辨識中...
          </span>
        )}
        {rec.status === 'error' && (
          <button
            onClick={() => onTranscribe(rec.id)}
            className="text-xs px-3 py-1.5 rounded-lg transition-colors"
            style={{
              background: 'var(--danger-dim)',
              color: 'var(--danger)',
              border: '1px solid rgba(248,113,113,0.3)',
            }}
          >
            重試
          </button>
        )}
        {rec.status !== 'processing' && (
          <button
            onClick={() => onDelete(rec.id)}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-sm transition-colors"
            style={{ color: 'var(--muted)' }}
            aria-label="刪除錄音"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
