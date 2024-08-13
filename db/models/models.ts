import { z } from "zod";

export const AuthnSession = z.object({
  userId: z.string().optional(),
});

export type AuthnSession = z.infer<typeof AuthnSession>;

export const ClientSession = z.object({
  redirectTo: z.string().optional(),
  code_verifier: z.string().optional(),
  accountId: z.string().optional(),
  isAdmin: z.boolean().optional(),
});

export type ClientSession = z.infer<typeof ClientSession>;

export const User = z.object({
  username: z.string().min(1).readonly(),
  email: z.string().email().readonly(),

  // Credentials
  password: z.string(),
});

export type User = z.infer<typeof User>;
