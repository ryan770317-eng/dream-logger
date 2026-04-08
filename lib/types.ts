export interface Dream {
  id?: string;
  userId: string;
  createdAt: Date | { seconds: number; nanoseconds: number };
  transcript: string;
  summary: string;
  characters: string[];
  locations: string[];
  emotion: string;
  symbols: string[];
  numbers: { value: string; context: string }[];
  lucidity: string;
  tags: string[];
  // 入夢前狀態
  preSleepBody?: string;
  preSleepThoughts?: string;
  recentLifeThemes?: string[];
  // 夢境補充
  senses?: string[];
  dreamEnding?: string;
  isRecurring?: boolean;
  recurringDreamRef?: string;
  // 事後驗證
  validationDate?: string;
  validationContent?: string;
  resonanceLevel?: number;
  resonanceTypes?: string[];
}

export interface DreamAnalysis {
  summary: string;
  characters: string[];
  locations: string[];
  emotion: string;
  symbols: string[];
  numbers: { value: string; context: string }[];
  lucidity: string;
  tags: string[];
  // 入夢前狀態（使用者填寫）
  preSleepBody?: string;
  preSleepThoughts?: string;
  recentLifeThemes?: string[];
  // 夢境補充（使用者填寫）
  senses?: string[];
  dreamEnding?: string;
  isRecurring?: boolean;
  recurringDreamRef?: string;
}

export interface User {
  nickname: string;
  createdAt: Date;
}
