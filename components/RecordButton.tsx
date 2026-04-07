'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface RecordButtonProps {
  onRecordingComplete: (blob: Blob, duration: number) => void;
  disabled?: boolean;
  compact?: boolean;
}

function getSupportedMimeType(): string {
  const types = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
    '',
  ];
  for (const type of types) {
    if (!type || MediaRecorder.isTypeSupported(type)) return type;
  }
  return '';
}

export default function RecordButton({ onRecordingComplete, disabled, compact }: RecordButtonProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = getSupportedMimeType();
      const options = mimeType ? { mimeType } : {};
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
        const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000);
        const blob = new Blob(chunksRef.current, { type: mimeType || 'audio/webm' });
        setDuration(0);
        setIsRecording(false);
        onRecordingComplete(blob, elapsed);
      };

      mediaRecorder.start(250);
      startTimeRef.current = Date.now();
      setDuration(0);
      setIsRecording(true);
      timerRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 500);
    } catch (err) {
      console.error('Mic error:', err);
      alert('無法存取麥克風，請確認瀏覽器已授予麥克風權限');
    }
  }, [onRecordingComplete]);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
  }, []);

  const handleClick = useCallback(() => {
    if (isRecording) stopRecording();
    else startRecording();
  }, [isRecording, startRecording, stopRecording]);

  const btnSize = compact ? 'w-24 h-24' : 'w-40 h-40';
  const iconSize = compact ? 'text-3xl' : 'text-5xl';

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      <button
        onClick={handleClick}
        disabled={disabled}
        className={`
          ${btnSize} rounded-full font-semibold
          flex items-center justify-center select-none touch-none
          transition-all duration-150 shadow-2xl relative
          ${isRecording ? 'scale-110' : 'hover:brightness-110 active:scale-95'}
          ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
        `}
        style={isRecording
          ? { background: 'var(--danger)', color: 'white', boxShadow: '0 0 0 4px rgba(248,113,113,0.3), 0 0 32px rgba(248,113,113,0.4)' }
          : { background: 'var(--accent)', color: '#0a0a08', boxShadow: '0 0 0 1px rgba(247,247,87,0.5), 0 8px 32px rgba(247,247,87,0.3)' }
        }
      >
        {isRecording && (
          <span className="absolute inset-0 rounded-full animate-ping" style={{ background: 'rgba(248,113,113,0.2)' }} />
        )}
        {isRecording ? (
          <span className="flex flex-col items-center gap-1.5 relative z-10">
            <span className="w-4 h-4 rounded-sm animate-pulse" style={{ background: 'white' }} />
            <span className="text-xs mono font-bold">{formatDuration(duration)}</span>
          </span>
        ) : (
          <span className="flex flex-col items-center gap-1.5">
            <span className={iconSize}>🎙️</span>
            {!compact && <span className="text-sm font-medium">點擊錄音</span>}
          </span>
        )}
      </button>

      <p className="text-sm mono" style={{ color: isRecording ? 'var(--danger)' : 'var(--muted)' }}>
        {isRecording ? '▶ 錄音中 · 再點一下停止' : compact ? '點擊錄製' : '點擊開始，再點停止'}
      </p>
    </div>
  );
}
