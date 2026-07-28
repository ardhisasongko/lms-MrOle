import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

const dirs = [
  join(import.meta.dirname, '..', 'src', 'pages'),
  join(import.meta.dirname, '..', 'src', 'hooks'),
];

const re = /supabase\.(from|rpc|auth)\s*\(/;
let failed = false;

for (const dir of dirs) {
  const walk = (p) => {
    for (const entry of readdirSync(p)) {
      const fp = join(p, entry);
      if (statSync(fp).isDirectory()) {
        walk(fp);
      } else if (fp.endsWith('.js') || fp.endsWith('.jsx')) {
        const content = readFileSync(fp, 'utf-8');
        const m = content.match(re);
        if (m) {
          const rel = join('src', 'pages', fp.split(join('src', 'pages'))[1]) ||
                      join('src', 'hooks', fp.split(join('src', 'hooks'))[1]);
          console.error(`❌ ${rel}: langsung panggil ${m[0]}`);
          failed = true;
        }
      }
    }
  };
  walk(dir);
}

if (failed) {
  console.error('\nGunakan services layer — jangan akses supabase langsung dari pages/hooks.');
  process.exit(1);
} else {
  console.log('✓ Service seam: tidak ada supabase langsung di pages/hooks.');
}
