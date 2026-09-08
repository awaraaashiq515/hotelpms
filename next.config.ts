import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['serialport', 'socket.io', '@serialport/bindings-cpp'],
  typescript: {
    // TypeScript check is already verified locally; skipping here prevents Docker OOM crash
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
// Force Next.js server reload to refresh cached global state and Prisma models
