import { Module } from '@nestjs/common';
import { BibleReadingController } from './bible-reading.controller';
import { BibleReadingService } from './bible-reading.service';
@Module({ controllers: [BibleReadingController], providers: [BibleReadingService], exports: [BibleReadingService] })
export class BibleReadingModule {}
