import { Controller, Get, Header, Headers, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { TeachingDiscoveryService } from './teaching-discovery.service';
@ApiTags('teaching-discovery') @ApiBearerAuth()
@Controller('teaching-discovery')
export class TeachingDiscoveryController {
  constructor(private readonly discovery: TeachingDiscoveryService) {}
  @Get('sources') @Header('Cache-Control', 'no-store') sources(@Headers('authorization') auth?: string) { return this.discovery.sources(auth); }
  @Get('videos') @Header('Cache-Control', 'no-store') videos(@Headers('authorization') auth: string | undefined, @Query('channelId') channelId: string, @Query('pageToken') pageToken?: string) { return this.discovery.videos(auth, channelId, pageToken); }
}
