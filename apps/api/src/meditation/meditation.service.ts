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


  /**
   * A small, editorially curated starter rotation. UTC day is shared by all users.
   * Reference-only by design: do not redistribute unlicensed Bible translations.
   * Published meditation is intentionally NOT required for this response.
   * Replace the rotation with a reviewed editorial schedule in a later milestone.
   */
  dailyWord(locale?: string) {
    const language = this.normalizeLocale(locale);
    const day = this.getCurrentUtcDay();
    const entries = [
      { ref: 'Joshua 1:8', fr: 'Josué 1:8',
        enTitle: 'Meditate on the Word', frTitle: 'Méditer la Parole',
        enContext: 'God commissions Joshua after Moses and calls him to keep the law before him.',
        frContext: 'Dieu confie une mission à Josué après Moïse et l’appelle à garder la loi devant lui.',
        enMeaning: 'Meditation is joined to obedience; the passage addresses Joshua in his leadership calling.',
        frMeaning: 'La méditation est liée à l’obéissance ; ce passage s’adresse à Josué dans sa mission de dirigeant.',
        enQuestion: 'How can Scripture shape one decision today?', frQuestion: 'Comment la Parole peut-elle guider une décision aujourd’hui?',
        enPrayer: 'Lord, help me understand your Word and obey it with wisdom. Amen.',
        frPrayer: 'Seigneur, aide-moi à comprendre ta Parole et à lui obéir avec sagesse. Amen.',
        enAction: 'Read Joshua 1:1–9 and note one practical step.',
        frAction: 'Lisez Josué 1:1–9 et notez une action concrète.' },
      { ref: 'Psalm 119:105', fr: 'Psaume 119:105',
        enTitle: 'A Lamp for the Next Step', frTitle: 'Une lampe pour le prochain pas',
        enContext: 'Psalm 119 celebrates God’s instruction and its role in a faithful life.',
        frContext: 'Le Psaume 119 célèbre l’enseignement de Dieu et sa place dans une vie fidèle.',
        enMeaning: 'The image of a lamp points to guidance for walking faithfully, not a promise of knowing every future detail.',
        frMeaning: 'L’image de la lampe évoque la direction pour marcher fidèlement, non la connaissance de tout l’avenir.',
        enQuestion: 'Where do I need guidance for my next step?', frQuestion: 'Dans quel domaine ai-je besoin de direction pour mon prochain pas?',
        enPrayer: 'Lord, guide my steps as I learn and follow your Word. Amen.',
        frPrayer: 'Seigneur, guide mes pas pendant que j’apprends et suis ta Parole. Amen.',
        enAction: 'Read Psalm 119:97–112 and reflect on one choice.',
        frAction: 'Lisez Psaume 119:97–112 et réfléchissez à un choix.' },
      { ref: 'James 1:22', fr: 'Jacques 1:22',
        enTitle: 'Hear and Do', frTitle: 'Écouter et pratiquer',
        enContext: 'James urges believers to receive the Word and put it into practice.',
        frContext: 'Jacques exhorte les croyants à accueillir la Parole et à la mettre en pratique.',
        enMeaning: 'Listening without action is incomplete; genuine reception bears fruit in conduct.',
        frMeaning: 'Écouter sans agir reste incomplet ; accueillir vraiment la Parole transforme la conduite.',
        enQuestion: 'What have I heard but not yet practiced?', frQuestion: 'Qu’ai-je entendu sans encore le mettre en pratique?',
        enPrayer: 'Lord, make me attentive to your Word and ready to act. Amen.',
        frPrayer: 'Seigneur, rends-moi attentif à ta Parole et prêt à agir. Amen.',
        enAction: 'Read James 1:19–27 and practice one instruction.',
        frAction: 'Lisez Jacques 1:19–27 et pratiquez une instruction.' },
    ];
    const dayNumber = Math.floor(day.getTime() / 86400000);
    const entry = entries[((dayNumber % entries.length) + entries.length) % entries.length];
    const fr = language === 'fr';
    return {
      date: day.toISOString().slice(0, 10), locale: language,
      source: 'editorially-curated-starter-rotation',
      verse: { reference: fr ? entry.fr : entry.ref, text: null,
        readingNote: fr ? 'Lisez ce passage dans votre traduction biblique préférée.' : 'Read this passage in your preferred Bible translation.' },
      explanation: { title: fr ? entry.frTitle : entry.enTitle,
        context: fr ? entry.frContext : entry.enContext,
        meaning: fr ? entry.frMeaning : entry.enMeaning },
      meditation: { content: fr ? entry.frMeaning : entry.enMeaning },
      reflection: { questions: [fr ? entry.frQuestion : entry.enQuestion] },
      prayer: { content: fr ? entry.frPrayer : entry.enPrayer },
      dailyAction: { description: fr ? entry.frAction : entry.enAction },
    };
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