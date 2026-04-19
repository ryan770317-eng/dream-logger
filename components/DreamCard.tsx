import Link from 'next/link';
import { Dream } from '@/lib/types';

interface DreamCardProps {
  dream: Dream;
  index: number;
}

function toDate(createdAt: Dream['createdAt']): Date {
  if (createdAt instanceof Date) return createdAt;
  return new Date(createdAt.seconds * 1000);
}

function formatDate(createdAt: Dream['createdAt']): string {
  const d = toDate(createdAt);
  const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
  const day = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${month} ${day} · ${hh}:${mm}`;
}

export default function DreamCard({ dream, index }: DreamCardProps) {
  const missionId = `#LOG·${String(index).padStart(3, '0')}`;

  return (
    <Link href={`/dreams/${dream.id}`} className="dream-card">
      <div className="flex justify-between items-center gap-3 mb-2.5">
        <span
          className="mono"
          style={{
            fontSize: 10,
            color: 'var(--muted)',
            letterSpacing: '0.28em',
            textTransform: 'uppercase',
          }}
        >
          {formatDate(dream.createdAt)}
        </span>
        <span
          className="mono"
          style={{
            fontSize: 9.5,
            color: 'var(--whisper)',
            letterSpacing: '0.2em',
          }}
        >
          {missionId}
        </span>
      </div>

      <p
        className="zh"
        style={{
          fontWeight: 400,
          fontSize: 14.5,
          lineHeight: 1.75,
          color: 'var(--ink)',
          margin: '0 0 10px',
        }}
      >
        {dream.summary}
      </p>

      {dream.emotion && (
        <div
          className="zh"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 12,
            color: 'var(--lavender)',
            marginBottom: 10,
          }}
        >
          <span style={{ width: 14, height: 1, background: 'var(--lavender)', opacity: 0.6 }} />
          {dream.emotion}
        </div>
      )}

      {dream.tags && dream.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {dream.tags.map((tag) => (
            <span
              key={tag}
              className="zh"
              style={{
                fontWeight: 400,
                fontSize: 11,
                letterSpacing: '0.03em',
                color: 'var(--ink-dim)',
                padding: '3px 10px',
                background: 'rgba(242,217,143,0.06)',
                border: '1px solid var(--border-soft)',
                borderRadius: 100,
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}
