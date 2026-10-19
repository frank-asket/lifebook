import { Body, Controller, Get, Header, Headers, Param, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { LivingWordService } from './livingword.service';
class TeachingDto {
  @IsString() @MaxLength(200) title!: string;
  @IsOptional() @IsString() @MaxLength(10000) description?: string;
  @IsString() @MaxLength(2048) mediaUrl!: string;
  @IsIn(['en', 'fr']) locale!: string;
  @IsIn(['audio', 'video']) kind!: string;
  @IsString() @MaxLength(200) speaker!: string;
  @IsString() @MaxLength(1000) attribution!: string;
  @IsString() @MaxLength(100000) transcript!: string;
  @IsString() @MaxLength(1000) rightsReference!: string;
  @IsBoolean() publish!: boolean;
}
@ApiTags('livingword') @Controller('livingword')
export class LivingWordController {
  constructor(private readonly library: LivingWordService) {}
  @Get() list(@Query('locale') locale?: string, @Query('q') q?: string, @Query('page') page?: string) { return this.library.list(locale, q, page); }
  @Get('editor') @ApiBearerAuth() @Header('Cache-Control', 'no-store') drafts(@Headers('authorization') auth?: string) { return this.library.drafts(auth); }
  @Post('editor') @ApiBearerAuth() create(@Headers('authorization') auth: string | undefined, @Body() dto: TeachingDto) { return this.library.save(auth, undefined, dto); }
  @Put('editor/:id') @ApiBearerAuth() update(@Headers('authorization') auth: string | undefined, @Param('id') id: string, @Body() dto: TeachingDto) { return this.library.save(auth, id, dto); }
  @Post('editor/:id/unpublish') @ApiBearerAuth() unpublish(@Headers('authorization') auth: string | undefined, @Param('id') id: string) { return this.library.unpublish(auth, id); }
  @Get(':id') details(@Param('id') id: string) { return this.library.details(id); }
}
