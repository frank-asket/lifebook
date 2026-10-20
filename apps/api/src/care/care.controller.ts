import { BadRequestException, Body, Controller, Delete, Get, Header, Headers, HttpCode, Param, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CareService } from './care.service';

function only(body: unknown, keys: string[]): Record<string, unknown> {
  if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some(k => !keys.includes(k))) throw new BadRequestException('Invalid request');
  return body as Record<string, unknown>;
}

@ApiTags('care') @ApiBearerAuth() @Controller('care')
export class CareController {
  constructor(private readonly care: CareService) {}

  // Member
  @Post('requests') create(@Headers('authorization') auth: string | undefined, @Body() body: unknown) { return this.care.create(auth, only(body, ['topic', 'language', 'contactPreference', 'name', 'phone', 'message', 'consent'])); }
  @Get('requests/page') @Header('Cache-Control', 'no-store') pageMine(@Headers('authorization') auth: string | undefined, @Query('cursor') cursor?: string) { return this.care.pageMine(auth, cursor); }
  @Get('requests') listMine(@Headers('authorization') auth?: string) { return this.care.listMine(auth); }
  @Get('requests/:id') mine(@Headers('authorization') auth: string | undefined, @Param('id') id: string) { return this.care.mine(auth, id); }
  @Post('requests/:id/messages') @HttpCode(201) memberReply(@Headers('authorization') auth: string | undefined, @Param('id') id: string, @Body() body: unknown) { return this.care.memberReply(auth, id, only(body, ['text']).text); }
  @Post('requests/:id/close') @HttpCode(200) memberClose(@Headers('authorization') auth: string | undefined, @Param('id') id: string) { return this.care.memberClose(auth, id); }
  @Post('requests/:id/report') @HttpCode(201) memberReport(@Headers('authorization') auth: string | undefined, @Param('id') id: string, @Body() body: unknown) { return this.care.memberReport(auth, id, only(body, ['category', 'details', 'shareConversation'])); }
  @Delete('requests/:id') memberDelete(@Headers('authorization') auth: string | undefined, @Param('id') id: string) { return this.care.memberDelete(auth, id); }

  // Pastor
  @Get('pastor/status') pastorStatus(@Headers('authorization') auth?: string) { return this.care.pastorStatus(auth); }
  @Put('pastor/availability') availability(@Headers('authorization') auth: string | undefined, @Body() body: unknown) { return this.care.setAvailability(auth, only(body, ['accepting']).accepting); }
  @Get('pastor/queue') queue(@Headers('authorization') auth?: string) { return this.care.queue(auth); }
  @Post('pastor/queue/:id/claim') @HttpCode(200) claim(@Headers('authorization') auth: string | undefined, @Param('id') id: string) { return this.care.claim(auth, id); }
  @Get('pastor/cases') cases(@Headers('authorization') auth?: string) { return this.care.cases(auth); }
  @Get('pastor/cases/:id') case(@Headers('authorization') auth: string | undefined, @Param('id') id: string) { return this.care.case(auth, id); }
  @Post('pastor/cases/:id/messages') @HttpCode(201) pastorReply(@Headers('authorization') auth: string | undefined, @Param('id') id: string, @Body() body: unknown) { return this.care.pastorReply(auth, id, only(body, ['text']).text); }
  @Post('pastor/cases/:id/report') @HttpCode(201) pastorReport(@Headers('authorization') auth: string | undefined, @Param('id') id: string, @Body() body: unknown) { return this.care.pastorReport(auth, id, only(body, ['category', 'details', 'shareConversation'])); }
  @Post('pastor/cases/:id/close') @HttpCode(200) pastorClose(@Headers('authorization') auth: string | undefined, @Param('id') id: string) { return this.care.pastorClose(auth, id); }
}
