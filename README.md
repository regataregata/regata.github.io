## Regata


Regata is two things:

1. A from-scratch JavaScript implementation of regular language expressions, deterministic finite automata (DFA), non-deterministic finite automata (NFA) and regular expression matching in terms of DFA evaluation.

2. A tool for the visualization of the minimal DFA for a given regular language expression and its evaluation of a given string with the use of cytoscape.js for modeling.

It's features include:

* Regular language expression string parsing
* Bidirectional NFA-DFA conversion
* Bidirectional Regex-NFA/DFA conversion
* DFA minimization by DFAs by Hopcroft's algorithm
* Conversion of DFA/NFA to an easily processable algebraic representation based on adjacency matrices
* Algebraic simplification of regular language expressions
* Regular language expression randomization for a given depth
* DFA and NFA duplication
* DFA/NFA iteration
* Error handling
