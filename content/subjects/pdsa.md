PDSA (**BSCS2002**, Diploma level) is assessed by a live, webcam-proctored **OPPE** of **Python programming problems** graded on hidden test cases (not MCQ), taken in a restricted browser editor with only the standard library — `heapq`, `collections`, `math`, `functools` are available; there is no open internet, and `help()` works. Most terms run **two attempts (OPPE1 and OPPE2)** and reward your better score, so the OPPEs together carry roughly **40%** of the grade (exact weights vary by term — check the official grading document). You generally need a minimum on the early-week programming assignments to be eligible.

| Week | Topic | What it covers |
|------|-------|----------------|
| 1 | Python refresher | Variables, control flow, functions, lists/tuples/dicts |
| 2 | Complexity, sorting & searching | Big-O/Ω/Θ, best/average/worst case; linear vs binary search; selection, insertion, merge sort |
| 3 | Basic data structures | Arrays, lists, stacks, queues; hashing and dictionaries; ADTs |
| 4 | Graph algorithms – 1 | Adjacency matrix/list; BFS and DFS; reachability, connected components |
| 5 | Graph algorithms – 2 | Topological sort, DAGs; Dijkstra & Bellman-Ford; MST (Prim, Kruskal) |
| 6 | Union-find, heap, BST | Disjoint sets; priority queues; binary heaps (heapify, heapsort); BST operations |
| 7 | Balanced trees, greedy | AVL trees and rotations; greedy design (interval scheduling, Huffman) |
| 8 | Divide and conquer | Recurrences; quicksort, counting inversions, closest-pair |
| 9 | Dynamic programming | Memoization vs tabulation; LCS, edit distance, matrix chain, knapsack, grid DP |
| 10 | String / pattern matching | Naive and efficient string matching, text problems |
| 11 | Flows, LP, complexity classes | Max-flow/min-cut, LP intuition; P, NP, NP-completeness |
| 12 | Summary | Consolidation and revision |

<!--ARTICLE-->

The PDSA OPPE trips up more students than almost any Diploma exam — not because the theory is impossible, but because you must **write correct, efficient Python under a timer, in a locked-down browser, with hidden test cases judging you**. Here's what shows up and how to prepare. Drill on the [PDSA practice set](/app/subjects/pdsa), and if your Python is shaky, warm up on [Python practice](/app/subjects/python) first.

## Which algorithms come in the PDSA OPPE?

Expect problems built on the course core: **searching** (binary search), **sorting** (merge/quicksort logic), **graphs** (BFS, DFS, topological sort, Dijkstra, Bellman-Ford, MST via Prim/Kruskal), **greedy**, **divide and conquer**, and **dynamic programming** (LCS, edit distance, knapsack, grid DP). Data-structure fluency — stacks, queues, heaps/priority queues, hashing with dictionaries, union-find, BST/AVL — underpins most questions. You rarely invent an algorithm; you recognise which known one fits and implement it cleanly.

## How to handle the time limit and complexity

The most common failure is **Time Limit Exceeded** on large hidden inputs. A "correct" O(n²) solution can still fail on big data. Before coding, ask: what's the input size, and what complexity does it demand? Use a `dict`/`set` for O(1) lookups instead of scanning lists, reach for `heapq` when you need a priority queue, and prefer `sorted()` or merge/quicksort over hand-written O(n²) sorts.

## Graph problems: the highest-yield topic

Graphs span nearly a third of the syllabus (Weeks 4–5) and appear heavily in the OPPE. Have clean, memorised templates for **BFS and DFS** (adjacency-list based), plus shortest-path and MST routines. Practise reading the graph from the exact input format — a frequent silent mistake is building the adjacency structure wrong, so every downstream traversal fails.

## What modules and tools are allowed?

The OPPE runs in a restricted, proctored browser IDE with **no open internet**. You get the standard interpreter and library — `heapq`, `collections` (`deque`, `defaultdict`, `Counter`), `math`, `functools` are your friends — and `help()` for built-in docs. No Stack Overflow, external editor, or phone. Practise entirely inside a browser IDE like the one on the [practice platform](/app/subjects/pdsa) so the environment feels familiar.

## Common mistakes

- Ignoring edge cases: empty input, single node, disconnected graphs, duplicates.
- Off-by-one errors in binary search and DP indexing.
- Reading input incorrectly (whitespace, multiple lines, count lines).
- Writing an O(n²) brute force when constraints demand O(n log n).
- Not dry-running your code on a small example before submitting.

## Exam-day tips

Clear the System Compatibility Test early, sit in a quiet, well-lit room, and read every question fully before coding. Solve the easiest problem first to bank marks. Compare your standing on the [leaderboard](/leaderboard). Remember most terms give **two attempts** and count the better one — so a rough first attempt is recoverable.

## FAQ

**How many OPPEs are there in PDSA?** Usually two (OPPE1 and OPPE2); the grading formula rewards your better score. Confirm with the current term's grading document.

**Is it multiple choice?** No — Python coding with hidden test cases, auto-graded on correctness.

**Can I use `heapq` and `collections`?** Yes, the standard library is available; there's no internet.

**Do I need to memorise algorithms?** You need to implement them from memory — BFS, DFS, Dijkstra, merge/quicksort, and common DP patterns.

**Where's the official info?** The [IITM BS Data Science program](https://study.iitm.ac.in/ds/), the [PDSA course page](https://study.iitm.ac.in/ds/course_pages/BSCS2002.html), and the [Python `heapq` docs](https://docs.python.org/3/library/heapq.html).
