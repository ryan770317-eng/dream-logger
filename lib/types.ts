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
}

export interface User {
  nickname: string;
  createdAt: Date;
}
