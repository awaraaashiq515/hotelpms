import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['serialport', 'socket.io', '@serialport/bindings-cpp'],
};

export default nextConfig;
