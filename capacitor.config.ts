import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ordermint.pos',
  appName: 'OrderMint',
  webDir: 'public',
  server: {
    androidScheme: 'https',
    cleartext: true, // Allows testing on local network HTTP
    // url: "https://your-live-website.com" // We will set this when ready
  }
};

export default config;
