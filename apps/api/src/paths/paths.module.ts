import { Module } from '@nestjs/common';
import { BibleReadingModule } from '../bible-reading/bible-reading.module';
import { PathsController } from './paths.controller';
import { PathsService } from './paths.service';
@Module({ imports: [BibleReadingModule], controllers: [PathsController], providers: [PathsService] })
export class PathsModule {}
