---
title: Python OPPE: Allowed Modules & How Hidden Test Cases Grade You
description: The two things that quietly fail correct-looking Python OPPE code — which modules you can import, and how hidden test cases actually score your output.
date: 2026-07-22
---

Two things fail more Python OPPE submissions than any algorithm: not knowing **which modules are allowed**, and misunderstanding **how hidden test cases grade you**. Get both right and a lot of "it worked for me" zeros disappear.

## Which modules are allowed in the Python OPPE?

Only the **Python standard library** — there is no internet, no `pip`, and no third-party packages inside the proctored editor. In practice, plain built-in Python covers almost everything, and the two imports you'll actually reach for are:

- `import math` — `sqrt`, `gcd`, `factorial`, `ceil`/`floor`, `inf`.
- `import random` — only if a question explicitly needs randomness (rare).

You do **not** need `numpy` or `pandas` for OPPE coding questions, and trying to import them will fail. If you forget a built-in's signature, `help(name)` and `print(dir(obj))` work right inside the editor. Practise with just the standard library on the [Python practice set](/app/subjects/python) so nothing surprises you on exam day.

## How hidden test cases actually work

Your program is run against inputs you never see, and its **printed output is compared, character for character**, to the expected output. That's why correct logic still scores zero:

- **Exact format** — an extra space, a missing newline, wrong capitalisation, or printing `5.0` when `5` was expected all fail.
- **Silent edge cases** — empty input, a single element, zero, negative numbers, ties, and a trailing blank line in a file.
- **No prompt text** — never put a message inside `input()`; print only what the question asks for.

## Test yourself before you submit

Before submitting, feed your own extreme inputs: the empty case, the one-element case, the largest case. If the question says "print the numbers separated by a space," check there's no trailing space. This habit is the single biggest score-saver — rehearse it under a timer and see where you land on the [leaderboard](/leaderboard).

## FAQ

**Can I import `collections` or `itertools`?** Yes — they're standard library. Anything shipped with Python is available; third-party packages are not.

**Does output have to match exactly?** Yes. Auto-grading is a string comparison, so format matters as much as logic.

**Where do I practise this?** On the [Programming in Python practice page](/app/subjects/python), with the [official Python docs](https://docs.python.org/3/) for reference.
