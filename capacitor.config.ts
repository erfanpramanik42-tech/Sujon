import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fieldpro.assistant',
  appName: 'FieldPro Assistant',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
