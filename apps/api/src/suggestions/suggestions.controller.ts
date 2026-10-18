import { Controller, Get, Headers, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SuggestionsService } from './suggestions.service';

@ApiTags('suggestions')
@Controller('me/suggestions')
export class SuggestionsController {
  constructor(private readonly suggestions: SuggestionsService) {}
  /** Empty unless the person switched on personalized suggestions. */
  @Get() @ApiBearerAuth() list(@Headers('authorization') auth?: string, @Query('locale') locale?: string) { return this.suggestions.forUser(auth, locale); }
}
