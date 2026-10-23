import { Controller, Get, Headers, Header, HttpCode, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SuggestionsService } from './suggestions.service';

@ApiTags('suggestions')
@Controller('me/suggestions')
export class SuggestionsController {
  constructor(private readonly suggestions: SuggestionsService) {}
  /** Empty unless the person switched on personalized suggestions. */
  @Get() @Header('Cache-Control', 'no-store') @ApiBearerAuth() list(@Headers('authorization') auth?: string, @Query('locale') locale?: string) { return this.suggestions.forUser(auth, locale); }
  /** Hide a suggestion for good, on every device. */
  @Post(':id/dismiss') @HttpCode(200) @ApiBearerAuth() dismiss(@Headers('authorization') auth: string | undefined, @Param('id') id: string) { return this.suggestions.dismiss(auth, id); }
}
