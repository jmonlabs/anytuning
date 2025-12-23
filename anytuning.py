#!/usr/bin/env python3
"""
Algorithme génétique pour trouver des positions d'accords jouables
Fonctionne avec N'IMPORTE QUEL accordage de guitare
"""

import random
import copy
from typing import List, Tuple, Set, Optional

# Notes chromatiques
CHROMATIC = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']

# Paramètres de l'algorithme génétique
POPULATION_SIZE = 200
GENERATIONS = 100
MUTATION_RATE = 0.3
CROSSOVER_RATE = 0.7
ELITE_SIZE = 10

# Accordages prédéfinis (de la corde grave à l'aiguë)
TUNINGS = {
    'standard': ['E', 'A', 'D', 'G', 'B', 'E'],
    'drop_d': ['D', 'A', 'D', 'G', 'B', 'E'],
    'dadgad': ['D', 'A', 'D', 'G', 'A', 'D'],
    'open_g': ['D', 'G', 'D', 'G', 'B', 'D'],
    'open_d': ['D', 'A', 'D', 'Gb', 'A', 'D'],
    'nst': ['C', 'G', 'D', 'A', 'E', 'G'],
    'nst_minus_1': ['Bb', 'F', 'C', 'G', 'D', 'F'],
    'nst_minus_2': ['A', 'E', 'B', 'Gb', 'Db', 'E'],
}


class ChordVoicing:
    """Représente une position d'accord (un individu)"""
    
    def __init__(self, frets: List):
        self.frets = frets
        self.fitness = 0.0
    
    def __repr__(self):
        fret_str = '-'.join([str(f) if f != 'x' else 'x' for f in self.frets])
        return f"Voicing({fret_str}, fitness={self.fitness:.2f})"
    
    def copy(self):
        return ChordVoicing(self.frets.copy())


