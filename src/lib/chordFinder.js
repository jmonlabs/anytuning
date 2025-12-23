// Chromatic notes
export const CHROMATIC = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

// Genetic algorithm parameters
export const POPULATION_SIZE = 200;
export const GENERATIONS = 100;
export const MUTATION_RATE = 0.3;
export const CROSSOVER_RATE = 0.7;
export const ELITE_SIZE = 10;

// Predefined tunings (from low to high string)
export const TUNINGS = {
  standard: ['E', 'A', 'D', 'G', 'B', 'E'],
  drop_d: ['D', 'A', 'D', 'G', 'B', 'E'],
  dadgad: ['D', 'A', 'D', 'G', 'A', 'D'],
  open_g: ['D', 'G', 'D', 'G', 'B', 'D'],
  open_d: ['D', 'A', 'D', 'Gb', 'A', 'D'],
  nst: ['C', 'G', 'D', 'A', 'E', 'G'],
  nst_minus_1: ['Bb', 'F', 'C', 'G', 'D', 'F'],
  nst_minus_2: ['A', 'E', 'B', 'Gb', 'Db', 'E'],
};

export class ChordVoicing {
  constructor(frets) {
    this.frets = [...frets];
    this.fitness = 0.0;
  }

  toString() {
    const fretStr = this.frets.map(f => f === 'x' ? 'x' : String(f)).join('-');
    return `Voicing(${fretStr}, fitness=${this.fitness.toFixed(2)})`;
  }

  copy() {
    return new ChordVoicing([...this.frets]);
  }
}

export class GuitarChordFinder {
  constructor(tuning, numStrings = null) {
    this.tuning = tuning;
    this.numStrings = numStrings || tuning.length;

    if (tuning.length !== this.numStrings) {
      throw new Error(`Tuning must have ${this.numStrings} notes`);
    }
  }

  noteAtFret(stringIdx, fret) {
    const openNote = this.tuning[stringIdx];
    const openIdx = CHROMATIC.indexOf(openNote);
    const noteIdx = (openIdx + fret) % 12;
    return CHROMATIC[noteIdx];
  }

  getChordNotes(root, chordType = 'major') {
    const rootIdx = CHROMATIC.indexOf(root);

    switch (chordType) {
      case 'major': {
        const third = CHROMATIC[(rootIdx + 4) % 12];
        const fifth = CHROMATIC[(rootIdx + 7) % 12];
        return new Set([root, third, fifth]);
      }

      case 'minor': {
        const third = CHROMATIC[(rootIdx + 3) % 12];
        const fifth = CHROMATIC[(rootIdx + 7) % 12];
        return new Set([root, third, fifth]);
      }

      case 'dom7': {
        const third = CHROMATIC[(rootIdx + 4) % 12];
        const fifth = CHROMATIC[(rootIdx + 7) % 12];
        const seventh = CHROMATIC[(rootIdx + 10) % 12];
        return new Set([root, third, fifth, seventh]);
      }

      case 'maj7': {
        const third = CHROMATIC[(rootIdx + 4) % 12];
        const fifth = CHROMATIC[(rootIdx + 7) % 12];
        const seventh = CHROMATIC[(rootIdx + 11) % 12];
        return new Set([root, third, fifth, seventh]);
      }

      case 'min7': {
        const third = CHROMATIC[(rootIdx + 3) % 12];
        const fifth = CHROMATIC[(rootIdx + 7) % 12];
        const seventh = CHROMATIC[(rootIdx + 10) % 12];
        return new Set([root, third, fifth, seventh]);
      }

      case 'sus2': {
        const second = CHROMATIC[(rootIdx + 2) % 12];
        const fifth = CHROMATIC[(rootIdx + 7) % 12];
        return new Set([root, second, fifth]);
      }

      case 'sus4': {
        const fourth = CHROMATIC[(rootIdx + 5) % 12];
        const fifth = CHROMATIC[(rootIdx + 7) % 12];
        return new Set([root, fourth, fifth]);
      }

      case 'dim': {
        const third = CHROMATIC[(rootIdx + 3) % 12];
        const fifth = CHROMATIC[(rootIdx + 6) % 12];
        return new Set([root, third, fifth]);
      }

      case 'aug': {
        const third = CHROMATIC[(rootIdx + 4) % 12];
        const fifth = CHROMATIC[(rootIdx + 8) % 12];
        return new Set([root, third, fifth]);
      }

      default:
        throw new Error(`Unknown chord type: ${chordType}`);
    }
  }

