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

  const allTags = Array.from(new Set(dreams.flatMap((d) => d.tags ?? [])));

  const filtered = dreams.filter((d) => {
    const matchSearch =
      !search ||
      d.summary?.includes(search) ||
      d.transcript?.includes(search) ||
      (d.tags ?? []).some((t) => t.includes(search));
    const matchTag = !activeTag || (d.tags ?? []).includes(activeTag);
    return matchSearch && matchTag;
  });

  if (!userId) return null;

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
          onClick={() => router.push('/record')}
          className="zh"
          style={{ color: 'var(--ink-dim)', fontSize: 12.5, letterSpacing: '0.04em' }}
        >
          ← 返 回 紀 錄
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
              marginRight: 6,
              fontSize: 11,
              letterSpacing: '0.2em',
            }}
          >
            ARC
          </b>
          探 索 檔 案
        </span>
        <span
          className="mono"
          style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.25em' }}
        >
          {String(dreams.length).padStart(3, '0')} LOGS
        </span>
      </header>

      <div
        className="px-5 pt-3 pb-2 sticky z-10"
        style={{
          top: 49,
          background: 'rgba(6,6,15,0.65)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
        }}
      >
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="檢索檔案 / QUERY ⋯"
          className="search-input"
        />
      </div>

      {allTags.length > 0 && (
        <div
          className="flex gap-1.5 overflow-x-auto px-5 pb-3 no-scrollbar sticky z-10"
          style={{
            top: 103,
            background: 'rgba(6,6,15,0.65)',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
          }}
        >
          <button
            onClick={() => setActiveTag('')}
            className={`tag-pill${!activeTag ? ' active' : ''}`}
          >
            全部
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag === activeTag ? '' : tag)}
              className={`tag-pill${activeTag === tag ? ' active' : ''}`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      <main className="flex-1 px-4 pb-24">
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <span className="mono text-sm animate-pulse" style={{ color: 'var(--muted)' }}>
              同 步 中 ⋯
            </span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3 text-center">
            <span
              className="mono"
              style={{
                fontSize: 10,
                color: 'var(--muted)',
                letterSpacing: '0.3em',
                textTransform: 'uppercase',
              }}
            >
              {dreams.length === 0 ? 'NO LOGS · 無 紀 錄' : 'NO MATCH · 無 符 合 結 果'}
            </span>
            {dreams.length === 0 && (
              <button
                onClick={() => router.push('/record')}
                className="btn-primary-sm"
                style={{ padding: '10px 20px' }}
              >
                建 立 首 筆 紀 錄 →
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-2.5 mt-2">
            {filtered.map((dream) => {
              const originalIndex = dreams.findIndex((d) => d.id === dream.id);
              const missionIndex = dreams.length - originalIndex;
              return (
                <DreamCard key={dream.id} dream={dream} index={missionIndex} />
              );
            })}
          </div>
        )}
      </main>

      {/* Bottom dock */}
      <div
        style={{
          position: 'fixed',
          bottom: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 12px',
          background: 'rgba(6,6,15,0.8)',
          border: '1px solid var(--border-soft)',
          borderRadius: 100,
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 9.5,
          letterSpacing: '0.25em',
          color: 'var(--muted)',
          textTransform: 'uppercase',
          zIndex: 30,
          pointerEvents: 'none',
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: 'var(--moon)',
            boxShadow: '0 0 8px var(--moon-glow)',
            animation: 'twinkle 2s infinite',
          }}
        />
        檔 案 庫 · 同 步 完 成 · SYNCED
      </div>
    </div>
  );
}
