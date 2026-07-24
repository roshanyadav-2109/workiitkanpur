Introduction to Linux and Programming (**CS1102**, publicly *Introduction to the Linux Shell*, a 4-credit Foundation course in the Electronic Systems branch, paired with the Linux Systems Laboratory CS1902) assesses its practical skills through an **OPPE** taken on a browser-based Linux **virtual machine**, where you type real commands and shell scripts and are graded on the output. It is remote-proctored (webcam + screen share), with only the exam VM and its man-pages available — no external internet or notes. The "programming" in the title is **bash shell scripting**, not C. Exact weightage, duration and question count are set per term; confirm them on your portal.

| Week | Topic | What it covers |
|------|-------|----------------|
| 1 | Getting started with Linux & the shell | Filesystem hierarchy, `pwd`, `ls`, `cd`, absolute vs relative paths |
| 2 | Files, directories & permissions | `mkdir`, `cp`, `mv`, `rm`, `touch`; `chmod`/`chown`, users & groups |
| 3 | Editors & viewing files | `cat`, `less`, `head`, `tail`, `vim`/`nano`; `man` and `--help` |
| 4 | I/O redirection & pipes | stdin/stdout/stderr, `>`, `>>`, `<`, `|`, `tee`, subshells |
| 5 | Searching & pattern matching | `grep`, basic/extended regex, wildcards/globbing, `find`, `locate` |
| 6 | Text processing tools | `cut`, `paste`, `sort`, `uniq`, `wc`, `tr` |
| 7 | Shell variables & expansion | Environment vs shell variables, quoting, command & arithmetic substitution |
| 8 | Shell scripting fundamentals | `.sh` scripts, shebang, arguments (`$1`, `$@`), `read`, `if`/`test`/`[[ ]]` |
| 9 | Loops & functions | `for`, `while`, `until`, `case`, functions, debugging with `set -x` |
| 10 | Stream editing with sed | Line selection, search-and-replace, in-place edits, sed scripts |
| 11 | Data processing with awk | Pattern–action model, fields/records, built-in variables, arrays |
| 12 | Archiving, processes & review | `tar`, `gzip`/`zip`, `ps`/`top`/`kill`, jobs, revision |

<!--ARTICLE-->

The Linux Shell OPPE is where your Linux skills are actually tested: you sit at a browser-based Linux **virtual machine**, read a problem, and type the commands or write the shell script that produces the required output. It's remote-proctored, so it rewards genuine fluency — you can't look answers up mid-exam. Practise on the [Linux practice set](/app/subjects/linux).

## The syllabus, in plain terms

The course moves from **navigating the file system** (`ls`, `cd`, `pwd`, `chmod`) through **I/O redirection and pipes**, then **text-processing power tools** (`grep`, `cut`, `sort`, `tr`), and finally **shell programming** — variables, `if`/`for`/`while`, functions, and the two heavyweights, **`sed`** and **`awk`**. The "programming" in the course title is bash shell scripting, not C. If you want to drill programming logic alongside it, use the [Python practice track](/app/subjects/python).

### The commands that show up again and again

If your time is limited, master these first: `grep` with regular expressions, `sed` for search-and-replace, `awk` for column/field processing, `find` for locating files, permissions with `chmod`, and redirection (`>`, `>>`, `|`). A large share of OPPE questions reduce to chaining these together.

## How to prepare (that actually works)

**Practise inside a real terminal, not on paper.** The biggest reason students underperform is *reading* about commands without building muscle memory. Use WSL, a Linux VM, or an online shell, and solve small problems daily.

**Rebuild every weekly assignment from a blank prompt.** Cover your old solutions and redo each task from scratch, timed — that mirrors the OPPE's fresh problem and ticking clock.

**Learn `man` and `--help` well.** The exam VM gives you the manual pages but no internet. Quickly finding a flag (`grep -o`, `sort -k`, `awk -F`) inside `man` is itself an exam skill.

**Do full mock runs** — one window, no notes, a timer, and mixed problems spanning permissions, text processing and a short script. Then compare yourself on the [leaderboard](/leaderboard).

**Keep scripts small and testable.** Write a few lines, run, check output, then extend. Debug with `set -x` and `echo`. A working 6-line script beats an elegant 20-line one that never runs.

Bookmark the [GNU Bash manual](https://www.gnu.org/software/bash/manual/) and the [Linux man-pages project](https://man7.org/linux/man-pages/).

## FAQ

**Is the CS1102 OPPE hard?** It's very doable if you've practised in a live terminal. Students who only watched lectures tend to struggle; those who redid assignments hands-on generally clear it.

**What tools are allowed?** Only the exam VM and its built-in man-pages. No external internet, phones, notes, or AI assistants — the session is webcam- and screen-proctored.

**Does the course teach C?** No. The "programming" here is shell scripting. C is covered in the separate C Programming and Embedded C courses.

**How many questions are in the OPPE?** Typically a small set of mandatory, equally weighted questions spanning all topics. Confirm the count and duration in your term's grading document.

**Where's the official info?** The [IITM BS Electronic Systems program](https://study.iitm.ac.in/es/) and the [IITM BS portal](https://study.iitm.ac.in/).
