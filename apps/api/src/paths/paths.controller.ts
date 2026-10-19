import { Controller, Get, Header, Headers, Param, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PathsService } from './paths.service';

@ApiTags('discipleship')
@Controller('paths')
export class PathsController {
  constructor(private readonly paths: PathsService) {}
  @Get() list() { return this.paths.list(); }
  @Get(':id') details(@Param('id') id: string) { return this.paths.details(id); }
  @Get(':id/state') @Header('Cache-Control', 'no-store') @ApiBearerAuth()
  state(@Headers('authorization') auth: string | undefined, @Param('id') id: string) { return this.paths.state(auth, id); }
  @Post(':id/enroll') @ApiBearerAuth()
  enroll(@Headers('authorization') auth: string | undefined, @Param('id') id: string) { return this.paths.enroll(auth, id); }
  @Put(':id/lessons/:lessonId/complete') @ApiBearerAuth()
  complete(@Headers('authorization') auth: string | undefined, @Param('id') id: string, @Param('lessonId') lessonId: string) { return this.paths.complete(auth, id, lessonId); }
}
