import { Module } from '@nestjs/common';
import { BibleContentModule } from '../bible-content/bible-content.module';
import { MeditationController } from './meditation.controller';
import { MeditationService } from './meditation.service';
@Module({ imports: [BibleContentModule], controllers: [MeditationController], providers: [MeditationService], exports: [MeditationService] })
export class MeditationModule {}
