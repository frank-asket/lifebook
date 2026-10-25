import { Body, Controller, Get, Header, Headers, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PastorApplicationService } from './pastor-application.service';

/** The signed-in member's own application to serve in the pastoral care pilot. */
@ApiTags('pastors') @ApiBearerAuth() @Controller('pastor-application')
export class PastorApplicationController {
  constructor(private readonly applications: PastorApplicationService) {}
  @Get() @Header('Cache-Control', 'no-store') get(@Headers('authorization') auth?: string) { return this.applications.get(auth); }
  @Put() submit(@Headers('authorization') auth: string | undefined, @Body() body: unknown) { return this.applications.submit(auth, body); }
}
