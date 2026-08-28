import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ["lucide-react", "date-fns", "recharts", "clsx"],
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  outputFileTracingIncludes: {
    "/api/**/*": ["./node_modules/pdfkit/**/*", "./node_modules/@react-pdf/**/*"],
    "/api/reports/pdf": ["./node_modules/pdfkit/**/*", "./node_modules/@react-pdf/**/*"],
  },
  serverExternalPackages: [
    "@prisma/client",
    "bcryptjs",
    "@react-pdf/renderer",
    "pdfkit",
  ],
};

export default nextConfig;
