import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
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

  const name = process.env.ADMIN_NAME ?? 'Admin';
  const passwordHash = await bcrypt.hash(password, 10);

  const existing = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (existing) {
    await db
      .update(users)
      .set({
        name,
        passwordHash,
        role: 'admin',
        emailVerified: new Date(),
      })
      .where(eq(users.email, email));
    console.log(`Admin user updated: ${email}`);
  } else {
    await db.insert(users).values({
      name,
      email,
      emailVerified: new Date(),
      passwordHash,
      role: 'admin',
    });
    console.log(`Admin user created: ${email}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  });
