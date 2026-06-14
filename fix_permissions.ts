import { chmodSync } from 'fs';
import { join } from 'path';

try {
  const gradlewPath = join(process.cwd(), 'android', 'gradlew');
  chmodSync(gradlewPath, 0o755);
  console.log('Successfully made gradlew executable');
} catch (error) {
  console.error('Failed to change permissions:', error);
  process.exit(1);
}
