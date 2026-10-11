import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Put,
  Query,
  ValidationPipe,
} from '@nestjs/common';

import {
  IsBoolean,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { MeditationService } from './meditation.service';

// ============================================================
// DTOs
// ============================================================

class ReflectionDto {
  @IsString()
  @MinLength(1)
  @MaxLength(10000)
  text!: string;
}

class BookmarkDto {
  @IsBoolean()
  saved!: boolean;
}

// ============================================================
// MEDITATION CONTROLLER
// ============================================================

@ApiTags('meditations')
@Controller('meditations')
export class MeditationController {
  constructor(
    private readonly service: MeditationService,
  ) { }

  /**
   * GET /api/v1/meditations/today
   *
   * Public endpoint.
   * Returns today's published meditation.
   */
  @Get('today')
  @ApiOperation({
    summary: "Get today's meditation",
  })
  today(@Query('locale') locale?: string) {
    return this.service.today(
      locale === 'fr' ? 'fr' : 'en',
    );
  }

  /**
   * GET /api/v1/meditations/history
   *
   * Authentication required.
   */
  @Get('history')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get meditation completion history',
  })
  history(
    @Headers('authorization') auth?: string,
  ) {
    return this.service.history(auth);
  }

  /**
   * GET /api/v1/meditations/saved
   *
   * Authentication required.
   */
  @Get('saved')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get bookmarked meditations',
  })
  saved(
    @Headers('authorization') auth?: string,
  ) {
    return this.service.saved(auth);
  }

  /**
   * GET /api/v1/meditations/:id/state
   *
   * Authentication required.
   */
  @Get(':id/state')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get personal meditation state',
  })
  state(
    @Param('id') id: string,
    @Headers('authorization') auth?: string,
  ) {
    return this.service.myState(id, auth);
  }

  /**
   * GET /api/v1/meditations/:id
   *
   * Public endpoint.
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get meditation by ID',
  })
  one(
    @Param('id') id: string,
  ) {
    return this.service.one(id);
  }

  /**
   * PUT /api/v1/meditations/:id/reflection
   *
   * Authentication required.
   */
  @Put(':id/reflection')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Save or update private reflection',
  })
  reflect(
    @Param('id') id: string,
    @Body(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }))
    body: ReflectionDto,
    @Headers('authorization') auth?: string,
  ) {
    return this.service.reflect(
      id,
      body.text,
      auth,
    );
  }

  /**
   * POST /api/v1/meditations/:id/complete
   *
   * Authentication required.
   */
  @Post(':id/complete')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Mark meditation as completed',
  })
  complete(
    @Param('id') id: string,
    @Headers('authorization') auth?: string,
  ) {
    return this.service.complete(id, auth);
  }

  /**
   * PUT /api/v1/meditations/:id/bookmark
   *
   * Authentication required.
   */
  @Put(':id/bookmark')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Bookmark or remove bookmark',
  })
  bookmark(
    @Param('id') id: string,
    @Body(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }))
    body: BookmarkDto,
    @Headers('authorization') auth?: string,
  ) {
    return this.service.bookmark(
      id,
      body.saved,
      auth,
    );
  }
}