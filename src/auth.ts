import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations";
import { authConfig } from "@/auth.config";
import { seedUserMasters } from "@/lib/catalog/seed-masters";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "User ID or Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const input = parsed.data.email.trim();
        const lower = input.toLowerCase();

        let user = null;
        try {
          user = await prisma.user.findFirst({
            where: {
              OR: [
                { email: lower },
                { email: input },
                ...(lower === "admin"
                  ? [
                      { email: "admin" },
                      { email: "admin@housetracker.app" },
                      { email: "demo@housetracker.app" },
                    ]
                  : []),
              ],
            },
          });
        } catch (dbError) {
          console.error("Database lookup error in authorize:", dbError);
          throw new Error("DATABASE_CONNECTION_ERROR");
        }

        // Auto-provision default admin if database was freshly initialized
        if (
          !user &&
          (lower === "admin" || lower === "admin@housetracker.app") &&
          parsed.data.password === "test123"
        ) {
          try {
            const passwordHash = await bcrypt.hash("test123", 10);
            user = await prisma.user.upsert({
              where: { email: "admin" },
              update: {},
              create: {
                name: "Admin",
                email: "admin",
                passwordHash,
              },
            });
            await seedUserMasters(user.id);
          } catch (seedErr) {
            console.error("Auto-seed admin error:", seedErr);
          }
        }

        if (!user?.passwordHash) return null;

        const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
        };
      },
    }),
  ],
});
