import { database } from '../common/database';
import { Injectable, Logger, OnApplicationBootstrap, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { purgeCare } from './care-purge';

export const CARE_PURGE_FIRST_RUN_MS = 60_000;
export const CARE_PURGE_EVERY_MS = 6 * 60 * 60 * 1000;
// Any fixed number shared by every API instance, so only one of them purges at a time.
const LOCK = 7_310_090;

type Db = Pick<PrismaClient, '$transaction'>;

/**
 * Applies the pastoral care retention rules inside the API: a minute after start, then every six hours.
 * Off unless CARE_PURGE_SCHEDULE=on. Runs are idempotent, so restarts and deploys only make it run sooner.
 * Logs counts only.
 */
@Injectable()
export class CarePurgeScheduler implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly log = new Logger('CarePurge');
  private timers: NodeJS.Timeout[] = [];
  private db?: Db;
  constructor(db?: Db) { this.db = db; }

  static enabled(env: NodeJS.ProcessEnv = process.env) { return env.CARE_PURGE_SCHEDULE === 'on'; }

  onApplicationBootstrap() {
    if (!CarePurgeScheduler.enabled()) return;
    this.timers.push(setTimeout(() => void this.run(), CARE_PURGE_FIRST_RUN_MS), setInterval(() => void this.run(), CARE_PURGE_EVERY_MS));
    for (const timer of this.timers) timer.unref();
    this.log.log('Pastoral care retention scheduled every 6 hours');
  }

  async onModuleDestroy() {
    for (const timer of this.timers) clearTimeout(timer);
  }

  /** One retention pass. Returns the counts, or null when another instance holds the lock or the pass failed. */
  async run(now = new Date()) {
    this.db ??= database;
    try {
      const result = await this.db.$transaction(async tx => {
        const [{ locked }] = await tx.$queryRaw<{ locked: boolean }[]>`SELECT pg_try_advisory_xact_lock(${LOCK}) AS locked`;
        return locked ? purgeCare(tx, { apply: true, now }) : null;
      }, { timeout: 60_000 });
      if (result) this.log.log(`Retention applied: ${result.unclaimedClosed} unclaimed closed, ${result.requestsDeleted} requests and ${result.messagesDeleted} messages deleted, ${result.reportsDeleted} reports deleted`);
      return result;
    } catch (error) {
      // The error name only: database errors can quote values.
      this.log.error(`Retention pass failed (${(error as Error)?.name ?? 'error'}); it will retry at the next run`);
      return null;
    }
  }
}
