'use server';

import { AuthError, CredentialsSignin } from 'next-auth';

import { signIn } from '@/auth';
import { loginSchema } from '@/lib/auth-schemas';

export type LoginState = { error?: string } | null;

export async function loginAction(
  prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    return { error: 'Please check your email and password.' };
  }

  const rawCallbackUrl = formData.get('callbackUrl');
  const callbackUrl =
    typeof rawCallbackUrl === 'string' &&
    rawCallbackUrl.startsWith('/') &&
    !rawCallbackUrl.startsWith('//')
      ? rawCallbackUrl
      : '/';

  try {
    await signIn('credentials', {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: callbackUrl,
    });
  } catch (error) {
    if (error instanceof CredentialsSignin) {
      return { error: 'Invalid email or password.' };
    }
    if (error instanceof AuthError) {
      console.error('Login failed with a non-credential AuthError:', error);
    }
    throw error;
  }

  // signIn redirects on success (NEXT_REDIRECT thrown); unreachable at runtime, needed for types
  return null;
}
