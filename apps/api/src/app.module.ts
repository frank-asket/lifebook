import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { BibleAnnotationsModule } from './bible-annotations/bible-annotations.module';
import { BibleReadingModule } from './bible-reading/bible-reading.module';
import {
  Module,
  Controller,
  Get,
  Injectable,
  UnauthorizedException,
  Headers,
  Put,
  Body,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';

import { PrismaClient, FaithJourney } from '@prisma/client';
import { verifyToken } from '@clerk/backend';

import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
} from 'class-validator';

import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { BibleContentModule } from './bible-content/bible-content.module';

// ============================================================
// LIFEBOOK FEATURE MODULES
// ============================================================

// Sprint 2 — Daily Bible Meditation
import { MeditationModule } from './meditation/meditation.module';

// Bible Study — Curated Learning Library
import { BibleStudyModule } from './bible-study/bible-study.module';

// Milestone 3.4 — Persistent Daily Word Sessions
import { DailyWordModule } from './daily-word/daily-word.module';
import { PrayerModule } from './prayer/prayer.module';
import { PastorsModule } from './pastors/pastors.module';
import { CareModule } from './care/care.module';
import { SafeguardingModule } from './safeguarding/safeguarding.module';

// ============================================================
// DATABASE SERVICE
// ============================================================

@Injectable()
class Database
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}

// ============================================================
// CLERK IDENTITY SERVICE
// ============================================================

@Injectable()
class Identity {
  /**
   * Verify the Clerk session token.
   *
   * Returns the authenticated Clerk subject.
   *
   * The internal LifeBook user ID is resolved separately
   * using the User.oidcSubject field.
   */
  async subject(authorization?: string): Promise<string> {
    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Bearer token required',
      );
    }

    const token = authorization.slice(7).trim();

    if (!token) {
      throw new UnauthorizedException(
        'Bearer token required',
      );
    }

    const secretKey = process.env.CLERK_SECRET_KEY;

    if (!secretKey) {
      throw new UnauthorizedException(
        'Clerk authentication is not configured',
      );
    }

    // --------------------------------------------------------
    // Parse configured authorized parties
    // --------------------------------------------------------

    const authorizedParties: string[] = (
      process.env.CLERK_AUTHORIZED_PARTIES ?? ''
    )
      .split(',')
      .map((value: string) => value.trim())
      .filter((value: string) => value.length > 0);

    // --------------------------------------------------------
    // Verify Clerk token
    // --------------------------------------------------------

    try {
      const payload = await verifyToken(token, {
        secretKey,

        // Only include authorizedParties when configured.
        ...(authorizedParties.length > 0
          ? { authorizedParties }
          : {}),
      });

      if (!payload.sub) {
        throw new UnauthorizedException(
          'Token subject is missing',
        );
      }

      return payload.sub;
    } catch {
      throw new UnauthorizedException(
        'Invalid or expired access token',
      );
    }
  }
}

// ============================================================
// PROFILE DTO
// ============================================================

class ProfileDto {
  @IsOptional()
  @IsEnum(FaithJourney)
  journey?: FaithJourney;

  @IsOptional()
  @IsIn(['en', 'fr'])
  language?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(12)
  @IsString({ each: true })
  learningGoals?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @IsString({ each: true })
  preferredFormats?: string[];

  @IsOptional()
  @IsBoolean()
  personalizationConsent?: boolean;

  @IsOptional()
  @IsBoolean()
  aiProcessingConsent?: boolean;
}

// ============================================================
// HEALTH CONTROLLER
// ============================================================

@ApiTags('system')
@Controller('health')
class HealthController {
  /**
   * GET /api/v1/health
   */
  @Get()
  health() {
    return {
      status: 'ok',
      service: 'lifebook-api',
    };
  }
}

// ============================================================
// DEVOTIONALS CONTROLLER
// ============================================================

@ApiTags('content')
@Controller('devotionals')
class DevotionalsController {
  constructor(
    private readonly db: Database,
  ) {}

  /**
   * GET /api/v1/devotionals/latest
   */
  @Get('latest')
  latest() {
    return this.db.devotional.findFirst({
      where: {
        publishedAt: {
          lte: new Date(),
        },
      },
      orderBy: {
        publishedAt: 'desc',
      },
    });
  }
}

// ============================================================
// DISCIPLESHIP CONTROLLER
// ============================================================

@ApiTags('discipleship')
@Controller('paths')
class PathsController {
  constructor(
    private readonly db: Database,
  ) {}

  /**
   * GET /api/v1/paths
   */
  @Get()
  list() {
    return this.db.learningPath.findMany({
      where: {
        isPublished: true,
      },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
      },
    });
  }
}

// ============================================================
// USER PROFILE CONTROLLER
// ============================================================

@ApiTags('profile')
@ApiBearerAuth()
@Controller('me/profile')
class ProfileController {
  constructor(
    private readonly db: Database,
    private readonly identity: Identity,
  ) {}

  /**
   * Resolve the authenticated Clerk identity
   * to the internal LifeBook database user.
   *
   * If the user does not exist, create their record.
   */
  private async user(authorization?: string) {
    const subject = await this.identity.subject(
      authorization,
    );

    return this.db.user.upsert({
      where: {
        oidcSubject: subject,
      },
      create: {
        oidcSubject: subject,
      },
      update: {},
    });
  }

  /**
   * GET /api/v1/me/profile
   */
  @Get()
  async get(
    @Headers('authorization') auth?: string,
  ) {
    const user = await this.user(auth);

    const profile = await this.db.faithProfile.findUnique({
      where: {
        userId: user.id,
      },
    });

    return {
      userId: user.id,
      role: user.role,
      profile,
    };
  }

  /**
   * PUT /api/v1/me/profile
   */
  @Put()
  async update(
    @Headers('authorization') auth: string,
    @Body() dto: ProfileDto,
  ) {
    const user = await this.user(auth);

    return this.db.faithProfile.upsert({
      where: {
        userId: user.id,
      },

      create: {
        userId: user.id,
        learningGoals: [],
        preferredFormats: [],
        ...dto,
      },

      update: dto,
    });
  }
}

// ============================================================
// ROOT APPLICATION MODULE
// ============================================================

const requestLimit = Number(process.env.API_RATE_LIMIT || '120');
if (!Number.isInteger(requestLimit) || requestLimit < 1 || requestLimit > 10000) throw new Error('API_RATE_LIMIT must be between 1 and 10000');

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60000, limit: requestLimit }]),
    BibleReadingModule,
    BibleContentModule,
    BibleAnnotationsModule,
    // Sprint 2 — Daily Bible Meditation
    MeditationModule,

    // Bible Study — Curated Learning Library
    BibleStudyModule,

    // Milestone 3.4 — Persistent Daily Word Sessions
    DailyWordModule,

    // Milestone 3.7 — Private Prayer Journal
    PrayerModule,

    // Pastoral care pilot — verified pastor directory
    PastorsModule,
    CareModule,
    SafeguardingModule,
  ],

  controllers: [
    HealthController,
    DevotionalsController,
    PathsController,
    ProfileController,
  ],

  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard },
    Database,
    Identity,
  ],
})


export class AppModule {}

