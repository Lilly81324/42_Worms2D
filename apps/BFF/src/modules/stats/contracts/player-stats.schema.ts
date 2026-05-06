import { z } from 'zod';

export const PlayerStatsSchema = z.object({
  id: z.string(),
  userId: z.string(),
  xp: z.number().int().default(0),
  level: z.number().int().default(1),
  wins: z.number().int().default(0),
  losses: z.number().int().default(0),
  kills: z.number().int().default(0),
  deaths: z.number().int().default(0),
  damageDealt: z.number().int().default(0),
  damageTaken: z.number().int().default(0),
  matchHistory: z.array(z.unknown()).default([]),
  weapons: z.array(z.unknown()).default([]),
  achievements: z.array(z.string()).default([]),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type PlayerStats = z.infer<typeof PlayerStatsSchema>;
