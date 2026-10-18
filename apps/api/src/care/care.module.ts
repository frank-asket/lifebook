import { Module } from '@nestjs/common';
import { MeditationModule } from '../meditation/meditation.module';
import { CareController } from './care.controller';
import { CarePurgeScheduler } from './care-purge.scheduler';
import { CareService } from './care.service';
@Module({ imports: [MeditationModule], controllers: [CareController], providers: [CareService, { provide: CarePurgeScheduler, useFactory: () => new CarePurgeScheduler() }] })
export class CareModule {}
