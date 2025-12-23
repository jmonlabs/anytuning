<script>
  import { GuitarChordFinder, TUNINGS, CHROMATIC } from './lib/chordFinder.js';

  let selectedTuning = 'standard';
  let customTuning = '';
  let useCustomTuning = false;
  let selectedRoot = 'C';
  let selectedChordType = 'major';
  let results = [];
  let isProcessing = false;
  let progressInfo = '';
  let maxFret = 12;

  const chordTypes = [
    { value: 'major', label: 'Major' },
    { value: 'minor', label: 'Minor' },
    { value: 'dom7', label: 'Dominant 7th' },
    { value: 'maj7', label: 'Major 7th' },
    { value: 'min7', label: 'Minor 7th' },
    { value: 'sus2', label: 'Suspended 2nd' },
    { value: 'sus4', label: 'Suspended 4th' },
    { value: 'dim', label: 'Diminished' },
    { value: 'aug', label: 'Augmented' }
  ];

  function getTuningArray() {
    if (useCustomTuning && customTuning) {
      return customTuning.split('-').map(s => s.trim());
    }
    return TUNINGS[selectedTuning];
  }

  function getChordName() {
    const typeMap = {
      'major': '',
      'minor': 'm',
      'dom7': '7',
      'maj7': 'maj7',
      'min7': 'm7',
      'sus2': 'sus2',
      'sus4': 'sus4',
      'dim': 'dim',
      'aug': 'aug'
    };
    return selectedRoot + typeMap[selectedChordType];
  }

  async function findChords() {
    isProcessing = true;
    progressInfo = 'Starting genetic algorithm...';
    results = [];

    try {
      const tuning = getTuningArray();
      const finder = new GuitarChordFinder(tuning);
      const chordName = getChordName();

      const solutions = finder.findChord(
        chordName,
        selectedRoot,
        selectedChordType,
        (progress) => {
          if (progress.earlyStopping) {
            progressInfo = `Early stopping at generation ${progress.generation}. Best fitness: ${progress.bestFitness.toFixed(2)}`;
          } else {
            progressInfo = `Generation ${progress.generation}: Best fitness = ${progress.bestFitness.toFixed(2)}`;
          }
        },
        maxFret
      );

      results = solutions.map(voicing => {
        const notes = finder.getPlayedNotes(voicing.frets);
        const activeFrets = voicing.frets.filter(f => f !== 'x' && f !== 0);
        const uniqueFrets = new Set(activeFrets);
        return {
          frets: voicing.frets,
          fitness: voicing.fitness,
          notes: notes,
          numFingers: uniqueFrets.size
        };
      });

      progressInfo = `Found ${results.length} solutions`;
    } catch (error) {
      progressInfo = `Error: ${error.message}`;
    } finally {
      isProcessing = false;
    }
  }

  function formatFrets(frets) {
    return frets.map(f => f === 'x' ? 'x' : String(f)).join('-');
  }

  function formatNotes(notes) {
    return notes.join('-');
  }
</script>

