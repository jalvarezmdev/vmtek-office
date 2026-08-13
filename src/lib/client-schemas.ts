import { z } from 'zod';

export const clientSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  company: z.string().trim().optional().or(z.literal('')),
  email: z
    .string()
    .trim()
    .email('Enter a valid email')
    .optional()
    .or(z.literal('')),
  phone: z.string().trim().optional().or(z.literal('')),
  address: z.string().trim().optional().or(z.literal('')),
});

export type ClientInput = z.infer<typeof clientSchema>;
