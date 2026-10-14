import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BibleContentService } from './bible-content.service';

@ApiTags('bible-content')
@Controller('bible-content')
export class BibleContentController {
  constructor(private readonly bible: BibleContentService) {}
  private locale(value?: string): 'en' | 'fr' { return value === 'fr' ? 'fr' : 'en'; }
  @Get('translation') translation(@Query('locale') locale?: string) { return this.bible.translation(this.locale(locale)); }
  @Get('books') books(@Query('locale') locale?: string) { return this.bible.books(this.locale(locale)); }
  @Get('books/:bookId/chapters') chapters(@Param('bookId') bookId: string, @Query('locale') locale?: string) { return this.bible.chapters(this.locale(locale), bookId); }
  @Get('chapters/:chapterId') chapter(@Param('chapterId') chapterId: string, @Query('locale') locale?: string) { return this.bible.chapter(this.locale(locale), chapterId); }
  @Get('passages/:passageId') passage(@Param('passageId') passageId: string, @Query('locale') locale?: string) { return this.bible.passage(this.locale(locale), passageId); }
}
