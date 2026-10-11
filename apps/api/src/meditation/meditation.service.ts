import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  OnModuleDestroy,
} from '@nestjs/common';

import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@clerk/backend';

@Injectable()
export class MeditationService implements OnModuleDestroy {
  private readonly db = new PrismaClient();

  async onModuleDestroy(): Promise<void> {
    await this.db.$disconnect();
  }

  /**
   * Verify the Clerk session token and return
   * the internal LifeBook database user ID.
   */
  async userId(auth?: string): Promise<string> {
    if (!auth?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Bearer token required');
    }

    const secretKey = process.env.CLERK_SECRET_KEY;

    if (!secretKey) {
      throw new UnauthorizedException('Clerk not configured');
    }

    const parties = (process.env.CLERK_AUTHORIZED_PARTIES || '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);

    let subject: string;

    try {
      const token = await verifyToken(auth.slice(7), {
        secretKey,
        ...(parties.length ? { authorizedParties: parties } : {}),
      });

      if (!token.sub) {
        throw new Error('Missing subject');
      }

      subject = token.sub;
    } catch {
      throw new UnauthorizedException('Invalid access token');
    }

    // Keep database operations outside the authentication catch.
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

  /**
   * Return the latest published meditation
   * scheduled for today or an earlier date.
   */
  async today(locale = 'en') {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    return this.db.meditation.findFirst({
      where: {
        isPublished: true,
        locale,
        publishDate: {
          lte: today,
        },
      },
      orderBy: [
        { publishDate: 'desc' },
        { createdAt: 'desc' },
      ],
    });
  }

  /**
   * Retrieve a published meditation.
   */
  async one(id: string) {
    const meditation = await this.db.meditation.findFirst({
      where: {
        id,
        isPublished: true,
      },
    });

    if (!meditation) {
      throw new NotFoundException('Meditation not found');
    }

    return meditation;
  }

  /**
   * Return the authenticated user's
   * completed meditation history.
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

  /**
   * Return the authenticated user's bookmarks.
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

  /**
   * Return the authenticated user's
   * reflection, completion, and bookmark state.
   */
  async myState(id: string, auth?: string) {
    const userId = await this.userId(auth);

    await this.one(id);

    const [reflection, completion, bookmark] = await Promise.all([
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

  /**
   * Save or update a private meditation reflection.
   *
   * NOTE:
   * Encryption must be implemented before
   * enabling this endpoint in production.
   */
  async reflect(id: string, text: string, auth?: string) {
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
        text,
      },
      update: {
        text,
      },
      select: {
        updatedAt: true,
      },
    });
  }

  /**
   * Mark a meditation as completed.
   */
  async complete(id: string, auth?: string) {
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

  /**
   * Add or remove a meditation bookmark.
   */
  async bookmark(id: string, saved: boolean, auth?: string) {
    const userId = await this.userId(auth);

    await this.one(id);

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