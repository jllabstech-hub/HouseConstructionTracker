import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ["lucide-react", "date-fns", "recharts", "clsx"],
    serverActions: {
      bodySizeLimit: "20mb",
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
  async redirects() {
    return [
      {
        source: "/settings",
        destination: "/dashboard",
        permanent: true,
      },
      {
        source: "/leads",
        destination: "/dashboard",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
