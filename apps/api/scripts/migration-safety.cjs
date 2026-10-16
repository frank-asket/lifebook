console.error('Automatic development migrations are disabled for LifeBook. Review migration SQL, verify a recoverable backup, rehearse on an isolated copy, and obtain approval before any production database change. Use explicit Prisma commands only after checking the target.');
process.exitCode = 1;
