import { Module } from '@nestjs/common';
import { MeditationModule } from '../meditation/meditation.module';
import { BibleAnnotationsController } from './bible-annotations.controller';
import { BibleAnnotationsService } from './bible-annotations.service';
@Module({ imports: [MeditationModule], controllers: [BibleAnnotationsController], providers: [BibleAnnotationsService] })
export class BibleAnnotationsModule {}
