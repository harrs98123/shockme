import { createAvatar } from '@dicebear/core';
import { lorelei, bottts, avataaars, personas } from '@dicebear/collection';

console.log('--- RUNNING DICEBEAR AVATAR VERIFICATION TESTS ---');

// Test 1: Determinism
const seedA1 = 'user_99';
const seedA2 = 'user_99';
const seedB = 'user_100';

const avatarA1 = createAvatar(lorelei, { seed: seedA1 }).toDataUri();
const avatarA2 = createAvatar(lorelei, { seed: seedA2 }).toDataUri();
const avatarB = createAvatar(lorelei, { seed: seedB }).toDataUri();

if (avatarA1 === avatarA2) {
  console.log('✓ PASS: Same seed produces identical avatar data URI.');
} else {
  console.error('✗ FAIL: Same seed produced different avatars.');
  process.exit(1);
}

if (avatarA1 !== avatarB) {
  console.log('✓ PASS: Different seeds produce distinct avatars.');
} else {
  console.error('✗ FAIL: Different seeds produced identical avatars.');
  process.exit(1);
}

// Test 2: Multi-style generation
const styles = { lorelei, bottts, avataaars, personas };
for (const [name, style] of Object.entries(styles)) {
  const result = createAvatar(style, { seed: 'cinephile_test', size: 64 });
  const dataUri = result.toDataUri();
  const svg = result.toString();
  if (dataUri.startsWith('data:image/svg+xml') && svg.includes('<svg')) {
    console.log(`✓ PASS: Style "${name}" generated valid SVG (${svg.length} bytes).`);
  } else {
    console.error(`✗ FAIL: Style "${name}" failed to generate valid SVG.`);
    process.exit(1);
  }
}

console.log('==============================================');
console.log('ALL DICEBEAR AVATAR TESTS PASSED SUCCESSFULLY!');
console.log('==============================================');