class GuitarChordFinder:
    """Chercheur d'accords avec algorithme génétique"""
    
    def __init__(self, tuning: List[str], num_strings: Optional[int] = None):
        """
        Initialise le chercheur d'accords
        
        Args:
            tuning: Liste des notes de l'accordage (de grave à aiguë)
                   Ex: ['E', 'A', 'D', 'G', 'B', 'E'] pour standard
            num_strings: Nombre de cordes (optionnel, déduit de tuning)
        """
        self.tuning = tuning
        self.num_strings = num_strings or len(tuning)
        
        if len(tuning) != self.num_strings:
            raise ValueError(f"Le tuning doit avoir {self.num_strings} notes")
    
    def note_at_fret(self, string_idx: int, fret: int) -> str:
        """Retourne la note à une frette donnée"""
        open_note = self.tuning[string_idx]
        open_idx = CHROMATIC.index(open_note)
        note_idx = (open_idx + fret) % 12
        return CHROMATIC[note_idx]
    
    def get_chord_notes(self, root: str, chord_type: str = 'major') -> Set[str]:
        """
        Retourne les notes de l'accord
        
        Args:
            root: Note fondamentale
            chord_type: Type d'accord ('major', 'minor', 'dom7', 'maj7', 'min7', etc.)
        """
        root_idx = CHROMATIC.index(root)
        
        if chord_type == 'major':
            third = CHROMATIC[(root_idx + 4) % 12]
            fifth = CHROMATIC[(root_idx + 7) % 12]
            return {root, third, fifth}
        
        elif chord_type == 'minor':
            third = CHROMATIC[(root_idx + 3) % 12]
            fifth = CHROMATIC[(root_idx + 7) % 12]
            return {root, third, fifth}
        
        elif chord_type == 'dom7':
            third = CHROMATIC[(root_idx + 4) % 12]
            fifth = CHROMATIC[(root_idx + 7) % 12]
            seventh = CHROMATIC[(root_idx + 10) % 12]
            return {root, third, fifth, seventh}
        
        elif chord_type == 'maj7':
            third = CHROMATIC[(root_idx + 4) % 12]
            fifth = CHROMATIC[(root_idx + 7) % 12]
            seventh = CHROMATIC[(root_idx + 11) % 12]
            return {root, third, fifth, seventh}
        
        elif chord_type == 'min7':
            third = CHROMATIC[(root_idx + 3) % 12]
            fifth = CHROMATIC[(root_idx + 7) % 12]
            seventh = CHROMATIC[(root_idx + 10) % 12]
            return {root, third, fifth, seventh}
        
        elif chord_type == 'sus2':
            second = CHROMATIC[(root_idx + 2) % 12]
            fifth = CHROMATIC[(root_idx + 7) % 12]
            return {root, second, fifth}
        
        elif chord_type == 'sus4':
            fourth = CHROMATIC[(root_idx + 5) % 12]
            fifth = CHROMATIC[(root_idx + 7) % 12]
            return {root, fourth, fifth}
        
        elif chord_type == 'dim':
            third = CHROMATIC[(root_idx + 3) % 12]
            fifth = CHROMATIC[(root_idx + 6) % 12]
            return {root, third, fifth}
        
        elif chord_type == 'aug':
            third = CHROMATIC[(root_idx + 4) % 12]
            fifth = CHROMATIC[(root_idx + 8) % 12]
            return {root, third, fifth}
        
        else:
            raise ValueError(f"Type d'accord inconnu: {chord_type}")
    
    def get_played_notes(self, frets: List) -> List[str]:
        """Retourne les notes jouées par une position"""
        notes = []
        for i, fret in enumerate(frets):
            if fret != 'x' and i < len(self.tuning):
                note = self.note_at_fret(i, int(fret))
                notes.append(note)
        return notes
    
    def is_physically_playable(self, frets: List) -> Tuple[bool, str]:
        """
        Vérifie si la position est physiquement jouable
        """
        active_frets = [(i, f) for i, f in enumerate(frets) 
                       if f != 'x' and f != 0 and i < self.num_strings]
        
        if len(active_frets) == 0:
            return True, "OK"
        
        # Créer un dictionnaire frette -> cordes
        fret_to_strings = {}
        for string_idx, fret in active_frets:
            if fret not in fret_to_strings:
                fret_to_strings[fret] = []
            fret_to_strings[fret].append(string_idx)
        
        # Vérifier barrés impossibles
        for fret, strings in fret_to_strings.items():
            if len(strings) > 1:
                strings_sorted = sorted(strings)
                for i in range(len(strings_sorted) - 1):
                    if strings_sorted[i+1] - strings_sorted[i] > 1:
                        return False, f"Barré impossible sur frette {fret}"
        
        # Compter les doigts
        unique_frets = set([f for _, f in active_frets])
        if len(unique_frets) > 4:
            return False, f"Trop de doigts: {len(unique_frets)}"
        
        # Vérifier le span
        fret_values = [f for _, f in active_frets]
        span = max(fret_values) - min(fret_values)
        if span > 4:
            return False, f"Span trop grand: {span}"
        
        return True, "OK"
    
    def calculate_fitness(self, voicing: ChordVoicing, root: str, chord_type: str = 'major') -> float:
        """Calcule le fitness d'une position"""
        fitness = 0.0
        
        # 1. Jouabilité physique
        playable, reason = self.is_physically_playable(voicing.frets)
        if not playable:
            return -1000.0
        
        # 2. Notes jouées
        played_notes = self.get_played_notes(voicing.frets)
        if len(played_notes) < 2:
            return -500.0
        
        # 3. Notes cibles
        target_notes = self.get_chord_notes(root, chord_type)
        played_set = set(played_notes)
        
        # 4. Pénaliser les notes étrangères
        for note in played_set:
            if note not in target_notes:
                fitness -= 100
        
        if fitness < 0:
            return fitness
        
        # 5. Récompenser la fondamentale
        if root in played_set:
            fitness += 50
        else:
            return -200
        
        # 6. Récompenser la tierce (sauf pour sus2/sus4)
        if chord_type not in ['sus2', 'sus4']:
            root_idx = CHROMATIC.index(root)
            if chord_type in ['minor', 'min7', 'dim']:
                required_third = CHROMATIC[(root_idx + 3) % 12]
            else:
                required_third = CHROMATIC[(root_idx + 4) % 12]
            
            if required_third in played_set:
                fitness += 100
            else:
                return -200
        
        # 7. Récompenser la quinte
        root_idx = CHROMATIC.index(root)
        if chord_type == 'dim':
            fifth = CHROMATIC[(root_idx + 6) % 12]
        elif chord_type == 'aug':
            fifth = CHROMATIC[(root_idx + 8) % 12]
        else:
            fifth = CHROMATIC[(root_idx + 7) % 12]
        
        if fifth in played_set:
            fitness += 30
        
        # 8. Plus de cordes = son plus riche (FORTEMENT encouragé)
        num_strings = len([f for f in voicing.frets if f != 'x'])
        fitness += num_strings * 15  # Augmenté de 5 à 15
        
        # 9. Cordes à vide = plus facile
        num_open = sum(1 for f in voicing.frets if f == 0)
        fitness += num_open * 10
        
        # 10. Positions basses préférées
        active_frets = [f for f in voicing.frets if f != 'x' and f != 0]
        if active_frets:
            max_fret = max(active_frets)
            fitness -= max_fret * 2
        
        # 11. Moins de doigts = plus facile
        unique_frets = set(active_frets)
        num_fingers = len(unique_frets)
        fitness += (4 - num_fingers) * 5
        
        return fitness
    
    def create_random_voicing(self, max_fret: int = 12) -> ChordVoicing:
        """Crée une position aléatoire"""
        frets = []
        for i in range(self.num_strings):
            if random.random() < 0.3:
                frets.append('x')
            else:
                frets.append(random.randint(0, max_fret))
        return ChordVoicing(frets)
    
    def crossover(self, parent1: ChordVoicing, parent2: ChordVoicing) -> Tuple[ChordVoicing, ChordVoicing]:
        """Croisement entre deux parents"""
        point = random.randint(1, self.num_strings - 1)
        child1_frets = parent1.frets[:point] + parent2.frets[point:]
        child2_frets = parent2.frets[:point] + parent1.frets[point:]
        return ChordVoicing(child1_frets), ChordVoicing(child2_frets)
    
    def mutate(self, voicing: ChordVoicing, max_fret: int = 12):
        """Mute un individu"""
        for i in range(len(voicing.frets)):
            if random.random() < MUTATION_RATE:
                if random.random() < 0.2:
                    voicing.frets[i] = 'x'
                else:
                    voicing.frets[i] = random.randint(0, max_fret)
    
    def find_chord(self, chord_name: str, root: str, chord_type: str = 'major', 
                   verbose: bool = True, max_fret: int = 12) -> List[ChordVoicing]:
        """
        Trouve les meilleures positions pour un accord
        
        Args:
            chord_name: Nom de l'accord (pour affichage)
            root: Note fondamentale
            chord_type: Type d'accord
            verbose: Afficher les progrès
            max_fret: Frette maximum à considérer
        """
        if verbose:
            print(f"\n{'='*70}")
            print(f"Recherche: {chord_name} (accordage: {'-'.join(self.tuning)})")
            print(f"{'='*70}")
        
        # Initialiser la population
        population = [self.create_random_voicing(max_fret) for _ in range(POPULATION_SIZE)]
        
        best_fitness = -float('inf')
        generations_without_improvement = 0
        
        for generation in range(GENERATIONS):
            # Calculer le fitness
            for voicing in population:
                voicing.fitness = self.calculate_fitness(voicing, root, chord_type)
            
            # Trier
            population.sort(key=lambda x: x.fitness, reverse=True)
            
            # Suivre le meilleur
            if population[0].fitness > best_fitness:
                best_fitness = population[0].fitness
                generations_without_improvement = 0
            else:
                generations_without_improvement += 1
            
            # Affichage
            if verbose and generation % 20 == 0:
                print(f"  Génération {generation}: meilleur fitness = {population[0].fitness:.2f}")
            
            # Arrêt précoce
            if generations_without_improvement > 30:
                if verbose:
                    print(f"  Arrêt précoce à la génération {generation}")
                break
            
            # Nouvelle génération
            new_population = []
            
            # Élitisme
            new_population.extend([v.copy() for v in population[:ELITE_SIZE]])
            
            # Croisement et mutation
            while len(new_population) < POPULATION_SIZE:
                # Sélection par tournoi
                tournament = random.sample(population[:50], 5)
                parent1 = max(tournament, key=lambda x: x.fitness)
                tournament = random.sample(population[:50], 5)
                parent2 = max(tournament, key=lambda x: x.fitness)
                
                # Croisement
                if random.random() < CROSSOVER_RATE:
                    child1, child2 = self.crossover(parent1, parent2)
                else:
                    child1 = parent1.copy()
                    child2 = parent2.copy()
                
                # Mutation
                self.mutate(child1, max_fret)
                self.mutate(child2, max_fret)
                
                new_population.append(child1)
                if len(new_population) < POPULATION_SIZE:
                    new_population.append(child2)
            
            population = new_population
        
        # Résultats finaux
        for voicing in population:
            voicing.fitness = self.calculate_fitness(voicing, root, chord_type)
        
        population.sort(key=lambda x: x.fitness, reverse=True)
        
        # Filtrer et dédupliquer
        valid_solutions = [v for v in population if v.fitness > 0]
        unique_solutions = []
        seen = set()
        for v in valid_solutions:
            key = tuple(v.frets)
            if key not in seen:
                seen.add(key)
                unique_solutions.append(v)
        
        if verbose:
            print(f"\n  Solutions trouvées: {len(unique_solutions)}")
            if len(unique_solutions) > 0:
                print(f"  Top 3:")
                for i, v in enumerate(unique_solutions[:3]):
                    fret_str = '-'.join([str(f) if f != 'x' else 'x' for f in v.frets])
                    notes = self.get_played_notes(v.frets)
                    notes_str = '-'.join(notes)
                    active = [f for f in v.frets if f != 'x' and f != 0]
                    num_fingers = len(set(active))
                    print(f"    {i+1}. {fret_str} → {notes_str} [fitness={v.fitness:.1f}, {num_fingers} doigts]")
        
        return unique_solutions[:10]


