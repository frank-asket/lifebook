import { Module } from '@nestjs/common';
import { BibleReadingModule } from '../bible-reading/bible-reading.module';
import { LivingWordController } from './livingword.controller';
import { LivingWordService } from './livingword.service';
@Module({ imports: [BibleReadingModule], controllers: [LivingWordController], providers: [LivingWordService] })
export class LivingWordModule {}
