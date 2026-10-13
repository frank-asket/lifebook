import {
  Controller,
  Get,
  Param,
  Query,
} from '@nestjs/common';

import { ApiTags } from '@nestjs/swagger';

import { BibleContentService } from './content.service';

@ApiTags('bible-content')
@Controller('bible-content')
export class BibleContentController {
  constructor(
    private readonly bible: BibleContentService,
  ) {}

  private locale(value?: string): 'en' | 'fr' {
    return value === 'fr' ? 'fr' : 'en';
  }

  /**
   * GET /api/v1/bible-content/books?locale=en
   *
   * Returns the books available in the selected translation.
   */
  @Get('books')
  books(
    @Query('locale') locale?: string,
  ) {
    return this.bible.books(this.locale(locale));
  }

  /**
   * GET /api/v1/bible-content/books/GEN/chapters?locale=en
   *
   * Returns the chapters of a Bible book.
   */
  @Get('books/:bookId/chapters')
  chapters(
    @Param('bookId') bookId: string,
    @Query('locale') locale?: string,
  ) {
    return this.bible.chapters(
      this.locale(locale),
      bookId,
    );
  }

  /**
   * GET /api/v1/bible-content/chapters/GEN.1?locale=en
   *
   * Returns the text of a complete Bible chapter.
   */
  @Get('chapters/:chapterId')
  chapter(
    @Param('chapterId') chapterId: string,
    @Query('locale') locale?: string,
  ) {
    return this.bible.chapter(
      this.locale(locale),
      chapterId,
    );
  }

  /**
   * GET /api/v1/bible-content/passages/JOS.1.8?locale=en
   *
   * Returns the text of a Bible passage.
   */
  @Get('passages/:passageId')
  passage(
    @Param('passageId') passageId: string,
    @Query('locale') locale?: string,
  ) {
    return this.bible.passage(
      this.locale(locale),
      passageId,
    );
  }
}