'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface RecordButtonProps {
  onRecordingComplete: (blob: Blob, duration: number) => void;
  disabled?: boolean;
  compact?: boolean;
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

      const mimeType =
        MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' :
        MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' :
        MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' :
        '';

      const mediaRecorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      startTimeRef.current = Date.now();
      setDuration(0);

      timerRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 500);

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        const elapsedSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);
        const actualType = mediaRecorder.mimeType || mimeType || 'audio/mp4';
        const blob = new Blob(chunksRef.current, { type: actualType });
        if (blob.size > 0) {
          onRecordingComplete(blob, elapsedSeconds);
        } else {
          alert('錄音太短，請按住麥克風說話');
        }
        stream.getTracks().forEach((track) => track.stop());
        setDuration(0);
      };

      mediaRecorder.start(100);
      setIsRecording(true);
    } catch (err) {
      console.error('Recording error:', err);
      alert('無法錄音：' + (err instanceof Error ? err.message : '請確認麥克風權限'));
    }
  }, [onRecordingComplete]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  const btnSize = compact ? 'w-24 h-24' : 'w-40 h-40';
  const iconSize = compact ? 'text-3xl' : 'text-5xl';

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onPointerDown={startRecording}
        onPointerUp={stopRecording}
        onPointerLeave={stopRecording}
        disabled={disabled}
        className={`
          ${btnSize} rounded-full text-white font-semibold
          flex items-center justify-center select-none touch-none
          transition-all duration-150 shadow-2xl relative
          ${isRecording
            ? 'scale-110'
            : 'hover:brightness-110 active:scale-95'
          }
          ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
        `}
        style={
          isRecording
            ? {
                background: 'var(--danger)',
                boxShadow: '0 0 0 4px rgba(248,113,113,0.3), 0 0 32px rgba(248,113,113,0.4)',
              }
            : {
                background: 'var(--accent)',
                boxShadow: '0 0 0 1px rgba(124,106,247,0.4), 0 8px 32px rgba(124,106,247,0.35)',
              }
        }
      >
        {isRecording && (
          <span
            className="absolute inset-0 rounded-full animate-ping"
            style={{ background: 'rgba(248,113,113,0.25)' }}
          />
        )}
        {isRecording ? (
          <span className="flex flex-col items-center gap-1 relative z-10">
            <span
              className="w-4 h-4 rounded-sm animate-pulse"
              style={{ background: 'white' }}
            />
            <span className="text-xs mono font-bold">{formatDuration(duration)}</span>
          </span>
        ) : (
          <span className="flex flex-col items-center gap-1">
            <span className={iconSize}>🎙️</span>
            {!compact && <span className="text-sm">按住錄音</span>}
          </span>
        )}
      </button>
      {isRecording && (
        <p className="text-sm animate-pulse mono" style={{ color: 'var(--danger)' }}>
          放開停止錄音
        </p>
      )}
    </div>
  );
}
