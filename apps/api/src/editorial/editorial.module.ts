import { Body, Controller, Get, Header, Headers, Module, Param, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { BibleReadingModule } from '../bible-reading/bible-reading.module';
import { TeachingDiscoveryController } from './teaching-discovery.controller';
import { TeachingDiscoveryService } from './teaching-discovery.service';
import { EditorialService } from './editorial.service';
@ApiTags('editorial') @ApiBearerAuth()
@Controller('editorial')
export class EditorialController {
  constructor(private readonly editorial: EditorialService) {}
  @Get(':kind') @Header('Cache-Control', 'no-store') list(@Headers('authorization') auth: string | undefined, @Param('kind') kind: string) { return this.editorial.list(auth, kind); }
  @Get(':kind/:id') @Header('Cache-Control', 'no-store') details(@Headers('authorization') auth: string | undefined, @Param('kind') kind: string, @Param('id') id: string) { return this.editorial.details(auth, kind, id); }
  @Post(':kind') @Header('Cache-Control', 'no-store') create(@Headers('authorization') auth: string | undefined, @Param('kind') kind: string, @Body() body: unknown) { return this.editorial.save(auth, kind, undefined, body); }
  @Put(':kind/:id') @Header('Cache-Control', 'no-store') update(@Headers('authorization') auth: string | undefined, @Param('kind') kind: string, @Param('id') id: string, @Body() body: unknown) { return this.editorial.save(auth, kind, id, body); }
}
@Module({ imports: [BibleReadingModule], controllers: [EditorialController, TeachingDiscoveryController], providers: [EditorialService, TeachingDiscoveryService] })
export class EditorialModule {}
