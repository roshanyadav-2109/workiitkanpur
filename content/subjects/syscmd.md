System Commands (**BSSE2001**, 3 credits, Diploma in Programming, taught by Prof. Gandham Phanikumar) is assessed by a remote-proctored **OPPE** taken in a real Linux/Bash environment. Questions are almost entirely hands-on: you're given files or data and must write **shell commands and short scripts** — heavy use of `grep`, `sed`, `awk`, `cut`, `tr`, pipes and redirection, `find`, file permissions, and Bash scripting (loops, conditionals, arguments). The terminal and its `man` pages are available, so looking up options quickly matters. The course also has weekly assignments, in-person quizzes and an end-term; exact weightages vary by term.

| Week | Topic | What it covers |
|------|-------|----------------|
| 1 | Linux fundamentals & the shell | Linux basics, the command line, hardware/OS info, I/O redirection |
| 2 | Packages, files & permissions | `apt`, file types, permissions (symbolic & octal), environment variables |
| 3 | Shell environment & processes | Shell variables, links & inodes, the filesystem, process management |
| 4 | Redirection, regex & find | Pipes, regular expressions, `egrep`, the `find` command, first Bash scripts |
| 5 | Shell scripting | Shebang, variables, arguments, conditionals, loops, functions, scheduling |
| 6 | Text processing: awk & sed | `awk` and `sed`, regex in practice, field extraction, substitution |
| 7 | Build, archives & networking | `make`, `tar`/`zip`/`gzip`, networking basics, log-analysis scripts |
| 8 | Storage & version control | RAID intro; Git — repositories, branches, pull requests, workflows |

<!--ARTICLE-->

The System Commands OPPE is a live, terminal-based exam: you're handed text files, logs or CSV-like data and asked to extract, transform or summarise them with **one-liners and short Bash scripts**. Little is theory — almost everything is "produce this output from that input." Practise until the syntax is muscle memory on the [System Commands practice set](/app/subjects/syscmd).

## What commands come in the System Commands OPPE?

The high-frequency toolkit is `grep`, `sed`, `awk`, `cut`, `tr`, plus pipes (`|`), redirection (`>`, `>>`, `2>`), `find`, `sort`, `uniq`, `wc`, `head`/`tail`, and `chmod`. Weeks 4–7 (regex/`find`, scripting, `awk`/`sed`, log processing) are where most exam marks sit.

## grep / sed / awk tips that actually score

- **grep:** learn `-E` (extended regex), `-i`, `-v` (invert), `-c` (count), `-o` (only the match), `-r`, and anchors `^`/`$` with classes `[0-9]`. Many "count lines containing X" questions are a single `grep -c`.
- **sed:** master `sed 's/old/new/g'`, in-place `-i`, deletion `sed '/pattern/d'`, range printing `sed -n '2,5p'`, and backreferences `\1`.
- **awk:** `awk -F',' '{print $2}'` for fields, `NR`/`NF` for counts, `BEGIN{}`/`END{}` blocks, conditions like `awk '$3 > 100'`, and column sums (`{s+=$2} END{print s}`).

Keep the [GNU sed](https://www.gnu.org/software/sed/manual/sed.html) and [GNU awk](https://www.gnu.org/software/gawk/manual/gawk.html) manuals open while you drill.

## Shell scripting doubts

Scripts trip people up on small syntax, not logic. Nail down the shebang `#!/bin/bash`, positional args `$1`, `$@`, `$#`, the spaces inside `[ "$a" -eq 1 ]`, `for`/`while` loops, `case`, and exit statuses. Test what happens with **no arguments** — graders often check edge cases. Since scripting overlaps with general programming, brushing up logic on the [Python practice track](/app/subjects/python) helps.

## Common mistakes

- Forgetting the `g` flag on `sed` and only replacing the first match per line.
- Wrong `awk` delimiter — defaulting to whitespace when the file is comma- or colon-separated.
- Using basic-regex `grep` when the pattern needs `grep -E`.
- Quoting errors — unquoted `$variables` and globbing surprises.
- `chmod` confusion between octal (`755`) and symbolic (`u+x`) modes.
- Overwriting input with `>` before you've verified the pipeline.

## Exam-day tips

Read every question fully before touching the keyboard, and build pipelines incrementally — get `grep` right, then pipe to `cut`, then to `sort`. Use `man` (it's allowed) but don't browse aimlessly. Verify output against exactly what's asked (trailing spaces and case matter for auto-grading). Do the easy `grep`/`cut` questions first to bank marks, then return to the awk/scripting ones. See where practice puts you on the [leaderboard](/leaderboard).

## FAQ

**Is the System Commands OPPE only shell, or Python too?** It's overwhelmingly Linux shell/Bash. Some tasks touch general scripting logic, but the core is `grep`, `sed`, `awk` and Bash.

**Can I use `man` pages during the exam?** Yes — the terminal and its manual pages are available. Practise looking up flags quickly.

**Which weeks matter most?** Weeks 4–7: regex/`find`, shell scripting, `awk`/`sed`, and log processing.

**How do I practise realistically?** Work on real files in a terminal under time pressure, not by reading notes. Use the [System Commands practice module](/app/subjects/syscmd).

**Where's the official info?** The [official IITM BS Data Science program](https://study.iitm.ac.in/ds/) and [GNU coreutils manual](https://www.gnu.org/software/coreutils/manual/coreutils.html).