<main>
  <h1>AnyTuning - Guitar Chord Finder</h1>
  <p class="subtitle">Find guitar chord variations using genetic algorithms for any tuning</p>

  <div class="container">
    <div class="input-section">
      <h2>Configuration</h2>

      <div class="form-group">
        <label>
          <input type="checkbox" bind:checked={useCustomTuning} />
          Use Custom Tuning
        </label>
      </div>

      {#if useCustomTuning}
        <div class="form-group">
          <label for="customTuning">Custom Tuning (e.g., E-A-D-G-B-E)</label>
          <input
            id="customTuning"
            type="text"
            bind:value={customTuning}
            placeholder="E-A-D-G-B-E"
          />
          <small>Enter notes from low to high string, separated by dashes</small>
        </div>
      {:else}
        <div class="form-group">
          <label for="tuning">Tuning</label>
          <select id="tuning" bind:value={selectedTuning}>
            <option value="standard">Standard (E-A-D-G-B-E)</option>
            <option value="drop_d">Drop D (D-A-D-G-B-E)</option>
            <option value="dadgad">DADGAD</option>
            <option value="open_g">Open G</option>
            <option value="open_d">Open D</option>
            <option value="nst">NST (C-G-D-A-E-G)</option>
            <option value="nst_minus_1">NST-1 (Bb-F-C-G-D-F)</option>
            <option value="nst_minus_2">NST-2 (A-E-B-Gb-Db-E)</option>
          </select>
        </div>
      {/if}

      <div class="form-group">
        <label for="root">Root Note</label>
        <select id="root" bind:value={selectedRoot}>
          {#each CHROMATIC as note}
            <option value={note}>{note}</option>
          {/each}
        </select>
      </div>

      <div class="form-group">
        <label for="chordType">Chord Type</label>
        <select id="chordType" bind:value={selectedChordType}>
          {#each chordTypes as type}
            <option value={type.value}>{type.label}</option>
          {/each}
        </select>
      </div>

      <div class="form-group">
        <label for="maxFret">Max Fret: {maxFret}</label>
        <input
          id="maxFret"
          type="range"
          min="5"
          max="24"
          bind:value={maxFret}
        />
      </div>

      <button on:click={findChords} disabled={isProcessing}>
        {isProcessing ? 'Processing...' : 'Find Chords'}
      </button>

      {#if progressInfo}
        <div class="progress-info">{progressInfo}</div>
      {/if}
    </div>

    <div class="results-section">
      <h2>Results for {getChordName()}</h2>

      {#if results.length === 0 && !isProcessing}
        <p class="no-results">Click "Find Chords" to generate chord variations</p>
      {:else if results.length > 0}
        <div class="results-grid">
          {#each results as result, i}
            <div class="chord-card">
              <div class="chord-number">#{i + 1}</div>
              <div class="chord-diagram">
                <div class="frets">{formatFrets(result.frets)}</div>
                <div class="notes">{formatNotes(result.notes)}</div>
              </div>
              <div class="chord-info">
                <span>Fitness: {result.fitness.toFixed(1)}</span>
                <span>{result.numFingers} finger{result.numFingers !== 1 ? 's' : ''}</span>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>
</main>

<style>
  main {
    text-align: center;
    padding: 1em;
    max-width: 100%;
    margin: 0 auto;
  }

  h1 {
    color: #ff3e00;
    font-size: 2.5em;
    font-weight: 700;
    margin-bottom: 0.5em;
  }

  .subtitle {
    color: #888;
    margin-bottom: 2em;
  }

  .container {
    display: grid;
    grid-template-columns: 1fr 2fr;
    gap: 2em;
    text-align: left;
  }

  .input-section,
  .results-section {
    background: rgba(255, 255, 255, 0.05);
    padding: 1.5em;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  h2 {
    margin-top: 0;
    color: #ff3e00;
  }

  .form-group {
    margin-bottom: 1.5em;
  }

  .form-group label {
    display: block;
    margin-bottom: 0.5em;
    font-weight: 500;
  }

  .form-group input[type="text"],
  .form-group select {
    width: 100%;
    box-sizing: border-box;
  }

  .form-group input[type="range"] {
    width: 100%;
  }

  .form-group small {
    display: block;
    margin-top: 0.25em;
    color: #888;
    font-size: 0.875em;
  }

  button {
    width: 100%;
    padding: 1em;
    font-size: 1.1em;
    background-color: #ff3e00;
    color: white;
    border: none;
  }

  button:hover:not(:disabled) {
    background-color: #ff5722;
    border-color: #ff5722;
  }

  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .progress-info {
    margin-top: 1em;
    padding: 0.75em;
    background: rgba(255, 62, 0, 0.1);
    border-radius: 4px;
    border: 1px solid rgba(255, 62, 0, 0.3);
    font-size: 0.9em;
  }

  .no-results {
    color: #888;
    font-style: italic;
    text-align: center;
    padding: 2em;
  }

  .results-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 1em;
  }

  .chord-card {
    background: rgba(255, 255, 255, 0.03);
    padding: 1em;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.15);
    transition: transform 0.2s, border-color 0.2s;
  }

  .chord-card:hover {
    transform: translateY(-2px);
    border-color: #ff3e00;
  }

  .chord-number {
    font-weight: 700;
    color: #ff3e00;
    margin-bottom: 0.5em;
  }

  .chord-diagram {
    margin-bottom: 1em;
  }

  .frets {
    font-family: 'Courier New', monospace;
    font-size: 1.2em;
    font-weight: 700;
    padding: 0.5em;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 4px;
    margin-bottom: 0.5em;
    text-align: center;
  }

  .notes {
    font-size: 0.9em;
    color: #aaa;
    text-align: center;
  }

  .chord-info {
    display: flex;
    justify-content: space-between;
    font-size: 0.85em;
    color: #888;
    padding-top: 0.5em;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }

  @media (max-width: 768px) {
    .container {
      grid-template-columns: 1fr;
    }

    h1 {
      font-size: 2em;
    }

    .results-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (prefers-color-scheme: light) {
    .input-section,
    .results-section {
      background: rgba(0, 0, 0, 0.02);
      border: 1px solid rgba(0, 0, 0, 0.1);
    }

    .chord-card {
      background: rgba(0, 0, 0, 0.02);
      border: 1px solid rgba(0, 0, 0, 0.15);
    }

    .frets {
      background: rgba(0, 0, 0, 0.05);
    }

    .chord-info {
      border-top: 1px solid rgba(0, 0, 0, 0.1);
    }
  }
</style>
