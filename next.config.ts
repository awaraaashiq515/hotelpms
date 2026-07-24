import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['serialport', 'socket.io', '@serialport/bindings-cpp'],
};

export default nextConfig;
// Force Next.js server reload to refresh cached global state and Prisma models
