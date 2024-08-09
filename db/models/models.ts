import { z } from "zod";

export const AuthnSession = z.object({
  userId: z.string().optional(),
});

export type AuthnSession = z.infer<typeof AuthnSession>;

export const User = z.object({
  username: z.string().min(1).readonly(),
  email: z.string().email().readonly(),

  // Credentials
  password: z.string(),
});

export type User = z.infer<typeof User>;
