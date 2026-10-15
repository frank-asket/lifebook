import { Module } from '@nestjs/common';

import { BibleContentController } from './bible-content.controller';
import { BibleContentService } from './bible-content.service';

@Module({
  controllers: [BibleContentController],

  providers: [BibleContentService],

  exports: [BibleContentService],
})
export class BibleContentModule {}