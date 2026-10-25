import { BadRequestException, Body, Controller, Delete, Get, Header, Headers, HttpCode, Param, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { GuidedMeditationService } from './guided-meditation.service';
import { PrayerService } from './prayer.service';

function only(body: unknown, keys: string[]): Record<string, unknown> {
  if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some(k => !keys.includes(k))) throw new BadRequestException('Invalid prayer request');
  return body as Record<string, unknown>;
}

@ApiTags('prayers') @ApiBearerAuth() @Controller('prayers')
export class PrayerController {
  constructor(private readonly service: PrayerService, private readonly meditation: GuidedMeditationService) {}
  @Get() list(@Headers('authorization') auth?: string) { return this.service.list(auth); }
  @Get('page') @Header('Cache-Control', 'no-store') page(@Headers('authorization') auth: string | undefined, @Query('cursor') cursor?: string) { return this.service.page(auth, cursor); }
  @Post() create(@Headers('authorization') auth: string | undefined, @Body() body: unknown) { return this.service.create(auth, only(body, ['title', 'body', 'locale', 'aiVerse'])); }
  // Requires an explicit phrase so a stray request cannot erase a prayer journal.
  @Post('delete-all') @HttpCode(200) removeAll(@Headers('authorization') auth: string | undefined, @Body() body: unknown) { return this.service.removeAll(auth, only(body, ['confirm']).confirm); }
  @Get(':id') get(@Headers('authorization') auth: string | undefined, @Param('id') id: string) { return this.service.get(auth, id); }
  @Put(':id') update(@Headers('authorization') auth: string | undefined, @Param('id') id: string, @Body() body: unknown) { return this.service.update(auth, id, only(body, ['title', 'body', 'locale', 'aiVerse'])); }
  @Put(':id/answer') answer(@Headers('authorization') auth: string | undefined, @Param('id') id: string, @Body() body: unknown) { return this.service.answer(auth, id, only(body, ['answered', 'note'])); }
  // Sends this prayer for guided meditation only with explicit consent; see GuidedMeditationService.
  @Post(':id/meditation') @HttpCode(200) meditate(@Headers('authorization') auth: string | undefined, @Param('id') id: string, @Body() body: unknown) { return this.meditation.generate(auth, id, only(body, ['consent', 'locale'])); }
  @Delete(':id/meditation') clearMeditation(@Headers('authorization') auth: string | undefined, @Param('id') id: string) { return this.service.clearMeditation(auth, id); }
  @Delete(':id') remove(@Headers('authorization') auth: string | undefined, @Param('id') id: string) { return this.service.remove(auth, id); }
}
