import { Module } from '@nestjs/common';
import { BibleReadingModule } from '../bible-reading/bible-reading.module';
import { SuggestionsController } from './suggestions.controller';
import { SuggestionsService } from './suggestions.service';

@Module({ imports: [BibleReadingModule], controllers: [SuggestionsController], providers: [SuggestionsService] })
export class SuggestionsModule {}
