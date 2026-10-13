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

  /** Curated Scripture-first starter rotation; no database writes. */
  dailyWord(locale = 'en') {
    const language = this.normalizeLocale(locale);
    const days = Math.floor(this.getCurrentUtcDay().getTime() / 86400000);
    const passages = [
      {
        reference: 'Joshua 1:8', referenceFr: 'Josué 1:8',
        en: 'This book of the law shall not depart out of thy mouth; but thou shalt meditate therein day and night, that thou mayest observe to do according to all that is written therein: for then thou shalt make thy way prosperous, and then thou shalt have good success.',
        fr: 'Que ce livre de la loi ne s’éloigne pas de ta bouche. Médite-le jour et nuit, afin de veiller à agir selon tout ce qui y est écrit. Alors tu avanceras avec sagesse dans ta voie.',
        explanationEn: 'God speaks to Joshua as he prepares to lead Israel. Meditation is linked to faithful action, not merely acquiring information.',
        explanationFr: 'Dieu parle à Josué alors qu’il se prépare à conduire Israël. La méditation est liée à une mise en pratique fidèle, et pas seulement à la connaissance.',
        questionEn: 'What part of God’s Word can guide one decision today?',
        questionFr: 'Quelle parole de Dieu peut guider une décision aujourd’hui?',
        prayerEn: 'Lord, teach me to listen to your Word and act on it today. Amen.',
        prayerFr: 'Seigneur, apprends-moi à écouter ta Parole et à la mettre en pratique aujourd’hui. Amen.',
        actionEn: 'Choose one concrete action shaped by today’s Scripture.',
        actionFr: 'Choisissez une action concrète inspirée de la Parole du jour.',
      },
      {
        reference: 'Psalm 119:105', referenceFr: 'Psaume 119:105',
        en: 'Thy word is a lamp unto my feet, and a light unto my path.',
        fr: 'Ta parole est une lampe pour mes pieds et une lumière sur mon chemin.',
        explanationEn: 'The psalmist describes God’s Word as guidance for the next steps of life, not a promise that every future detail will be visible.',
        explanationFr: 'Le psalmiste présente la Parole de Dieu comme une lumière pour les prochains pas, non comme la promesse de connaître chaque détail de l’avenir.',
        questionEn: 'Where do I need guidance for my next step?',
        questionFr: 'Dans quel domaine ai-je besoin de lumière pour mon prochain pas?',
        prayerEn: 'God, guide my next step through your Word. Amen.',
        prayerFr: 'Seigneur, guide mon prochain pas par ta Parole. Amen.',
        actionEn: 'Take one thoughtful step guided by Scripture.',
        actionFr: 'Faites un pas réfléchi à la lumière des Écritures.',
      },
      {
        reference: 'James 1:22', referenceFr: 'Jacques 1:22',
        en: 'But be ye doers of the word, and not hearers only, deceiving your own selves.',
        fr: 'Mettez la parole en pratique, ne vous contentez pas de l’écouter en vous trompant vous-mêmes.',
        explanationEn: 'James challenges believers to connect hearing with obedience. Genuine listening produces a response in daily life.',
        explanationFr: 'Jacques invite les croyants à unir écoute et obéissance. Une écoute sincère se traduit par des actes au quotidien.',
        questionEn: 'What have I heard in Scripture that I still need to practice?',
        questionFr: 'Quelle parole entendue dois-je encore mettre en pratique?',
        prayerEn: 'Lord, help me respond to your Word with action. Amen.',
        prayerFr: 'Seigneur, aide-moi à répondre à ta Parole par des actes. Amen.',
        actionEn: 'Put one biblical teaching into practice today.',
        actionFr: 'Mettez un enseignement biblique en pratique aujourd’hui.',
      },
    ];
    const item = passages[((days % passages.length) + passages.length) % passages.length];
    const french = language === 'fr';
    return {
      date: this.getCurrentUtcDay().toISOString().slice(0, 10),
      locale: language,
      verse: {
        reference: french ? item.referenceFr : item.reference,
        text: french ? item.fr : item.en,
        translation: french ? 'Traduction française de travail — révision éditoriale requise' : 'King James Version (KJV)',
      },
      explanation: french ? item.explanationFr : item.explanationEn,
      meditation: french ? 'Relisez lentement ce passage. Observez les mots qui vous interpellent et considérez leur sens dans votre vie.' : 'Read the passage slowly again. Notice what stands out and consider how its meaning relates to your life.',
      reflectionQuestion: french ? item.questionFr : item.questionEn,
      prayer: french ? item.prayerFr : item.prayerEn,
      application: french ? item.actionFr : item.actionEn,
    };
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