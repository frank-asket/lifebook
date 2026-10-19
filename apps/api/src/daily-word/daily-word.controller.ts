import { Body, Controller, Delete, Get, Headers, Param, Post, Put, Query, ValidationPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength, IsOptional } from 'class-validator';
import { DailyWordService } from './daily-word.service';
class SessionDto { @IsOptional() @IsString() timezone?: string; }
class ReflectionDto { @IsString() @MinLength(1) @MaxLength(10000) content!: string; }
const validate = new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true });
@ApiTags('daily-word') @ApiBearerAuth() @Controller('daily-word')
export class DailyWordController {
  constructor(private readonly service: DailyWordService) {}
  @Post('sessions/today') start(@Headers('authorization') auth: string, @Body(validate) dto: SessionDto) { return this.service.today(auth, dto.timezone); }
  @Get('sessions/today') today(@Headers('authorization') auth: string, @Query('timezone') timezone?: string) { return this.service.today(auth, timezone); }
  @Put('sessions/:id/steps/:step') step(@Headers('authorization') auth: string, @Param('id') id: string, @Param('step') step: string) { return this.service.completeStep(auth, id, step); }
  @Put('sessions/:id/reflection') reflection(@Headers('authorization') auth: string, @Param('id') id: string, @Body(validate) dto: ReflectionDto) { return this.service.saveReflection(auth, id, dto.content); }
  @Delete('sessions/:id/reflection') removeReflection(@Headers('authorization') auth: string, @Param('id') id: string) { return this.service.removeReflection(auth, id); }
  @Get('sessions') history(@Headers('authorization') auth: string, @Query('limit') limit?: string) { return this.service.history(auth, limit); }
  @Get('stats') stats(@Headers('authorization') auth: string) { return this.service.stats(auth); }
}
