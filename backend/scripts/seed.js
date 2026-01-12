const { connectToDb } = require('../src/db');
const { env } = require('../src/config/env');
const { seedDatabase } = require('../src/seed/seedData');

async function seed() {
  await connectToDb(env.mongoUri);

  const result = await seedDatabase({ force: true });
  console.log('[SEED] done:', result);
  process.exit(0);
}

seed().catch((err) => {
  console.error('[SEED] failed:', err);
  process.exit(1);
});
