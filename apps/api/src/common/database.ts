import { PrismaClient } from '@prisma/client';
import type { OnModuleDestroy, OnModuleInit } from '@nestjs/common';

export class Database extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() { await this.$connect(); }
  async onModuleDestroy() { await this.$disconnect(); }
}
export const database = new Database();
