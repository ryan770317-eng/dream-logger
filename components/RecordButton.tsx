'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface RecordButtonProps {
  onSpeechResult: (transcript: string) => void;
  disabled?: boolean;
  compact?: boolean;
}

export default function RecordButton({ onSpeechResult, disabled, compact }: RecordButtonProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [liveText, setLiveText] = useState('');
  const [duration, setDuration] = useState(0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef('');
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Tracks whether the user intentionally stopped — prevents iOS auto-restart
  const stoppedByUserRef = useRef(false);
  // Prevents double alert when onerror fires before onend
  const errorFiredRef = useRef(false);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      recognitionRef.current?.abort();
    };
  }, []);

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getSpeechRec = () => (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  const createAndStartRecognition = useCallback(() => {
    const SpeechRec = getSpeechRec();
    if (!SpeechRec) return;

    const recognition = new SpeechRec();
    recognition.lang = 'zh-TW';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognitionRef.current = recognition;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      let text = '';
      for (let i = 0; i < event.results.length; i++) {
        text += event.results[i][0].transcript;
      }
      transcriptRef.current = text;
      setLiveText(text);
    };

    recognition.onend = () => {
      // iOS: auto-restart if user hasn't clicked stop
      if (!stoppedByUserRef.current) {
        try {
          recognitionRef.current?.start();
        } catch {
          // Already started — ignore
        }
        return;
      }

      // User clicked stop — finalise
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      setDuration(0);
      setIsRecording(false);
      const final = transcriptRef.current.trim();
      setLiveText('');

      if (final) {
        onSpeechResult(final);
      } else if (!errorFiredRef.current) {
        alert('沒有偵測到語音，請重新錄製');
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      if (event.error === 'aborted') return;
      errorFiredRef.current = true;
      console.error('Speech error:', event.error);

      const messages: Record<string, string> = {
        'not-allowed': '麥克風權限被拒絕，請在瀏覽器設定中允許',
        'network': '網路錯誤，請確認連線後再試',
        'no-speech': '',      // iOS常見，靜默處理，onend會重啟
        'audio-capture': '找不到麥克風裝置',
        'service-not-allowed': '語音辨識服務不可用，請使用 Chrome 或 Safari',
      };

      const msg = messages[event.error];
      if (msg === undefined) {
        alert('語音識別錯誤：' + event.error);
      } else if (msg) {
        alert(msg);
      }
    };

    recognition.start();
  }, [onSpeechResult]);

  const startRecording = useCallback(() => {
    const SpeechRec = getSpeechRec();
    if (!SpeechRec) {
      alert('瀏覽器不支援語音識別，請使用 Chrome 或 Safari');
      return;
    }

    stoppedByUserRef.current = false;
    errorFiredRef.current = false;
    transcriptRef.current = '';

    startTimeRef.current = Date.now();
    setDuration(0);
    setLiveText('');
    timerRef.current = setInterval(() => {
      setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 500);

    createAndStartRecognition();
    setIsRecording(true);
  }, [createAndStartRecognition]);

  const stopRecording = useCallback(() => {
    stoppedByUserRef.current = true;
    recognitionRef.current?.stop();
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

      {isRecording && liveText && (
        <div className="panel px-4 py-3 w-full max-w-xs">
          <p className="text-sm text-center" style={{ color: 'var(--muted)' }}>{liveText}</p>
        </div>
      )}
    </div>
  );
}
