import { Module } from '@nestjs/common';
import { PastorDirectoryService } from './pastor-directory.service';
import { PastorsController } from './pastors.controller';
@Module({ controllers: [PastorsController], providers: [PastorDirectoryService] })
export class PastorsModule {}
