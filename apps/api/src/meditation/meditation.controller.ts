import {
  Body,
  Controller,
  Get,
  Headers,
  NotFoundException,
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
  ) {}

  /**
   * GET /api/v1/meditations/today
   *
   * Public endpoint.
   *
   * Returns the latest eligible published meditation
   * for the requested language.
   *
   * Supported languages:
   * - en: English (default)
   * - fr: French
   *
   * Returns:
   * - 200: Published meditation
   * - 404: No published meditation available
   */

  /** Public, curated scripture-first daily journey; independent of published meditations. */
  @Get('daily-word/today')
  @ApiOperation({ summary: 'Get the scripture-first daily journey' })
  dailyWord(@Query('locale') locale?: string, @Query('date') date?: string) {
    return this.service.dailyWord(locale, date);
  }

  @Get('today')
  @ApiOperation({
    summary: "Get today's meditation",
  })
  async today(
    @Query('locale') locale?: string,
  ) {
    const language = locale === 'fr' ? 'fr' : 'en';

    const meditation = await this.service.today(language);

    if (!meditation) {
      throw new NotFoundException(
        `No published meditation is available for locale "${language}".`,
      );
    }

    return meditation;
  }

  /**
   * GET /api/v1/meditations/history
   *
   * Authentication required.
   *
   * Returns the authenticated user's
   * completed meditation history.
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
   *
   * Returns the authenticated user's
   * bookmarked meditations.
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
   *
   * Returns the authenticated user's
   * reflection, completion status,
   * and bookmark status.
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
   *
   * Returns a meditation by its ID.
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
   *
   * Saves or updates the authenticated
   * user's personal reflection.
   *
   * Validation:
   * - Must be a string
   * - Minimum 1 character
   * - Maximum 10,000 characters
   */
  @Put(':id/reflection')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Save or update private reflection',
  })
  reflect(
    @Param('id') id: string,
    @Body(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    )
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
   *
   * Marks the meditation as completed
   * for the authenticated user.
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
   *
   * Request body:
   * {
   *   "saved": true
   * }
   *
   * Set saved to false to remove
   * an existing bookmark.
   */
  @Put(':id/bookmark')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Bookmark or remove bookmark',
  })
  bookmark(
    @Param('id') id: string,
    @Body(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    )
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