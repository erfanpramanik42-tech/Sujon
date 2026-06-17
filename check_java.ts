import { existsSync, readdirSync } from 'fs';

const paths = [
  '/usr/lib/jvm',
  '/usr/lib/openjdk',
  '/usr/java',
  '/opt/java',
  '/opt/jdk',
  '/usr/local/java',
  '/usr/local/jdk'
];

paths.forEach(p => {
  if (existsSync(p)) {
    console.log(`Found: ${p}`);
    try {
      console.log(`Contents of ${p}:`, readdirSync(p));
    } catch (e) {
      console.log(`Could not read ${p}`);
    }
  } else {
    console.log(`Not found: ${p}`);
  }
});

try {
    const { execSync } = require('child_process');
    console.log('java -version:', execSync('java -version 2>&1').toString());
} catch (e) {
    console.log('java -version failed');
}
