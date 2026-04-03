'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getNickname } from '@/lib/auth';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Dream } from '@/lib/types';
import DreamDetail from '@/components/DreamDetail';

export default function DreamDetailPage() {
  const [dream, setDream] = useState<Dream | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  useEffect(() => {
    const nick = getNickname();
    if (!nick) {
      router.replace('/');
      return;
    }
    fetchDream(nick);
  }, [id, router]);

  const fetchDream = async (nick: string) => {
    try {
      const ref = doc(db, 'dreams', id);
      const snap = await getDoc(ref);
      if (!snap.exists() || snap.data().userId !== nick) {
        setNotFound(true);
        return;
      }
      setDream({ id: snap.id, ...snap.data() } as Dream);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('確定要刪除這則夢境記錄嗎？')) return;
    await deleteDoc(doc(db, 'dreams', id));
    router.push('/dreams');
  };

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
          ← 返回
        </button>
        <span />
        {dream && (
          <button
            onClick={handleDelete}
            className="text-sm transition-colors"
            style={{ color: 'var(--danger)' }}
          >
            刪除
          </button>
        )}
      </header>

      <main className="flex-1 px-4 pb-8">
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <span className="mono text-sm animate-pulse" style={{ color: 'var(--muted)' }}>
              載入中...
            </span>
          </div>
        ) : notFound ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3">
            <span className="text-4xl">🌫️</span>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>找不到這則夢境</p>
          </div>
        ) : dream ? (
          <DreamDetail dream={dream} />
        ) : null}
      </main>
    </div>
  );
}
