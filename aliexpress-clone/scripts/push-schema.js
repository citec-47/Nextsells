const { execSync } = require('child_process');

try {
  console.log('🚀 Pushing schema to Neon PostgreSQL...');
  execSync('npx prisma db push --skip-generate --force-reset', {
    cwd: process.cwd(),
    stdio: 'inherit',
    env: {
      ...process.env,
      DATABASE_URL: 'postgresql://neondb_owner:npg_E8mqdkoxQ9un@ep-purple-sky-aj9q78wd-pooler.c-3.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
    },
  });
  console.log('✅ Schema pushed successfully!');
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
