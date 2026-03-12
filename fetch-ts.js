const { execSync } = require('child_process');
const fs = require('fs');
try {
  execSync('npx tsc --noEmit');
  fs.writeFileSync('tsc_out.txt', 'SUCCESS');
} catch(e) {
  fs.writeFileSync('tsc_out.txt', e.stdout ? e.stdout.toString() : e.message);
}
