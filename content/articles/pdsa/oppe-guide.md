---
title: PDSA OPPE: Syllabus, Algorithms to Master & Common Doubts
description: A practical guide to the IIT Madras BS PDSA OPPE — syllabus, key algorithms, complexity, graph problems and exam tips.
date: 2026-07-16
---

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
