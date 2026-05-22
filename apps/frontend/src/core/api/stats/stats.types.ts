export type StatsUser = {
  id?: string;
  userId?: string;
  xp?: number;
  level?: number;
  wins?: number;
  losses?: number;
  kills?: number;
  deaths?: number;
  damageDealt?: number;
  damageTaken?: number;
  matchHistory?: unknown[];
  weapons?: unknown[];
  achievements?: string[];
  createdAt?: string;
  updatedAt?: string;
  derived?: {
    totalMatches?: number;
    winRate?: number;
    kd?: number;
  };
  [k: string]: unknown;
};