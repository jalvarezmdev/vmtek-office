import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { db } from './index';
import { users } from './schema';

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error(
      'ADMIN_EMAIL and ADMIN_PASSWORD env vars are required to seed the admin user.',
    );
  }

  const name = process.env.ADMIN_NAME;
  const passwordHash = await bcrypt.hash(password, 10);

  await db
    .insert(users)
    .values({
      name: name ?? 'Admin',
      email,
      emailVerified: new Date(),
      passwordHash,
      role: 'admin',
    })
    .onConflictDoUpdate({
      target: users.email,
      set: {
        name: name ?? undefined,
        passwordHash,
        role: 'admin',
        emailVerified: new Date(),
      },
    });

  console.log(`Admin user ensured: ${email}`);
}

main()
  .then(() => {
    process.exitCode = 0;
  })
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  });
