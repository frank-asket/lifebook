import { Module } from '@nestjs/common';
import { MeditationModule } from '../meditation/meditation.module';
import { CareController } from './care.controller';
import { CareService } from './care.service';
@Module({ imports: [MeditationModule], controllers: [CareController], providers: [CareService] })
export class CareModule {}
