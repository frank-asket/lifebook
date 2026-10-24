import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SearchService } from './search.service';

@ApiTags('search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}
  /** Public: searches published content only, never anyone's private writing. */
  @Get() search(@Query('q') q?: string, @Query('locale') locale?: string) { return this.searchService.search(q, locale); }
}