  getPlayedNotes(frets) {
    const notes = [];
    for (let i = 0; i < frets.length; i++) {
      if (frets[i] !== 'x' && i < this.tuning.length) {
        const note = this.noteAtFret(i, parseInt(frets[i]));
        notes.push(note);
      }
    }
    return notes;
  }

  isPhysicallyPlayable(frets) {
    const activeFrets = [];
    for (let i = 0; i < frets.length; i++) {
      if (frets[i] !== 'x' && frets[i] !== 0 && i < this.numStrings) {
        activeFrets.push({ stringIdx: i, fret: frets[i] });
      }
    }

    if (activeFrets.length === 0) {
      return { playable: true, reason: 'OK' };
    }

    const fretToStrings = {};
    for (const { stringIdx, fret } of activeFrets) {
      if (!fretToStrings[fret]) {
        fretToStrings[fret] = [];
      }
      fretToStrings[fret].push(stringIdx);
    }

    for (const [fret, strings] of Object.entries(fretToStrings)) {
      if (strings.length > 1) {
        const stringsSorted = [...strings].sort((a, b) => a - b);
        for (let i = 0; i < stringsSorted.length - 1; i++) {
          if (stringsSorted[i + 1] - stringsSorted[i] > 1) {
            return { playable: false, reason: `Impossible barre on fret ${fret}` };
          }
        }
      }
    }

    const uniqueFrets = new Set(activeFrets.map(af => af.fret));
    if (uniqueFrets.size > 4) {
      return { playable: false, reason: `Too many fingers: ${uniqueFrets.size}` };
    }

    const fretValues = activeFrets.map(af => af.fret);
    const span = Math.max(...fretValues) - Math.min(...fretValues);
    if (span > 4) {
      return { playable: false, reason: `Span too large: ${span}` };
    }

    return { playable: true, reason: 'OK' };
  }

  calculateFitness(voicing, root, chordType = 'major') {
    let fitness = 0.0;

    const { playable, reason } = this.isPhysicallyPlayable(voicing.frets);
    if (!playable) {
      return -1000.0;
    }

    const playedNotes = this.getPlayedNotes(voicing.frets);
    if (playedNotes.length < 2) {
      return -500.0;
    }

    const targetNotes = this.getChordNotes(root, chordType);
    const playedSet = new Set(playedNotes);

    for (const note of playedSet) {
      if (!targetNotes.has(note)) {
        fitness -= 100;
      }
    }

    if (fitness < 0) {
      return fitness;
    }

    if (playedSet.has(root)) {
      fitness += 50;
    } else {
      return -200;
    }

    if (!['sus2', 'sus4'].includes(chordType)) {
      const rootIdx = CHROMATIC.indexOf(root);
      let requiredThird;

      if (['minor', 'min7', 'dim'].includes(chordType)) {
        requiredThird = CHROMATIC[(rootIdx + 3) % 12];
      } else {
        requiredThird = CHROMATIC[(rootIdx + 4) % 12];
      }

      if (playedSet.has(requiredThird)) {
        fitness += 100;
      } else {
        return -200;
      }
    }

    const rootIdx = CHROMATIC.indexOf(root);
    let fifth;

    if (chordType === 'dim') {
      fifth = CHROMATIC[(rootIdx + 6) % 12];
    } else if (chordType === 'aug') {
      fifth = CHROMATIC[(rootIdx + 8) % 12];
    } else {
      fifth = CHROMATIC[(rootIdx + 7) % 12];
    }

    if (playedSet.has(fifth)) {
      fitness += 30;
    }

    const numStrings = voicing.frets.filter(f => f !== 'x').length;
    fitness += numStrings * 15;

    const numOpen = voicing.frets.filter(f => f === 0).length;
    fitness += numOpen * 10;

    const activeFrets = voicing.frets.filter(f => f !== 'x' && f !== 0);
    if (activeFrets.length > 0) {
      const maxFret = Math.max(...activeFrets);
      fitness -= maxFret * 2;
    }

    const uniqueFrets = new Set(activeFrets);
    const numFingers = uniqueFrets.size;
    fitness += (4 - numFingers) * 5;

    return fitness;
  }

