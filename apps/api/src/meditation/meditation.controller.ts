import { Body, Controller, Get, Headers, Param, Post, Put, Query } from '@nestjs/common';
import { IsBoolean, IsString, MaxLength, MinLength } from 'class-validator';
import { MeditationService } from './meditation.service';
class ReflectionDto { @IsString() @MinLength(1) @MaxLength(10000) text!: string; }
class BookmarkDto { @IsBoolean() saved!: boolean; }
@Controller('meditations')
export class MeditationController {
  constructor(private readonly service: MeditationService) {}
  @Get('today') today(@Query('locale') locale?: string) { return this.service.today(locale === 'fr' ? 'fr' : 'en'); }
  @Get('history') history(@Headers('authorization') auth?: string) { return this.service.history(auth); }
  @Get('saved') saved(@Headers('authorization') auth?: string) { return this.service.saved(auth); }
  @Get(':id/state') state(@Param('id') id: string, @Headers('authorization') auth?: string) { return this.service.myState(id, auth); }
  @Get(':id') one(@Param('id') id: string) { return this.service.one(id); }
  @Put(':id/reflection') reflect(@Param('id') id: string, @Body() body: ReflectionDto, @Headers('authorization') auth?: string) { return this.service.reflect(id, body.text, auth); }
  @Post(':id/complete') complete(@Param('id') id: string, @Headers('authorization') auth?: string) { return this.service.complete(id, auth); }
  @Put(':id/bookmark') bookmark(@Param('id') id: string, @Body() body: BookmarkDto, @Headers('authorization') auth?: string) { return this.service.bookmark(id, body.saved, auth); }
}
