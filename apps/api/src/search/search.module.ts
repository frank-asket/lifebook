import { Module } from '@nestjs/common';
import { BibleContentModule } from '../bible-content/bible-content.module';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';

@Module({ imports: [BibleContentModule], controllers: [SearchController], providers: [SearchService] })
export class SearchModule {}
