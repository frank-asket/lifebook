import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleDestroy,
  UnauthorizedException,
} from '@nestjs/common';

import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@clerk/backend';

type SupportedLocale = 'en' | 'fr';

@Injectable()
export class MeditationService implements OnModuleDestroy {
  private readonly db = new PrismaClient();

  /**
   * Disconnect Prisma when NestJS shuts down.
   */
  async onModuleDestroy(): Promise<void> {
    await this.db.$disconnect();
  }

  // ============================================================
  // HELPERS
  // ============================================================

  /**
   * Normalize the requested language.
   *
   * Currently supported:
   * - English
   * - French
   *
   * Defaults to English.
   */
  private normalizeLocale(locale?: string): SupportedLocale {
    return locale === 'fr' ? 'fr' : 'en';
  }

  /**
   * Return the start of the current UTC calendar day.
   *
   * Example:
   * 2026-10-12T00:00:00.000Z
   *
   * NOTE:
   * This is a UTC-based publishing rule.
   * It does not implement user-local-midnight publishing.
   */
  private getCurrentUtcDay(): Date {
    const now = new Date();

    return new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
      ),
    );
  }

  /**
   * Validate a meditation ID.
   */
  private validateMeditationId(id: string): void {
    if (!id || !id.trim()) {
      throw new BadRequestException(
        'Meditation ID is required.',
      );
    }
  }

  // ============================================================
  // AUTHENTICATION
  // ============================================================

  /**
   * Verify the Clerk session token and return
   * the internal LifeBook database user ID.
   *
   * The Clerk subject is used as the identity key.
   */
  async userId(auth?: string): Promise<string> {
    if (!auth?.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Bearer token required',
      );
    }

    const rawToken = auth.slice(7).trim();

    if (!rawToken) {
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

    const authorizedParties = (
      process.env.CLERK_AUTHORIZED_PARTIES || ''
    )
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);

    let subject: string;

    try {
      const token = await verifyToken(rawToken, {
        secretKey,

        ...(authorizedParties.length > 0
          ? { authorizedParties }
          : {}),
      });

      if (!token.sub) {
        throw new Error('Missing Clerk subject');
      }

      subject = token.sub;
    } catch {
      throw new UnauthorizedException(
        'Invalid or expired access token',
      );
    }

    /**
     * Keep database operations outside the
     * authentication catch block.
     *
     * Database errors should not be reported
     * as invalid authentication tokens.
     */
    const user = await this.db.user.upsert({
      where: {
        oidcSubject: subject,
      },

      create: {
        oidcSubject: subject,
      },

      update: {},
    });

    return user.id;
  }

  // ============================================================
  // DAILY MEDITATION
  // ============================================================

  /**
   * GET TODAY'S MEDITATION
   *
   * Returns the latest published meditation
   * whose publication date is today or earlier.
   *
   * Selection rules:
   *
   * 1. Meditation must be published.
   * 2. Language must match.
   * 3. Publication date must be eligible.
   * 4. Most recent eligible meditation wins.
   *
   * This is a fallback model:
   * If no meditation is scheduled specifically
   * for today, an older published meditation
   * may be returned.
   */
  async today(locale = 'en') {
    const language = this.normalizeLocale(locale);

    const currentDay = this.getCurrentUtcDay();

    const meditation = await this.db.meditation.findFirst({
      where: {
        isPublished: true,

        locale: language,

        publishDate: {
          lte: currentDay,
        },
      },

      orderBy: [
        {
          publishDate: 'desc',
        },
        {
          createdAt: 'desc',
        },
      ],
    });

    if (!meditation) {
      throw new NotFoundException(
        `No published meditation is available for locale "${language}".`,
      );
    }

    return meditation;
  }

  // ============================================================
  // GET MEDITATION BY ID
  // ============================================================

  /**
   * Retrieve an individual published meditation.
   *
   * Unpublished meditations are not accessible
   * through this public method.
   */
  async one(id: string) {
    this.validateMeditationId(id);

    const meditation = await this.db.meditation.findFirst({
      where: {
        id,
        isPublished: true,
      },
    });

    if (!meditation) {
      throw new NotFoundException(
        'Meditation not found',
      );
    }

    return meditation;
  }

  // ============================================================
  // MEDITATION HISTORY
  // ============================================================

  /**
   * Return the authenticated user's
   * completed meditation history.
   *
   * Maximum:
   * 100 most recent completions.
   */
  async history(auth?: string) {
    const userId = await this.userId(auth);

    return this.db.meditationCompletion.findMany({
      where: {
        userId,
      },

      include: {
        meditation: true,
      },

      orderBy: {
        completedAt: 'desc',
      },

      take: 100,
    });
  }

  // ============================================================
  // SAVED MEDITATIONS
  // ============================================================

  /**
   * Return the authenticated user's
   * bookmarked meditations.
   */
  async saved(auth?: string) {
    const userId = await this.userId(auth);

    return this.db.meditationBookmark.findMany({
      where: {
        userId,
      },

      include: {
        meditation: true,
      },

      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // ============================================================
  // PERSONAL MEDITATION STATE
  // ============================================================

  /**
   * Retrieve the authenticated user's:
   *
   * - Reflection
   * - Completion status
   * - Bookmark status
   */
  async myState(id: string, auth?: string) {
    this.validateMeditationId(id);

    const userId = await this.userId(auth);

    await this.one(id);

    const [
      reflection,
      completion,
      bookmark,
    ] = await Promise.all([
      this.db.meditationReflection.findUnique({
        where: {
          userId_meditationId: {
            userId,
            meditationId: id,
          },
        },
      }),

      this.db.meditationCompletion.findUnique({
        where: {
          userId_meditationId: {
            userId,
            meditationId: id,
          },
        },
      }),

      this.db.meditationBookmark.findUnique({
        where: {
          userId_meditationId: {
            userId,
            meditationId: id,
          },
        },
      }),
    ]);

    return {
      reflection: reflection?.text ?? '',

      completedAt: completion?.completedAt ?? null,

      bookmarked: Boolean(bookmark),
    };
  }

  // ============================================================
  // PRIVATE REFLECTION
  // ============================================================

  /**
   * Save or update a personal reflection.
   *
   * IMPORTANT:
   * Reflection content is sensitive.
   *
   * This implementation preserves the existing
   * plaintext database storage behavior.
   *
   * Application-level encryption and appropriate
   * key management should be implemented before
   * enabling sensitive reflection storage
   * in production.
   */
  async reflect(
    id: string,
    text: string,
    auth?: string,
  ) {
    this.validateMeditationId(id);

    if (typeof text !== 'string') {
      throw new BadRequestException(
        'Reflection must be a string.',
      );
    }

    const normalizedText = text.trim();

    if (!normalizedText) {
      throw new BadRequestException(
        'Reflection cannot be empty.',
      );
    }

    if (normalizedText.length > 10000) {
      throw new BadRequestException(
        'Reflection cannot exceed 10,000 characters.',
      );
    }

    const userId = await this.userId(auth);

    await this.one(id);

    return this.db.meditationReflection.upsert({
      where: {
        userId_meditationId: {
          userId,
          meditationId: id,
        },
      },

      create: {
        userId,
        meditationId: id,
        text: normalizedText,
      },

      update: {
        text: normalizedText,
      },

      select: {
        updatedAt: true,
      },
    });
  }

  // ============================================================
  // COMPLETE MEDITATION
  // ============================================================

  /**
   * Mark a meditation as completed.
   *
   * Uses upsert to avoid creating duplicate
   * completion records.
   */
  async complete(id: string, auth?: string) {
    this.validateMeditationId(id);

    const userId = await this.userId(auth);

    await this.one(id);

    return this.db.meditationCompletion.upsert({
      where: {
        userId_meditationId: {
          userId,
          meditationId: id,
        },
      },

      create: {
        userId,
        meditationId: id,
      },

      update: {},

      select: {
        completedAt: true,
      },
    });
  }

  // ============================================================
  // BOOKMARK MEDITATION
  // ============================================================

  /**
   * Add or remove a meditation bookmark.
   *
   * saved = true  -> bookmark
   * saved = false -> remove bookmark
   */
  async bookmark(
    id: string,
    saved: boolean,
    auth?: string,
  ) {
    this.validateMeditationId(id);

    if (typeof saved !== 'boolean') {
      throw new BadRequestException(
        'Saved must be a boolean.',
      );
    }

    const userId = await this.userId(auth);

    await this.one(id);

    /**
     * Remove bookmark.
     */
    if (!saved) {
      await this.db.meditationBookmark.deleteMany({
        where: {
          userId,
          meditationId: id,
        },
      });

      return {
        bookmarked: false,
      };
    }

    /**
     * Create bookmark if it does not exist.
     */
    await this.db.meditationBookmark.upsert({
      where: {
        userId_meditationId: {
          userId,
          meditationId: id,
        },
      },

      create: {
        userId,
        meditationId: id,
      },

      update: {},
    });

    return {
      bookmarked: true,
    };
  }
}