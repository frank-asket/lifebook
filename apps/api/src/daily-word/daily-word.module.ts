import { Module } from '@nestjs/common';
import { MeditationModule } from '../meditation/meditation.module';
import { DailyWordController } from './daily-word.controller';
import { DailyWordService } from './daily-word.service';
@Module({ imports: [MeditationModule], controllers: [DailyWordController], providers: [DailyWordService] })
export class DailyWordModule {}
