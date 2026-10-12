import { Controller, Get, Headers, Param, Post, Query, BadRequestException } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { StudyMethod } from '@prisma/client';
import { BibleStudyService } from './bible-study.service';

@ApiTags('bible-studies')
@Controller('bible-studies')
export class BibleStudyController {
  constructor(private readonly service: BibleStudyService) {}
  @Get()
  list(@Query('method') method?: string, @Query('locale') locale?: string) {
    if (method && !Object.values(StudyMethod).includes(method as StudyMethod)) throw new BadRequestException('Invalid study method');
    return this.service.list(method as StudyMethod | undefined, locale);
  }
  @Get('my-studies') @ApiBearerAuth()
  mine(@Headers('authorization') auth?: string) { return this.service.mine(auth); }
  @Get('lessons/:id')
  lesson(@Param('id') id: string) { return this.service.lesson(id); }
  @Post('lessons/:id/complete') @ApiBearerAuth()
  complete(@Param('id') id: string, @Headers('authorization') auth?: string) { return this.service.completeLesson(id, auth); }
  @Get(':id')
  one(@Param('id') id: string) { return this.service.one(id); }
  @Post(':id/enroll') @ApiBearerAuth()
  enroll(@Param('id') id: string, @Headers('authorization') auth?: string) { return this.service.enroll(id, auth); }
}
