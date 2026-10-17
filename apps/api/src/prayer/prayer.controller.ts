import { BadRequestException, Body, Controller, Delete, Get, Headers, HttpCode, Param, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PrayerService } from './prayer.service';

function only(body: unknown, keys: string[]): Record<string, unknown> {
  if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some(k => !keys.includes(k))) throw new BadRequestException('Invalid prayer request');
  return body as Record<string, unknown>;
}

@ApiTags('prayers') @ApiBearerAuth() @Controller('prayers')
export class PrayerController {
  constructor(private readonly service: PrayerService) {}
  @Get() list(@Headers('authorization') auth?: string) { return this.service.list(auth); }
  @Post() create(@Headers('authorization') auth: string | undefined, @Body() body: unknown) { return this.service.create(auth, only(body, ['title', 'body'])); }
  // Requires an explicit phrase so a stray request cannot erase a prayer journal.
  @Post('delete-all') @HttpCode(200) removeAll(@Headers('authorization') auth: string | undefined, @Body() body: unknown) { return this.service.removeAll(auth, only(body, ['confirm']).confirm); }
  @Get(':id') get(@Headers('authorization') auth: string | undefined, @Param('id') id: string) { return this.service.get(auth, id); }
  @Put(':id') update(@Headers('authorization') auth: string | undefined, @Param('id') id: string, @Body() body: unknown) { return this.service.update(auth, id, only(body, ['title', 'body'])); }
  @Put(':id/answer') answer(@Headers('authorization') auth: string | undefined, @Param('id') id: string, @Body() body: unknown) { return this.service.answer(auth, id, only(body, ['answered', 'note'])); }
  @Delete(':id') remove(@Headers('authorization') auth: string | undefined, @Param('id') id: string) { return this.service.remove(auth, id); }
}
