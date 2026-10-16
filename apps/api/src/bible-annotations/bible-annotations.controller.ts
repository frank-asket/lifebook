import { BadRequestException, Body, Controller, Delete, Get, Headers, Param, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { BibleAnnotationsService } from './bible-annotations.service';
@ApiTags('bible-annotations') @ApiBearerAuth() @Controller('bible-annotations')
export class BibleAnnotationsController {
  constructor(private readonly service: BibleAnnotationsService) {}
  @Get() list(@Headers('authorization') auth?: string, @Query('locale') locale?: string, @Query('chapterId') chapterId?: string) { return this.service.list(auth, locale, chapterId); }
  @Put() save(@Headers('authorization') auth: string | undefined, @Body() body: Record<string, unknown>) {
    if (!body || typeof body.passageId !== 'string' || (body.locale !== 'en' && body.locale !== 'fr') ||
      (body.bookmark !== undefined && typeof body.bookmark !== 'boolean') ||
      (body.highlight !== undefined && body.highlight !== null && typeof body.highlight !== 'string') ||
      (body.note !== undefined && body.note !== null && typeof body.note !== 'string') ||
      Object.keys(body).some(k => !['passageId','locale','bookmark','highlight','note'].includes(k))) throw new BadRequestException('Invalid annotation');
    return this.service.save(auth, body as { passageId: string; locale: 'en'|'fr'; bookmark?: boolean; highlight?: string|null; note?: string|null });
  }
  @Delete(':id') remove(@Headers('authorization') auth: string | undefined, @Param('id') id: string) { return this.service.remove(auth, id); }
}
