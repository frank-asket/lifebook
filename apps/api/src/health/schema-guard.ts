import { Logger } from '@nestjs/common';
import { existsSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

/** Migrations this build was made with: every folder under prisma/migrations that holds a migration.sql. */
export function bundledMigrations(dir = resolve(__dirname, '../../prisma/migrations')): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter(entry => entry.isDirectory() && existsSync(join(dir, entry.name, 'migration.sql')))
    .map(entry => entry.name)
    .sort();
}

type Db = { $queryRaw<T = unknown>(query: TemplateStringsArray, ...values: unknown[]): Promise<T> };
export type SchemaState = { state: 'current' } | { state: 'behind'; pending: number } | { state: 'unchecked' } | { state: 'unavailable' };

/**
 * Render deploys the API on every merge, so code can go live before its migrations are applied.
 * The health check reports "behind" when the database lacks a migration this build needs: Render then
 * never promotes an unverified deploy. Database errors and missing migration bundles fail readiness.
 * SCHEMA_GUARD=off explicitly disables schema verification.
 */
export class SchemaGuard {
  private readonly log = new Logger('SchemaGuard');
  private cached?: { at: number; value: SchemaState };
  private reported = '';
  constructor(private readonly db: Db, private readonly expected = bundledMigrations(), private readonly ttlMs = 30_000) {}

  async state(now = Date.now()): Promise<SchemaState> {
    if (process.env.SCHEMA_GUARD === 'off') return { state: 'unchecked' };
    if (!this.expected.length) return { state: 'unavailable' };
    if (this.cached && now - this.cached.at < this.ttlMs) return this.cached.value;
    let value: SchemaState;
    try {
      const rows = await this.db.$queryRaw<{ migration_name: string }[]>`SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL`;
      const applied = new Set(rows.map(row => row.migration_name));
      const missing = this.expected.filter(name => !applied.has(name));
      value = missing.length ? { state: 'behind', pending: missing.length } : { state: 'current' };
      const report = missing.join(',');
      if (report !== this.reported) {
        this.reported = report;
        if (missing.length) this.log.error(`Database is missing ${missing.length} migration(s) this build needs: ${report}. Apply them (runbook section A) before this version can serve.`);
        else this.log.log('Database schema matches this build');
      }
    } catch (error) {
      value = { state: 'unavailable' };
      this.log.warn(`Schema check unavailable (${(error as Error)?.name ?? 'error'})`);
    }
    this.cached = { at: now, value };
    return value;
  }
}
