import { Controller, Get, Req } from '@nestjs/common';
import { StatsService } from './stats.service';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('organizador')
  @Roles('ORGANIZER')
  async buscarStats(@Req() req: { user: { sub: number } }) {
    return this.statsService.buscarStats(req.user.sub);
  }
}
