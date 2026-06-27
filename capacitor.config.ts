import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ordermint.pos',
  appName: 'OrderMint',
  webDir: 'public',
  server: {
    androidScheme: 'https',
    cleartext: true, // Allows testing on local network HTTP
    url: "https://ordermint.in",
    allowNavigation: ["ordermint.in", "*.ordermint.in"]
  }
};

export default config;
