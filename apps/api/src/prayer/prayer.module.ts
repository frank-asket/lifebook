import { Module } from '@nestjs/common';
import { MeditationModule } from '../meditation/meditation.module';
import { PrayerController } from './prayer.controller';
import { PrayerService } from './prayer.service';
@Module({ imports: [MeditationModule], controllers: [PrayerController], providers: [PrayerService] })
export class PrayerModule {}
