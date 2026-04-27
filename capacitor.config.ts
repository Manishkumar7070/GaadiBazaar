import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.asonedealer.app',
  appName: 'One Dealer',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
