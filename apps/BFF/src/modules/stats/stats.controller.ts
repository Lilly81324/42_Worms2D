import { Body, Controller, Get, Headers, Param, Patch, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { StatsService } from './stats.service';
import { PlayerStatsSchema, type PlayerStats } from './contracts/player-stats.schema';
import { UpdatePlayerStatsDto } from '../auth/contracts/dto/auth-contracts.dto';

function computeDerived(stats: Record<string, unknown>) {
  const kills = Number((stats as any).kills ?? 0);
  const deaths = Number((stats as any).deaths ?? 0);
  const wins = Number((stats as any).wins ?? 0);
  const losses = Number((stats as any).losses ?? 0);
  const totalMatches = wins + losses;
  const winRate = totalMatches > 0 ? (wins / totalMatches) * 100 : 0;
  const kd = deaths > 0 ? kills / deaths : kills;
  return { totalMatches, winRate, kd };
}

@Controller('stats')
export class StatsController {
  constructor(private readonly service: StatsService) {}

  @Get('users')
  async getUsers(
    @Headers() headers: Record<string, string>,
    @Query() query: Record<string, unknown>,
    @Req() req: Request,
  ) {
    // short path
    //console.log('stats.getUsers path:', req.originalUrl);
    // full URL (protocol + host + path)
    //console.log('stats.getUsers full URL:', `${req.protocol}://${req.get('host')}${req.originalUrl}`);

    return this.service.fetchUsers({ authorization: headers.authorization, params: query });
  }

  @Get('user/:userId')
  async getUserById(@Param('userId') userId: string, @Headers() headers: Record<string, string>) {
    const raw = await this.service.fetchUserById(userId, { authorization: headers.authorization });
    const base = PlayerStatsSchema.parse(raw) as PlayerStats;
    const derived = computeDerived(base as Record<string, unknown>);
    return { ...base, derived };
  }

  @Patch('user/:userId')
  async updateStats(
    @Param('userId') userId: string,
    @Body() updateDto: UpdatePlayerStatsDto,
    @Headers('authorization') auth: string,
  ) {
    return this.service.update(userId, updateDto, {
      authorization: auth,
    });
  }
}
