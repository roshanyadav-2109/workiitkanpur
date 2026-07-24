---
title: Programming in Python OPPE: Syllabus, Preparation & Common Doubts
description: A practical guide to the IITM BS Programming in Python OPPE 1 and OPPE 2 — syllabus, allowed modules, grading with hidden test cases, and exam-day strategy.
date: 2026-07-18
---

The **Programming in Python OPPE** trips up more students than the coding itself is hard — a proctored, hidden-test-case exam punishes small habits that never mattered in weekly assignments. Here's exactly what to know.

## OPPE 1 vs OPPE 2: what's the difference?

There are **two OPPEs**. **OPPE 1 is mandatory** (around Week 7) and covers the earlier weeks — algorithms, conditionals, loops and the start of collections. **OPPE 2 is optional**, comes later, and covers the fuller syllabus including tuples, dictionaries, recursion, string processing and file handling.

The key rule: **you only need one of the two to score ≥ 40/100** to stay eligible. Treat OPPE 1 as your real target and OPPE 2 as a safety net — and because the grading formula rewards doing well in *both* attempts, a strong OPPE 2 can still lift your final grade.

## What modules are allowed in the Python OPPE?

Only the **Python standard library** — no internet, no pip, no third-party packages. For nearly every question, plain built-in Python plus `import math` and `import random` is all you need. You do **not** need Pandas or NumPy for the coding questions. If you forget a built-in's signature, `help(name)` and `print(dir(obj))` work inside the editor.

## How grading and hidden test cases work

Your code is auto-graded against **hidden test cases** you never see. This is why "it worked for me" still scores zero:

- **Output format must be exact** — a stray space, missing newline, wrong case, or printing `5.0` instead of `5` fails the match.
- **Edge cases are tested silently** — empty lists/strings, a single element, zero, negatives, ties, files with a trailing blank line.
- **Read input exactly as specified** — don't put prompt text inside `input()`.

Rehearse this on the [Python practice page](/app/subjects/python) and track your standing on the [leaderboard](/leaderboard).

## How to prepare for OPPE 1 vs OPPE 2

- **OPPE 1:** Get fast and mechanical with `if/elif/else`, `while`/`for`, `range()`, nested loops, and basic string/list handling. Write a clean brute-force solution quickly.
- **OPPE 2:** Add **recursion, dictionaries, matrix/nested-list problems, and file/CSV parsing**. For recursion, first solve it with a loop, then convert to a base case + recursive call.
- **Both:** Solve **previous-year questions (PYQs)** under a timer — repetition on real OPPE-style problems beats re-watching lectures.

## Common mistakes

- Chasing a "clever" one-liner instead of a correct, readable solution.
- Forgetting the exact print format the question demands.
- Not handling empty input or single-element cases.
- Mis-parsing CSV lines — `.strip()` and `.split(',')` are your friends.
- Spending 30 minutes on one hard question instead of banking the four easiest.

## Exam-day tips

It's **5 questions, solve any 4**, in ~2 hours under webcam proctoring. Budget ~3 minutes to read each question and plan pseudocode on paper, then code. **Bank the easy marks first** — since you only need four, skip a question that isn't clicking within ~5 minutes and return. The browser editor is basic, so practise writing Python **without autocomplete or an IDE**.

## FAQ

**Is OPPE 2 compulsory?** No. If you already have ≥ 40/100 in OPPE 1 you meet the requirement, but a good OPPE 2 can still improve your grade.

**Can I use NumPy or Pandas?** No third-party libraries — standard library only. `math` and `random` cover the questions.

**How many questions and how long?** Typically 5 questions, solve any 4, in around 120 minutes.

**Is it MCQ or coding?** Pure coding — you write and submit real Python.

**Where can I practise?** Use timed PYQs and mocks on the [Python practice subject](/app/subjects/python). Official details are on the [IITM BS DS site](https://study.iitm.ac.in/ds/); the [Python docs](https://docs.python.org/3/) and [`random` module reference](https://docs.python.org/3/library/random.html) are worth knowing cold.
