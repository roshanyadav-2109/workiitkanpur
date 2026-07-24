Introduction to C Programming (**CS1101**, a 4-credit Foundation course in the Electronic Systems branch, taught by Prof. Nitin Chandrachoodan; the Data Science counterpart is **BSCS3005**) tests hands-on coding through a live-coding **OPPE**. Across IITM BS programming courses the OPPE is a **~120-minute, remotely proctored** exam of roughly **4–5 C coding problems from which you solve any 4**, written and run in a real compiler under webcam supervision, and graded on **automated hidden test cases** — so the code must compile and produce exact output. Programming courses typically have an OPPE 1 (mandatory) and an OPPE 2, with a minimum score (commonly cited as 40/100) required; exact weightages vary by term, so confirm the current grading document.

| Week | Topic | What it covers |
|------|-------|----------------|
| 1 | Computing & programming intro | Computer architecture, memory, loops and conditionals as concepts, how programs run |
| 2 | Data representation | Number systems, binary representation, compilation, the role of the OS |
| 3 | C basics | Program structure, variables, data types, operators, expressions |
| 4 | Control flow | `if`/`else`, `switch`, `for`/`while`/`do-while` loops |
| 5 | Functions | Definitions, parameters, scope, recursion |
| 6 | Pointers | Pointers and memory, endianness, alignment |
| 7 | Arrays & strings | Arrays, pointer arithmetic, C strings |
| 8 | Aggregate types | `struct`, `typedef`, `union`, `enum` |
| 9 | Dynamic memory | `malloc`/`free`, heap vs stack, multidimensional arrays |
| 10 | Files & bits | File I/O, bit manipulation |
| 11 | Build & preprocessor | Preprocessor, macros, multi-file projects |
| 12 | Review | Revision |

<!--ARTICLE-->

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
