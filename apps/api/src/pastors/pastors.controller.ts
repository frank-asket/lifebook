import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PastorDirectoryService } from './pastor-directory.service';

/** Public directory of active, verified pastors. Read-only. */
@ApiTags('pastors') @Controller('pastors')
export class PastorsController {
  constructor(private readonly directory: PastorDirectoryService) {}
  @Get() list() { return this.directory.list(); }
  @Get(':slug') get(@Param('slug') slug: string) { return this.directory.get(slug); }
}
