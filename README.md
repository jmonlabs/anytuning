# AnyTuning - Guitar Chord Finder

Find guitar chord variations for any tuning using genetic algorithms.

## Overview

AnyTuning is a web application built with Svelte that uses genetic algorithms to discover playable guitar chord voicings for any custom tuning. Whether you use standard tuning, drop D, DADGAD, or your own experimental tunings, this tool will help you find chord positions that actually work on the fretboard.

## Features

- Support for any custom guitar tuning
- Preset tunings included (Standard, Drop D, DADGAD, Open G, Open D, NST variants)
- Multiple chord types: Major, Minor, 7th chords, Suspended, Diminished, Augmented
- Genetic algorithm optimization for playable chord positions
- Configurable playability constraints based on hand size and skill level
- Advanced biomechanical validation (finger stretch, span limits, barre detection)
- Difficulty scoring for each chord voicing
- Adjustable fret range
- Real-time progress feedback
- Multiple voicing suggestions ranked by playability

## How It Works

The application uses a genetic algorithm to evolve and discover chord voicings:

1. Generates a random population of possible chord fingerings
2. Evaluates each fingering based on:
   - Physical playability (span, finger count, barre positions)
   - Correct notes for the chord
   - Ease of playing (open strings, low fret positions)
   - Rich sound (more strings played)
3. Evolves better solutions through crossover and mutation
4. Returns the top 10 unique playable voicings

## Installation

Install dependencies:

```bash
npm install
```

## Development

Start the development server:

```bash
npm run dev
```

The app will be available at http://localhost:5173

## Building for Production

Build the application:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Usage

1. Select a preset tuning or enter a custom tuning
2. Choose the root note for your chord
3. Select the chord type (Major, Minor, 7th, etc.)
4. Adjust the maximum fret if needed
5. Select playability constraints based on your hand size:
   - Small Hands: Stricter constraints, smaller spans
   - Normal (Default): Standard biomechanical limits
   - Large Hands: More relaxed constraints, larger spans allowed
   - Advanced Player: For experienced players with high flexibility
6. Optionally enable "Show Advanced Settings" to fine-tune individual constraints
7. Click "Find Chords" to generate voicings

The results will show:
- Fret positions (x = muted string, 0 = open string, numbers = fret positions)
- Notes played in each voicing
- Number of fingers required
- Difficulty rating (Easy/Medium/Hard/Very Hard)

## Chord Types Supported

- Major
- Minor
- Dominant 7th
- Major 7th
- Minor 7th
- Suspended 2nd
- Suspended 4th
- Diminished
- Augmented

## Preset Tunings

- Standard: E-A-D-G-B-E
- Drop D: D-A-D-G-B-E
- DADGAD: D-A-D-G-A-D
- Open G: D-G-D-G-B-D
- Open D: D-A-D-Gb-A-D
- NST: C-G-D-A-E-G
- NST-1: Bb-F-C-G-D-F
- NST-2: A-E-B-Gb-Db-E

## Custom Tuning Format

Enter notes from lowest to highest string, separated by dashes.
Example: E-A-D-G-B-E

Available notes: C, Db, D, Eb, E, F, Gb, G, Ab, A, Bb, B

## Playability Constraints

The chord finder uses advanced biomechanical constraints to ensure all suggested voicings are physically playable:

### Constraint Presets

- **Small Hands**: Maximum span of 3 frets, stricter diagonal stretch limits, reduced barre requirements
- **Normal**: Standard biomechanical limits suitable for most players (max span: 4 frets)
- **Large Hands**: Relaxed constraints allowing spans up to 5 frets and larger stretches
- **Advanced Player**: For experienced players with high finger independence and flexibility

### Advanced Constraint Parameters

When "Show Advanced Settings" is enabled, you can fine-tune:

- **Max Fingers**: Maximum number of fingers used (3-4)
- **Max Absolute Span**: Largest fret distance allowed (3-6 frets)
- **Max Diagonal Stretch**: Maximum Euclidean distance for diagonal stretches (4.0-7.0)
- **Max Barre Stretch**: How far other fingers can reach beyond a barre (2-5 frets)
- **Strict Adaptive Span**: Whether to enforce span limits based on string distance
- **Max Span (2-string gap)**: Span limit when fingers are separated by 2 strings
- **Max Span (3+ string gap)**: Span limit when fingers are separated by 3 or more strings

### Biomechanical Validation

Every chord voicing is validated against:
- Maximum 4 fingers (index, middle, ring, pinky)
- Adaptive span rules based on string distance
- Barre detection with gap validation (3+ strings must be adjacent)
- Lateral stretch limits when using barres
- Diagonal stretch using Euclidean distance formula

## Technical Details

- Built with Svelte 4 and Vite
- Genetic algorithm with configurable parameters
- Population size: 200 individuals
- Generations: up to 100 (with early stopping)
- Mutation rate: 30%
- Crossover rate: 70%
- Elite preservation: 10 best individuals

## Python Version

The original Python implementation is available in `anytuning.py` for command-line usage.

## License

See LICENSE file for details.
