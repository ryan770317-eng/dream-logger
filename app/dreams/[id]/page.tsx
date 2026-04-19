'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getNickname } from '@/lib/auth';
import {
  doc,
  getDoc,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  getDocs,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Dream } from '@/lib/types';
import DreamDetail from '@/components/DreamDetail';

export default function DreamDetailPage() {
  const [dream, setDream] = useState<Dream | null>(null);
  const [missionIndex, setMissionIndex] = useState<number | null>(null);
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

      // Compute mission index based on creation order (1 = earliest)
      try {
        const q = query(
          collection(db, 'dreams'),
          where('userId', '==', nick),
          orderBy('createdAt', 'desc'),
        );
        const all = await getDocs(q);
        const ordered = all.docs.map((d) => d.id);
        const pos = ordered.indexOf(id);
        if (pos >= 0) setMissionIndex(ordered.length - pos);
      } catch {
        /* non-critical */
      }
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('確定要清除這筆紀錄？此動作無法復原。')) return;
    await deleteDoc(doc(db, 'dreams', id));
    router.push('/dreams');
  };

  const missionLabel = missionIndex !== null
    ? `LOG · ${String(missionIndex).padStart(3, '0')}`
    : 'LOG';

  return (
    <div className="min-h-screen flex flex-col">
      <header
        className="flex items-center justify-between px-5 py-3 sticky top-0 z-20"
        style={{
          background: 'rgba(6,6,15,0.65)',
          borderBottom: '1px solid var(--hair)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
        }}
      >
        <button
          onClick={() => router.push('/dreams')}
          className="zh"
          style={{ color: 'var(--ink-dim)', fontSize: 12.5, letterSpacing: '0.04em' }}
        >
          ← 返 回
        </button>
        <span
          style={{
            fontFamily: 'Inter, sans-serif',
            fontWeight: 500,
            fontSize: 15,
            color: 'var(--ink)',
            letterSpacing: '0.02em',
          }}
        >
          <b
            className="mono"
            style={{
              color: 'var(--moon)',
              fontWeight: 600,
              fontSize: 11,
              letterSpacing: '0.2em',
            }}
          >
            {missionLabel}
          </b>
        </span>
        {dream ? (
          <button
            onClick={handleDelete}
            className="mono"
            style={{
              color: 'var(--danger)',
              fontSize: 10,
              letterSpacing: '0.25em',
            }}
          >
            刪 除
          </button>
        ) : (
          <span />
        )}
      </header>

      <main className="flex-1 px-4 pb-10 w-full max-w-2xl mx-auto">
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <span className="mono text-sm animate-pulse" style={{ color: 'var(--muted)' }}>
              解 讀 中 ⋯
            </span>
          </div>
        ) : notFound ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3">
            <span
              className="mono"
              style={{
                fontSize: 10,
                color: 'var(--muted)',
                letterSpacing: '0.3em',
                textTransform: 'uppercase',
              }}
            >
              FILE NOT FOUND · 找 不 到 檔 案
            </span>
          </div>
        ) : dream ? (
          <DreamDetail dream={dream} missionIndex={missionIndex} />
        ) : null}
      </main>
    </div>
  );
}
