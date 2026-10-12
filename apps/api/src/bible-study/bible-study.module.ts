import { Module } from '@nestjs/common';
import { MeditationModule } from '../meditation/meditation.module';
import { BibleStudyController } from './bible-study.controller';
import { BibleStudyService } from './bible-study.service';
@Module({ imports: [MeditationModule], controllers: [BibleStudyController], providers: [BibleStudyService] })
export class BibleStudyModule {}
