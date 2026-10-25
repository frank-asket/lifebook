import { Module } from '@nestjs/common';
import { BibleContentModule } from '../bible-content/bible-content.module';
import { MeditationModule } from '../meditation/meditation.module';
import { PrayerCompanionController } from './prayer-companion.controller';
import { PrayerCompanionService } from './prayer-companion.service';
import { PrayerController } from './prayer.controller';
import { PrayerService } from './prayer.service';
import { GuidedMeditationService } from './guided-meditation.service';
import { PrayerVerseService } from './prayer-verse.service';
@Module({ imports: [MeditationModule, BibleContentModule], controllers: [PrayerController, PrayerCompanionController], providers: [PrayerService, PrayerCompanionService, GuidedMeditationService, PrayerVerseService] })
export class PrayerModule {}
