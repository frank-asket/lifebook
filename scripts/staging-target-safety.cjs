// Offline staging target validation. Never log credentials or full connection strings.
function projectRef(raw) {
  if (!raw) throw new Error('Missing database URL');
  let url;
  try { url = new URL(raw); } catch { throw new Error('Invalid database URL'); }
  if (!['postgres:', 'postgresql:'].includes(url.protocol)) throw new Error('Database URL must be PostgreSQL');
  const direct = url.hostname.match(/^db\.([a-z0-9]+)\.supabase\.co$/);
  const pooled = decodeURIComponent(url.username).match(/^postgres\.([a-z0-9]+)$/);
  if (!direct && !pooled) throw new Error('Staging database must use an identifiable Supabase project');
  if (!url.hostname.endsWith('.supabase.co') && !url.hostname.endsWith('.pooler.supabase.com')) throw new Error('Unrecognized Supabase database host');
  return direct?.[1] || pooled?.[1];
}
function assertStagingDatabases(staging, productionDirectUrl) {
  const production = projectRef(productionDirectUrl);
  const pooledRef = projectRef(staging.DATABASE_URL);
  const directRef = projectRef(staging.DIRECT_URL);
  if (pooledRef !== directRef) throw new Error('Staging pooled and direct URLs point to different Supabase projects');
  if (pooledRef === production) throw new Error('Staging database matches production project');
  return { stagingRef: pooledRef, productionRef: production };
}
module.exports = { projectRef, assertStagingDatabases };
