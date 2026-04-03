'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getNickname } from '@/lib/auth';
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Dream } from '@/lib/types';
import DreamCard from '@/components/DreamCard';

export default function DreamsPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState('');
  const router = useRouter();

  useEffect(() => {
    const nick = getNickname();
    if (!nick) {
      router.replace('/');
      return;
    }
    setUserId(nick);
    fetchDreams(nick);
  }, [router]);

  const fetchDreams = async (nick: string) => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'dreams'),
        where('userId', '==', nick),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Dream));
      setDreams(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const allTags = Array.from(new Set(dreams.flatMap((d) => d.tags)));

  const filtered = dreams.filter((d) => {
    const matchSearch =
      !search ||
      d.summary.includes(search) ||
      d.transcript?.includes(search) ||
      d.tags.some((t) => t.includes(search));
    const matchTag = !activeTag || d.tags.includes(activeTag);
    return matchSearch && matchTag;
  });

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
          onClick={() => router.push('/record')}
          className="text-sm transition-colors"
          style={{ color: 'var(--muted)' }}
        >
          ← 錄音
        </button>
        <h1 className="font-semibold" style={{ color: 'var(--text)' }}>我的夢境</h1>
        <span className="text-sm mono" style={{ color: 'var(--muted)' }}>
          {dreams.length} 則
        </span>
      </header>

      {/* Search */}
      <div
        className="px-4 pt-3 pb-2 sticky z-10"
        style={{ top: '49px', background: 'rgba(8,8,18,0.85)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
      >
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜尋夢境..."
          className="input-field text-sm"
        />
      </div>

      {/* Tags */}
      {allTags.length > 0 && (
        <div
          className="flex gap-2 overflow-x-auto px-4 pb-3 sticky z-10"
          style={{ top: '105px', background: 'rgba(8,8,18,0.85)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
        >
          <button
            onClick={() => setActiveTag('')}
            className={`shrink-0 tag-pill${!activeTag ? ' active' : ''}`}
          >
            全部
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag === activeTag ? '' : tag)}
              className={`shrink-0 tag-pill${activeTag === tag ? ' active' : ''}`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <main className="flex-1 px-4 pb-6">
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <span className="mono text-sm animate-pulse" style={{ color: 'var(--muted)' }}>
              載入中...
            </span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3">
            <span className="text-4xl">🌫️</span>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              {dreams.length === 0 ? '還沒有夢境記錄' : '沒有符合的結果'}
            </p>
            {dreams.length === 0 && (
              <button
                onClick={() => router.push('/record')}
                className="text-sm transition-colors"
                style={{ color: 'var(--accent)' }}
              >
                去錄第一個夢 →
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3 mt-3">
            {filtered.map((dream) => (
              <DreamCard key={dream.id} dream={dream} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