def main():
    """Exemples d'utilisation"""
    
    print("="*70)
    print("EXEMPLES D'UTILISATION")
    print("="*70)
    
    # Exemple 1: Accordage standard
    print("\n### Accordage STANDARD ###")
    finder_standard = GuitarChordFinder(TUNINGS['standard'])
    finder_standard.find_chord('G majeur', 'G', 'major')
    finder_standard.find_chord('Am', 'A', 'minor')
    
    # Exemple 2: NST-1
    print("\n### Accordage NST-1 ###")
    finder_nst = GuitarChordFinder(TUNINGS['nst_minus_1'])
    finder_nst.find_chord('Bb majeur', 'Bb', 'major')
    finder_nst.find_chord('Gm', 'G', 'minor')
    
    # Exemple 3: DADGAD
    print("\n### Accordage DADGAD ###")
    finder_dadgad = GuitarChordFinder(TUNINGS['dadgad'])
    finder_dadgad.find_chord('D majeur', 'D', 'major')
    finder_dadgad.find_chord('Dsus4', 'D', 'sus4')
    
    # Exemple 4: Accordage personnalisé
    print("\n### Accordage PERSONNALISÉ (Open C) ###")
    custom_tuning = ['C', 'G', 'C', 'G', 'C', 'E']
    finder_custom = GuitarChordFinder(custom_tuning)
    finder_custom.find_chord('C majeur', 'C', 'major')
    
    # Exemple 5: Accords de 7ème
    print("\n### Accords de 7ème en NST-1 ###")
    finder_nst.find_chord('Gm7', 'G', 'min7')
    finder_nst.find_chord('Cmaj7', 'C', 'maj7')


if __name__ == "__main__":
    main()
