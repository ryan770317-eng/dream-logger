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
      <header className="flex items-center justify-between px-5 py-4 sticky top-0 bg-[#0f0f13]/90 backdrop-blur-sm z-10">
        <button onClick={() => router.push('/record')} className="text-gray-400 text-sm">
          ← 錄音
        </button>
        <h1 className="text-white font-semibold">我的夢境</h1>
        <span className="text-gray-500 text-sm">{dreams.length} 則</span>
      </header>

      <div className="px-4 pb-2 sticky top-[60px] bg-[#0f0f13]/90 backdrop-blur-sm z-10">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜尋夢境..."
          className="input-field text-base py-3"
        />
      </div>

      {allTags.length > 0 && (
        <div className="flex gap-2 overflow-x-auto px-4 pb-3 no-scrollbar sticky top-[120px] bg-[#0f0f13]/90 backdrop-blur-sm z-10">
          <button
            onClick={() => setActiveTag('')}
            className={`shrink-0 text-sm px-3 py-1.5 rounded-full border transition-colors ${
              !activeTag
                ? 'bg-indigo-600 border-indigo-600 text-white'
                : 'border-gray-600 text-gray-400'
            }`}
          >
            全部
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag === activeTag ? '' : tag)}
              className={`shrink-0 text-sm px-3 py-1.5 rounded-full border transition-colors ${
                activeTag === tag
                  ? 'bg-indigo-600 border-indigo-600 text-white'
                  : 'border-gray-600 text-gray-400'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      <main className="flex-1 px-4 pb-6">
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <span className="text-gray-400 animate-pulse">載入中...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3">
            <span className="text-4xl">🌫️</span>
            <p className="text-gray-400">
              {dreams.length === 0 ? '還沒有夢境記錄' : '沒有符合的結果'}
            </p>
            {dreams.length === 0 && (
              <button
                onClick={() => router.push('/record')}
                className="text-indigo-400 text-sm underline"
              >
                去錄第一個夢 →
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3 mt-2">
            {filtered.map((dream) => (
              <DreamCard key={dream.id} dream={dream} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
