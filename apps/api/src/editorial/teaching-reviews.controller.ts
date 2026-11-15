import { Body, Controller, Get, Header, Headers, Param, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { TeachingReviewsService } from './teaching-reviews.service';

@ApiTags('teaching-reviews') @ApiBearerAuth()
@Controller('teaching-reviews')
export class TeachingReviewsController {
  constructor(private readonly reviews: TeachingReviewsService) {}
  @Get() @Header('Cache-Control', 'no-store') list(@Headers('authorization') auth?: string) { return this.reviews.list(auth); }
  @Post() @Header('Cache-Control', 'no-store') create(@Headers('authorization') auth: string | undefined, @Body() body: unknown) { return this.reviews.create(auth, body); }
  @Put(':id') @Header('Cache-Control', 'no-store') update(@Headers('authorization') auth: string | undefined, @Param('id') id: string, @Body() body: unknown) { return this.reviews.update(auth, id, body); }
}
