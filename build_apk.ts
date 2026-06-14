import { execSync } from 'child_process';
import { existsSync, mkdirSync, copyFileSync, statSync } from 'fs';
import { join } from 'path';

try {
  console.log('Starting Android Build...');
  
  // 1. Ensure project is synced
  console.log('Syncing Capacitor...');
  execSync('npx cap sync android', { stdio: 'inherit' });

  // 2. Build APK using gradlew
  console.log('Running Gradle assembleDebug...');
  // Note: We use process.cwd() to get the workspace root
  const androidDir = join(process.cwd(), 'android');
  execSync('./gradlew assembleDebug', { 
    cwd: androidDir,
    stdio: 'inherit',
    env: { ...process.env, JAVA_OPTS: '-Xmx2g' } 
  });

  // 3. Locate the APK
  const apkPath = join(androidDir, 'app/build/outputs/apk/debug/app-debug.apk');
  if (!existsSync(apkPath)) {
    throw new Error('APK not found at ' + apkPath);
  }

  // 4. Create output directories
  const buildOutputsDir = join(process.cwd(), '.build-outputs');
  const apkDownloadDir = join(process.cwd(), 'APK_DOWNLOAD');
  
  if (!existsSync(buildOutputsDir)) mkdirSync(buildOutputsDir, { recursive: true });
  if (!existsSync(apkDownloadDir)) mkdirSync(apkDownloadDir, { recursive: true });

  // 5. Copy APK to requested locations
  const target1 = join(buildOutputsDir, 'app-debug.apk');
  const target2 = join(apkDownloadDir, 'app-debug.apk');
  
  copyFileSync(apkPath, target1);
  copyFileSync(apkPath, target2);
  
  console.log('Success! APK copied to:');
  console.log(' - ' + target1);
  console.log(' - ' + target2);

  // 6. Verify file size
  const stats = statSync(target2);
  console.log('APK Size: ' + (stats.size / 1024 / 1024).toFixed(2) + ' MB');
  if (stats.size < 1024 * 1024) {
    console.warn('Warning: APK size is less than 1MB. Something might be wrong.');
  }

} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}