  createRandomVoicing(maxFret = 12) {
    const frets = [];
    for (let i = 0; i < this.numStrings; i++) {
      if (Math.random() < 0.3) {
        frets.push('x');
      } else {
        frets.push(Math.floor(Math.random() * (maxFret + 1)));
      }
    }
    return new ChordVoicing(frets);
  }

  crossover(parent1, parent2) {
    const point = Math.floor(Math.random() * (this.numStrings - 1)) + 1;
    const child1Frets = [...parent1.frets.slice(0, point), ...parent2.frets.slice(point)];
    const child2Frets = [...parent2.frets.slice(0, point), ...parent1.frets.slice(point)];
    return [new ChordVoicing(child1Frets), new ChordVoicing(child2Frets)];
  }

  mutate(voicing, maxFret = 12) {
    for (let i = 0; i < voicing.frets.length; i++) {
      if (Math.random() < MUTATION_RATE) {
        if (Math.random() < 0.2) {
          voicing.frets[i] = 'x';
        } else {
          voicing.frets[i] = Math.floor(Math.random() * (maxFret + 1));
        }
      }
    }
  }

  findChord(chordName, root, chordType = 'major', onProgress = null, maxFret = 12) {
    let population = [];
    for (let i = 0; i < POPULATION_SIZE; i++) {
      population.push(this.createRandomVoicing(maxFret));
    }

    let bestFitness = -Infinity;
    let generationsWithoutImprovement = 0;

    for (let generation = 0; generation < GENERATIONS; generation++) {
      for (const voicing of population) {
        voicing.fitness = this.calculateFitness(voicing, root, chordType);
      }

      population.sort((a, b) => b.fitness - a.fitness);

      if (population[0].fitness > bestFitness) {
        bestFitness = population[0].fitness;
        generationsWithoutImprovement = 0;
      } else {
        generationsWithoutImprovement++;
      }

      if (onProgress && generation % 20 === 0) {
        onProgress({
          generation,
          bestFitness: population[0].fitness
        });
      }

      if (generationsWithoutImprovement > 30) {
        if (onProgress) {
          onProgress({
            generation,
            bestFitness: population[0].fitness,
            earlyStopping: true
          });
        }
        break;
      }

      const newPopulation = [];

      for (let i = 0; i < ELITE_SIZE; i++) {
        newPopulation.push(population[i].copy());
      }

      while (newPopulation.length < POPULATION_SIZE) {
        const tournament1 = [];
        for (let i = 0; i < 5; i++) {
          tournament1.push(population[Math.floor(Math.random() * 50)]);
        }
        const parent1 = tournament1.reduce((best, current) =>
          current.fitness > best.fitness ? current : best
        );

        const tournament2 = [];
        for (let i = 0; i < 5; i++) {
          tournament2.push(population[Math.floor(Math.random() * 50)]);
        }
        const parent2 = tournament2.reduce((best, current) =>
          current.fitness > best.fitness ? current : best
        );

        let child1, child2;
        if (Math.random() < CROSSOVER_RATE) {
          [child1, child2] = this.crossover(parent1, parent2);
        } else {
          child1 = parent1.copy();
          child2 = parent2.copy();
        }

        this.mutate(child1, maxFret);
        this.mutate(child2, maxFret);

        newPopulation.push(child1);
        if (newPopulation.length < POPULATION_SIZE) {
          newPopulation.push(child2);
        }
      }

      population = newPopulation;
    }

    for (const voicing of population) {
      voicing.fitness = this.calculateFitness(voicing, root, chordType);
    }

    population.sort((a, b) => b.fitness - a.fitness);

    const validSolutions = population.filter(v => v.fitness > 0);
    const uniqueSolutions = [];
    const seen = new Set();

    for (const v of validSolutions) {
      const key = v.frets.join(',');
      if (!seen.has(key)) {
        seen.add(key);
        uniqueSolutions.push(v);
      }
    }

    return uniqueSolutions.slice(0, 10);
  }
}
