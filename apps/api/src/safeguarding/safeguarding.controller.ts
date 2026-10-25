import { BadRequestException, Body, Controller, Get, Header, Headers, HttpCode, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SafeguardingService } from './safeguarding.service';

function field(body: unknown, key: string): unknown {
  if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some(k => k !== key)) throw new BadRequestException('Invalid request');
  return (body as Record<string, unknown>)[key];
}

/** Safeguarding lead only (MODERATOR or ADMIN). */
@ApiTags('safeguarding') @ApiBearerAuth() @Controller('safeguarding')
export class SafeguardingController {
  constructor(private readonly safeguarding: SafeguardingService) {}
  @Get('overview') overview(@Headers('authorization') auth?: string) { return this.safeguarding.overview(auth); }
  @Get('reports') reports(@Headers('authorization') auth?: string) { return this.safeguarding.reports(auth); }
  @Get('reports/:id') report(@Headers('authorization') auth: string | undefined, @Param('id') id: string) { return this.safeguarding.report(auth, id); }
  @Post('reports/:id/acknowledge') @HttpCode(200) acknowledge(@Headers('authorization') auth: string | undefined, @Param('id') id: string) { return this.safeguarding.acknowledge(auth, id); }
  @Post('reports/:id/resolve') @HttpCode(200) resolve(@Headers('authorization') auth: string | undefined, @Param('id') id: string, @Body() body: unknown) { return this.safeguarding.resolve(auth, id, field(body, 'resolution')); }
  @Get('applications') @Header('Cache-Control', 'no-store') applications(@Headers('authorization') auth?: string) { return this.safeguarding.applications(auth); }
  @Post('applications/:slug/approve') @HttpCode(200) approve(@Headers('authorization') auth: string | undefined, @Param('slug') slug: string) { return this.safeguarding.approveApplication(auth, slug); }
  @Post('applications/:slug/reject') @HttpCode(200) reject(@Headers('authorization') auth: string | undefined, @Param('slug') slug: string, @Body() body: unknown) { return this.safeguarding.rejectApplication(auth, slug, field(body, 'notes')); }
  @Post('pastors/:slug/suspend') @HttpCode(200) suspend(@Headers('authorization') auth: string | undefined, @Param('slug') slug: string, @Body() body: unknown) { return this.safeguarding.suspendPastor(auth, slug, field(body, 'reason')); }
  @Post('pastors/:slug/reinstate') @HttpCode(200) reinstate(@Headers('authorization') auth: string | undefined, @Param('slug') slug: string) { return this.safeguarding.reinstatePastor(auth, slug); }
}
