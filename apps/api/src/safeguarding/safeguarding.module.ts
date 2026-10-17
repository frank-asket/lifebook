import { Module } from '@nestjs/common';
import { MeditationModule } from '../meditation/meditation.module';
import { SafeguardingController } from './safeguarding.controller';
import { SafeguardingService } from './safeguarding.service';
@Module({ imports: [MeditationModule], controllers: [SafeguardingController], providers: [SafeguardingService] })
export class SafeguardingModule {}
