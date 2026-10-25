import { BadRequestException, Body, Controller, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BibleContentService, validUsage } from './bible-content.service';

@ApiTags('bible-content')
@Controller('bible-content')
export class BibleContentController {
  constructor(private readonly bible: BibleContentService) {}
  private locale(value?: string): 'en' | 'fr' { return value === 'fr' ? 'fr' : 'en'; }
  // `version` picks one of the versions in bible-versions.ts; without it, the language's default is read.
  @Get('search') search(@Query('locale') locale?: string, @Query('q') q?: string, @Query('offset') offset?: string, @Query('version') version?: string) { return this.bible.search(this.locale(locale), q ?? '', offset, 'canonical', version); }
  @Get('translation') translation(@Query('locale') locale?: string, @Query('version') version?: string) { return this.bible.translation(this.locale(locale), version); }
  @Get('books') books(@Query('locale') locale?: string, @Query('version') version?: string) { return this.bible.books(this.locale(locale), version); }
  @Get('books/:bookId/chapters') chapters(@Param('bookId') bookId: string, @Query('locale') locale?: string, @Query('version') version?: string) { return this.bible.chapters(this.locale(locale), bookId, version); }
  @Get('chapters/:chapterId') chapter(@Param('chapterId') chapterId: string, @Query('locale') locale?: string, @Query('version') version?: string) { return this.bible.chapter(this.locale(locale), chapterId, version); }
  @Get('passages/:passageId') passage(@Param('passageId') passageId: string, @Query('locale') locale?: string, @Query('version') version?: string) { return this.bible.passage(this.locale(locale), passageId, version); }
  /** Readers' apps send the usage tokens of Scripture they displayed; forwarded to API.Bible (FUMS). */
  @Post('usage') @HttpCode(204) usage(@Body() body: unknown) {
    const report = validUsage(body);
    if (!report) throw new BadRequestException('Invalid usage report');
    this.bible.reportUsage(report.tokens, report.deviceId, report.sessionId);
  }
}
