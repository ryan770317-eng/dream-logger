import { Dream } from '@/lib/types';

interface DreamDetailProps {
  dream: Dream;
}

function formatFullDate(createdAt: Dream['createdAt']): string {
  let date: Date;
  if (createdAt instanceof Date) {
    date = createdAt;
  } else {
    date = new Date(createdAt.seconds * 1000);
  }
  return date.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function DreamDetail({ dream }: DreamDetailProps) {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-gray-400 text-sm">{formatFullDate(dream.createdAt)}</p>
        <h1 className="text-white text-2xl font-semibold mt-1 leading-snug">{dream.summary}</h1>
      </div>

      {dream.emotion && (
        <div className="flex items-center gap-2">
          <span className="text-2xl">💭</span>
          <span className="text-indigo-300 text-lg">{dream.emotion}</span>
        </div>
      )}

      {dream.lucidity && (
        <InfoSection title="清醒度" icon="🌙">
          <p className="text-gray-200">{dream.lucidity}</p>
        </InfoSection>
      )}

      {dream.characters.length > 0 && (
        <InfoSection title="出現人物" icon="👥">
          <div className="flex flex-wrap gap-2">
            {dream.characters.map((c) => (
              <Tag key={c} color="blue">{c}</Tag>
            ))}
          </div>
        </InfoSection>
      )}

      {dream.locations.length > 0 && (
        <InfoSection title="地點" icon="📍">
          <div className="flex flex-wrap gap-2">
            {dream.locations.map((l) => (
              <Tag key={l} color="green">{l}</Tag>
            ))}
          </div>
        </InfoSection>
      )}

      {dream.symbols.length > 0 && (
        <InfoSection title="符號與意象" icon="✨">
          <div className="flex flex-wrap gap-2">
            {dream.symbols.map((s) => (
              <Tag key={s} color="purple">{s}</Tag>
            ))}
          </div>
        </InfoSection>
      )}

      {dream.numbers.length > 0 && (
        <InfoSection title="出現的數字" icon="🔢">
          <div className="space-y-2">
            {dream.numbers.map((n, i) => (
              <div key={i} className="bg-gray-800 rounded-xl p-3 flex items-center gap-3">
                <span className="text-yellow-400 font-bold text-lg">{n.value}</span>
                <span className="text-gray-400 text-sm">{n.context}</span>
              </div>
            ))}
          </div>
        </InfoSection>
      )}

      {dream.tags.length > 0 && (
        <InfoSection title="標籤" icon="🏷️">
          <div className="flex flex-wrap gap-2">
            {dream.tags.map((t) => (
              <Tag key={t} color="indigo">{t}</Tag>
            ))}
          </div>
        </InfoSection>
      )}

      {dream.transcript && (
        <InfoSection title="原始逐字稿" icon="📝">
          <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{dream.transcript}</p>
        </InfoSection>
      )}
    </div>
  );
}

function InfoSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-gray-800/50 rounded-2xl p-4">
      <h3 className="text-gray-400 text-sm flex items-center gap-1.5 mb-3">
        <span>{icon}</span>
        {title}
      </h3>
      {children}
    </div>
  );
}

function Tag({
  children,
  color,
}: {
  children: React.ReactNode;
  color: 'blue' | 'green' | 'purple' | 'indigo';
}) {
  const colors = {
    blue: 'bg-blue-900/40 text-blue-300 border-blue-700/40',
    green: 'bg-green-900/40 text-green-300 border-green-700/40',
    purple: 'bg-purple-900/40 text-purple-300 border-purple-700/40',
    indigo: 'bg-indigo-900/40 text-indigo-300 border-indigo-700/40',
  };
  return (
    <span className={`text-sm px-3 py-1 rounded-full border ${colors[color]}`}>{children}</span>
  );
}
