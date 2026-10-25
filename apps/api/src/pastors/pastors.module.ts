import { Module } from '@nestjs/common';
import { MeditationModule } from '../meditation/meditation.module';
import { PastorApplicationController } from './pastor-application.controller';
import { PastorApplicationService } from './pastor-application.service';
import { PastorDirectoryService } from './pastor-directory.service';
import { PastorsController } from './pastors.controller';
@Module({ imports: [MeditationModule], controllers: [PastorsController, PastorApplicationController], providers: [PastorDirectoryService, PastorApplicationService] })
export class PastorsModule {}
