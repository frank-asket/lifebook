import { Body, Controller, Get, Headers, Param, ParseIntPipe, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsString, Matches, Max, Min } from 'class-validator';
import { BibleReadingService } from './bible-reading.service';

class SaveHistoryDto {
  @IsIn(['en', 'fr']) locale!: string;
  @IsString() @Matches(/^[A-Z0-9]{3}\.[1-9][0-9]{0,2}$/) chapterId!: string;
  @IsOptional() @IsInt() @Min(1) @Max(200) verse?: number;
}
class CompleteDayDto { @IsInt() @Min(1) @Max(366) day!: number; }

@ApiTags('bible-reading')
@Controller('bible-reading')
export class BibleReadingController {
  constructor(private readonly reading: BibleReadingService) {}
  @Get('plans') plans(@Query('locale') locale?: string) { return this.reading.plans(locale); }
  @Get('plans/:id') plan(@Param('id') id: string, @Query('locale') locale?: string) { return this.reading.planDetails(id, locale); }
  @Get('history') @ApiBearerAuth() history(@Headers('authorization') auth?: string) { return this.reading.history(auth); }
  @Put('history') @ApiBearerAuth() save(@Headers('authorization') auth: string, @Body() dto: SaveHistoryDto) { return this.reading.saveHistory(auth, dto); }
  @Get('continue') @ApiBearerAuth() latest(@Headers('authorization') auth?: string) { return this.reading.continueReading(auth); }
  @Get('my-plans') @ApiBearerAuth() mine(@Headers('authorization') auth: string, @Query('locale') locale?: string) { return this.reading.myPlans(auth, locale); }
  @Post('plans/:id/enroll') @ApiBearerAuth() enroll(@Param('id') id: string, @Headers('authorization') auth: string) { return this.reading.enroll(auth, id); }
  @Post('enrollments/:id/complete-day') @ApiBearerAuth() complete(@Param('id') id: string, @Headers('authorization') auth: string, @Body() dto: CompleteDayDto) { return this.reading.completeDay(auth, id, dto.day); }
}
