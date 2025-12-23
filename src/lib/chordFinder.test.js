import { GuitarChordFinder, TUNINGS } from './chordFinder.js';

function testPlayability() {
  const finder = new GuitarChordFinder(TUNINGS.standard);

  const tests = [
    {
      name: 'Open strings only',
      frets: [0, 0, 0, 0, 0, 0],
      shouldPass: true
    },
    {
      name: 'C major (x-3-2-0-1-0)',
      frets: ['x', 3, 2, 0, 1, 0],
      shouldPass: true
    },
    {
      name: 'G major (3-2-0-0-0-3)',
      frets: [3, 2, 0, 0, 0, 3],
      shouldPass: true
    },
    {
      name: 'D minor (x-x-0-2-3-1)',
      frets: ['x', 'x', 0, 2, 3, 1],
      shouldPass: true
    },
    {
      name: 'A minor (x-0-2-2-1-0)',
      frets: ['x', 0, 2, 2, 1, 0],
      shouldPass: true
    },
    {
      name: 'F major barre (1-3-3-2-1-1)',
      frets: [1, 3, 3, 2, 1, 1],
      shouldPass: true
    },
    {
      name: 'E major (0-2-2-1-0-0)',
      frets: [0, 2, 2, 1, 0, 0],
      shouldPass: true
    },
    {
      name: 'Span 3 across 4 strings (fails adaptive span)',
      frets: [1, 2, 3, 4, 'x', 'x'],
      shouldPass: false
    },
    {
      name: 'Strings separated by 1 with span 2',
      frets: [1, 'x', 3, 'x', 'x', 'x'],
      shouldPass: true
    },
    {
      name: 'Impossible stretch - span 4 across distant strings',
      frets: [6, 'x', 0, 0, 2, 2],
      shouldPass: false
    },
    {
      name: 'Impossible barre with gap',
      frets: [1, 'x', 1, 1, 'x', 'x'],
      shouldPass: false
    },
    {
      name: 'Too many fingers',
      frets: [1, 2, 3, 4, 5, 6],
      shouldPass: false
    },
    {
      name: 'Span too large (5 frets)',
      frets: [1, 'x', 'x', 'x', 6, 'x'],
      shouldPass: false
    },
    {
      name: 'Barre with excessive stretch',
      frets: [1, 1, 1, 'x', 5, 'x'],
      shouldPass: false
    },
    {
      name: 'Diagonal stretch too large',
      frets: [1, 'x', 'x', 'x', 'x', 6],
      shouldPass: false
    },
    {
      name: 'Strings separated by 2 with span 2 (OK)',
      frets: [1, 'x', 'x', 3, 'x', 'x'],
      shouldPass: true
    },
    {
      name: 'Strings separated by 2 with span 3 (fail)',
      frets: [1, 'x', 'x', 4, 'x', 'x'],
      shouldPass: false
    },
    {
      name: 'Strings separated by 3 with span 2 (OK)',
      frets: [1, 'x', 'x', 'x', 3, 'x'],
      shouldPass: true
    },
    {
      name: 'Strings separated by 3 with span 3 (fail)',
      frets: [1, 'x', 'x', 'x', 4, 'x'],
      shouldPass: false
    }
  ];

  console.log('\n=== PLAYABILITY TESTS ===\n');

  let passed = 0;
  let failed = 0;

  tests.forEach(test => {
    const result = finder.isPhysicallyPlayable(test.frets);
    const actualPass = result.playable;
    const testPassed = actualPass === test.shouldPass;

    if (testPassed) {
      passed++;
      console.log(`✓ PASS: ${test.name}`);
      console.log(`  Frets: ${test.frets.join('-')}`);
    } else {
      failed++;
      console.log(`✗ FAIL: ${test.name}`);
      console.log(`  Frets: ${test.frets.join('-')}`);
      console.log(`  Expected: ${test.shouldPass ? 'playable' : 'unplayable'}`);
      console.log(`  Got: ${actualPass ? 'playable' : 'unplayable'} (${result.reason})`);
    }
    console.log();
  });

  console.log(`\n=== SUMMARY ===`);
  console.log(`Passed: ${passed}/${tests.length}`);
  console.log(`Failed: ${failed}/${tests.length}`);
  console.log(`Success rate: ${(passed / tests.length * 100).toFixed(1)}%\n`);

  return { passed, failed, total: tests.length };
}

if (typeof process !== 'undefined' && process.argv[1] === new URL(import.meta.url).pathname) {
  testPlayability();
}

export { testPlayability };
