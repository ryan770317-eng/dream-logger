import Link from 'next/link';
import { Dream } from '@/lib/types';

interface DreamCardProps {
  dream: Dream;
}

function formatDate(createdAt: Dream['createdAt']): string {
  let date: Date;
  if (createdAt instanceof Date) {
    date = createdAt;
  } else {
    date = new Date(createdAt.seconds * 1000);
  }
  return date.toLocaleDateString('zh-TW', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function DreamCard({ dream }: DreamCardProps) {
  return (
    <Link href={`/dreams/${dream.id}`}>
      <div className="bg-gray-800/60 border border-gray-700/50 rounded-2xl p-4 hover:border-indigo-500/50 hover:bg-gray-800 transition-all">
        <div className="flex items-start justify-between gap-2 mb-2">
          <p className="text-white font-medium leading-snug flex-1">{dream.summary}</p>
          <span className="text-xs text-gray-400 shrink-0">{formatDate(dream.createdAt)}</span>
        </div>
        {dream.emotion && (
          <p className="text-indigo-300 text-sm mb-3">{dream.emotion}</p>
        )}
        {dream.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {dream.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-0.5 rounded-full bg-indigo-900/50 text-indigo-300 border border-indigo-700/40"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
