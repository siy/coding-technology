import { readFileSync } from 'node:fs';
import { derive, deriveRecovery } from './derive.js';
import { checkSheet, parseToml } from './engine.js';
const f = process.argv[2];
const p = parseToml(readFileSync(f,'utf-8'));
if (p.errors.length) { console.log('TOML ERRORS:', p.errors); process.exit(1); }
const sheet = p.sheet;
const gate = checkSheet(readFileSync(f,"utf-8"));
console.log('=== ENTRY GATE ===');
console.log(JSON.stringify(gate, null, 1).slice(0, 1200));
console.log('\n=== DERIVE ===');
const d = derive(sheet);
console.log(JSON.stringify(d, null, 1).slice(0, 3000));
console.log('\n=== RECOVERY ===');
console.log(JSON.stringify(deriveRecovery(sheet), null, 1).slice(0, 1200));
