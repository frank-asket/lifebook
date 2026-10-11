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

// ============================================================
// SPRINT 2 — MEDITATION MODULE
// ============================================================

import { MeditationModule } from './meditation/meditation.module';

// ============================================================
// DATABASE SERVICE
// ============================================================

@Injectable()
class Database
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

// ============================================================
// CLERK IDENTITY SERVICE
// ============================================================

@Injectable()
class Identity {
  async subject(authorization?: string): Promise<string> {
    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Bearer token required');
    }

    const secretKey = process.env.CLERK_SECRET_KEY;

    if (!secretKey) {
      throw new UnauthorizedException('Clerk not configured');
    }

    try {
      const token = authorization.slice(7);

      const authorizedParties = (
        process.env.CLERK_AUTHORIZED_PARTIES || ''
      )
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);

      const payload = await verifyToken(token, {
        secretKey,
        authorizedParties,
      });

      if (!payload.sub) {
        throw new Error('Missing subject');
      }

      return payload.sub;
    } catch {
      throw new UnauthorizedException('Invalid access token');
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
  constructor(private readonly db: Database) { }

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
  constructor(private readonly db: Database) { }

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
  ) { }

  /**
   * Resolve Clerk identity to internal LifeBook user.
   */
  private async user(authorization?: string) {
    const subject = await this.identity.subject(authorization);

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
  async get(@Headers('authorization') auth?: string) {
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

@Module({
  imports: [
    // Sprint 2 — Daily Bible Meditation
    MeditationModule,
  ],

  controllers: [
    HealthController,
    DevotionalsController,
    PathsController,
    ProfileController,
  ],

  providers: [
    Database,
    Identity,
  ],
})
export class AppModule { }