const NICKNAME_KEY = 'dream_logger_nickname';

export function getNickname(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(NICKNAME_KEY);
}

export function setNickname(nickname: string): void {
  localStorage.setItem(NICKNAME_KEY, nickname);
}

export function clearNickname(): void {
  localStorage.removeItem(NICKNAME_KEY);
}
