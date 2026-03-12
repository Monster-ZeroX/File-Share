const { execSync } = require('child_process');
try {
  const out = execSync('npx prisma validate', { stdio: 'pipe' });
  console.log("STDOUT:", out.toString());
} catch(e) {
  console.log("ERROR STDOUT:", e.stdout ? e.stdout.toString() : '');
  console.log("ERROR STDERR:", e.stderr ? e.stderr.toString() : '');
  console.log("MESSAGE:", e.message);
}
