import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PrayerCompanionService } from './prayer-companion.service';

/** Public, read-only Scripture by topic. Topic choices are not stored or logged. */
@ApiTags('prayer-companion') @Controller('prayer-companion')
export class PrayerCompanionController {
  constructor(private readonly companion: PrayerCompanionService) {}
  @Get('topics') topics(@Query('locale') locale?: string) { return this.companion.topics(locale); }
  @Get('topics/:id') topic(@Param('id') id: string, @Query('locale') locale?: string) { return this.companion.topic(id, locale); }
}
