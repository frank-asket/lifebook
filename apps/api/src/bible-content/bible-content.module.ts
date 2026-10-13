import { Module } from '@nestjs/common';

import { BibleContentController } from './content.controller';
import { BibleContentService } from './content.service';

@Module({
  controllers: [BibleContentController],

  providers: [BibleContentService],

  exports: [BibleContentService],
})
export class BibleContentModule {}