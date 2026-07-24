Programming Concepts using Java (**BSCS2005**, Diploma level, 4 credits, taught by Prof. Madhavan Mukund) is an OPPE course assessed through two Online Proctored Programming Exams — **OPPE 1 (PE1) and OPPE 2 (PE2)**. Each is a live, browser-based, proctored coding exam of roughly **2 hours** with about **4–5 Java questions** testing practical OOP (classes, inheritance, polymorphism, interfaces/abstract classes, collections, exceptions); you generally need **≥ 40/100** to be safe. The commonly-reported grading formula weights your better and worse programming exams, making the two OPPEs worth about **45%** of the course (confirm the exact split on your term's grading document).

| Week | Topic | What it covers |
|------|-------|----------------|
| 1 | Classes & objects | Classes, fields, methods, constructors; organising a class hierarchy |
| 2 | Inheritance & overriding | `extends`, `super`, overriding vs overloading, access modifiers |
| 3 | Polymorphism | Dynamic dispatch, runtime vs compile-time binding, upcasting/downcasting |
| 4 | Abstract classes & interfaces | Abstract classes/methods, interfaces, separating interface from implementation |
| 5 | Collections & iterators | `List`, `Set`, `Map`, `ArrayList`/`HashMap`, the `Iterator`/`Iterable` contract |
| 6 | Generics & callbacks | Generic classes/methods, type parameters and bounds, functional-style callbacks |
| 7–8 | Cloning, I/O, serialization, packages | Object cloning, file/stream I/O, serialization, package structure |
| 9 | Exception handling | `try`/`catch`/`finally`, checked vs unchecked, `throw`/`throws`, custom exceptions |
| 10–12 | Concurrent programming | Threads, `Runnable`, race conditions, locks, synchronization, semaphores, monitors |

<!--ARTICLE-->

The Java OPPE is where the diploma stops rewarding memorised assignment answers and starts testing whether you can write working, object-oriented Java under time pressure. If you can design a small class hierarchy that compiles and produces the exact expected output, you're most of the way there. Practise on the [Java practice subject](/app/subjects/java).

## What is the Java OPPE and how is it structured?

The **OPPE** is a live, remote, browser-based coding exam: about **4–5 Java questions in roughly 2 hours**, written and run inside an in-browser editor with a compiler — no local IDE, no autocomplete, no internet. There are two, **OPPE 1** and **OPPE 2**; OPPE 1 is the core exam and OPPE 2 typically serves as a second chance, with grading rewarding your better attempt. You generally need at least **40/100**.

## What OOP concepts are tested?

Expect the fundamentals from Weeks 1–9 to dominate: **classes and objects, constructors, inheritance (`extends`, `super`), method overriding, polymorphism and dynamic dispatch, interfaces and abstract classes, generics, collections (`ArrayList`, `HashMap`), and exception handling**. Questions usually ask you to model something — a shape hierarchy, an account system, a small inventory — read input, process it with your classes, and print exact output. Concurrency (Weeks 10–12) is more often quiz/end-term material than OPPE material, but know it.

## How grading works

The commonly-reported formula weights the two OPPEs together at about **45%** and the end-term about **40%**, and you typically need a minimum graded-assignment average to be eligible to sit the exams. Match the sample output *exactly* — auto-grading is unforgiving. Always confirm the exact weights in your term's official document, since the [course page](https://study.iitm.ac.in/ds/course_pages/BSCS2005.html) lists the structure but not fixed percentages.

## Common Java OPPE mistakes

- **Compilation errors that eat time** — a missing semicolon or wrong method signature with no IDE to catch it. Compile early and often.
- **Wrong output format** — extra spaces, wrong case, or a missing newline fail auto-grading even when logic is correct.
- **Over-engineering** — you need a passing version, not a perfect design. Get it working first, refine second.
- **`Scanner` edge cases** — mixing `nextInt()` and `nextLine()` trips many students.
- **Poor time management** — skip a hard question and bank the easy ones first.

## Exam-day tips

Set up your room and second camera early, keep your ID ready, and know the proctoring rules. Warm up by hand-writing a class with a constructor, a couple of methods, and a `main` that reads input — since you won't have autocomplete, muscle memory for Java syntax matters. Test against the sample cases before moving on. Coming from Python? The [Python OPPE](/app/subjects/python) is similar in format, and you can track progress on the [leaderboard](/leaderboard). For reference while practising (not during the exam), use the [Oracle Java tutorials](https://docs.oracle.com/javase/tutorial/).

## FAQ

**Is OPPE 2 mandatory if I do well in OPPE 1?** The grading weights your better and worse programming-exam scores; a strong OPPE 1 already helps, but students commonly still attempt OPPE 2 to improve. Check your term's rules.

**Can I use my own IDE?** No. You code in the provided proctored in-browser environment, with no autocomplete or internet.

**How many questions and how long?** Around 4–5 Java questions in roughly 2 hours.

**What's the passing mark?** Generally about 40/100 on the exam, plus overall course and eligibility requirements.

**Is concurrency on the OPPE?** It's core syllabus (Weeks 10–12) but appears more in quizzes/end-term; the OPPE leans on OOP fundamentals.
