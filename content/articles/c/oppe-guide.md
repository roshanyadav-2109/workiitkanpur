---
title: Introduction to C Programming OPPE: Syllabus & Preparation
description: A practical guide to the IIT Madras BS Introduction to C Programming OPPE — structure, syllabus, pointers and strings, and exam-day strategy.
date: 2026-07-14
---

The C programming OPPE rewards one thing above all: writing code that **compiles and produces exact output** under time pressure. It puts you in a live compiler and grades your program on hidden test cases — so prepare by *building and debugging small programs fast*, not by memorising syntax. Start timed drills on the [C practice track](/app/subjects/c); if you also take the Python OPPE, the [Python practice set](/app/subjects/python) uses the same exam format.

## What does the C OPPE actually test?

Everything in the [official course](https://study.iitm.ac.in/es/course_pages/CS1101.html) is fair game, but the coding exam leans on the workhorse topics: input parsing, conditionals and loops, functions, **arrays and strings**, and **pointers**. Expect short problems where you read input from `stdin`, transform it, and print an exactly formatted result.

### Are pointers tested in the C OPPE?

Yes — pointers, arrays, and strings are core weeks and appear frequently, often disguised inside array/string manipulation rather than as abstract pointer puzzles. Be comfortable with pointer arithmetic, passing pointers to functions, and dynamic memory (`malloc`/`free`). Structs and recursion also appear. Keep the [C language reference](https://en.cppreference.com/w/c) handy while practising.

### How grading works

Programs are checked by **automated hidden test cases** — your output is compared character-for-character against the expected output. An "almost right" solution (extra spaces, a missing newline, wrong rounding) can score zero on a case, and there's little partial credit for logic that doesn't run. **Get a compiling, correct program for the easy cases first**, then extend.

## Common C mistakes that fail test cases

- Printing extra text ("Enter a number:") the grader doesn't expect — print **only** what's asked.
- Off-by-one errors in loops and array bounds.
- Forgetting the terminating `\0` on strings, or using `==` to compare strings instead of `strcmp`.
- `int` overflow on large inputs — use `long`/`long long` when needed.
- Format-specifier mismatches in `printf`/`scanf` (`%d` vs `%ld`, `%f` precision).
- Uninitialised variables and reading past `EOF`.

## Exam-day tips

The OPPE is **remotely proctored for ~120 minutes** with webcam monitoring, so set up a quiet, well-lit space and keep your ID ready. Read all questions first, then attack the easiest. Budget roughly 20–25 minutes per problem if solving four, keep pen and paper for logic, and **test your code against the sample input before moving on**. If a problem stalls past a few minutes, skip and return. Compare your pace on the [leaderboard](/leaderboard).

## FAQ

**How many OPPEs are there?** Programming courses generally have an OPPE 1 and an OPPE 2; check your term's grading document for which is mandatory.

**What's the passing mark?** A minimum proctored-exam score (commonly cited as 40/100) is typically required — confirm the exact figure for your term.

**Which compiler is used?** A standard C compiler in the exam's browser-based environment; the general internet is restricted during the exam.

**Quiz vs OPPE — what's the difference?** Quizzes are invigilated written tests; the OPPE is live coding graded by test cases.

**Where's the official syllabus?** On the [IITM BS portal](https://study.iitm.ac.in/).
