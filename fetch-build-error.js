const { execSync } = require('child_process');
const fs = require('fs');
try {
  execSync('npm run build', { stdio: 'pipe' });
  fs.writeFileSync('build_out.txt', 'SUCCESS');
} catch(e) {
  let err = e.stderr ? e.stderr.toString() : e.message;
  let out = e.stdout ? e.stdout.toString() : '';
  fs.writeFileSync('build_out.txt', "STDERR:\n" + err + "\nSTDOUT:\n" + out);
}
