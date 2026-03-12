const { execSync } = require('child_process');
const fs = require('fs');
try {
  execSync('npx prisma validate');
  fs.writeFileSync('out.txt', 'SUCCESS');
} catch(e) {
  fs.writeFileSync('out.txt', e.stderr ? e.stderr.toString() : e.message);
}
