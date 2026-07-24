Embedded C Programming (**CS2101**, 4 credits, Foundation level in the Electronic Systems branch, taught by Prof. Nitin Chandrachoodan, paired with the Embedded C Laboratory CS2901; prerequisite CS1101) is a hands-on coding course. The officially published CS2101 scheme lists **in-person invigilated quizzes and end-term** exams rather than a remote OPPE — but students prepare the same way for the programming exam: writing, compiling and debugging **embedded C on a microcontroller model** under time pressure. Question types are concept-based — **bit manipulation, register/peripheral configuration, GPIO, serial buses (UART/SPI/I2C), timers, interrupts and ADC** — testing whether you can turn a datasheet-style spec into working C. Always confirm your term's exact format and weightage on the grading document.

| Week | Topic | What it covers |
|------|-------|----------------|
| 1 | Types of microcontrollers | MCU vs microprocessor; memory, compute, interfacing; choosing an MCU |
| 2 | Memory maps & register mapping | Memory-mapped registers, reading/writing hardware registers from C, bit masks |
| 3 | Data structures & styles for embedded | Fixed-width types, `volatile`, bitfields, state machines, polling vs event-driven |
| 4 | GPIO & low-speed interfaces | Pin configuration, reading buttons, driving LEDs, debouncing |
| 5 | Bus interfaces | UART, SPI, I2C; intro to Modbus/CANbus; serial framing and register transfers |
| 6 | Human–computer interaction | Keyboard, mouse, touchscreen input handling |
| 7 | High-performance I/O | Buffering, DMA, USB, Ethernet basics |
| 8 | Real-time operating systems | Latency, scheduling, tasks; FreeRTOS concepts |
| 9 | Video interfaces | Display/video signal interfaces |
| 10 | System-level design & integration | Combining peripherals, SoC concepts, subsystem integration |

Also emphasised across the course: **clocking/frequency control, timers & PWM, interrupts and ISRs, ADC reading**, and embedded testing/debugging.

<!--ARTICLE-->

Embedded C (CS2101) tests one thing above all: **can you write and debug embedded C on a microcontroller under time pressure?** Whether your term runs a remote or in-centre programming exam, the skill is identical. Practise on the [Embedded C practice set](/app/subjects/embedded-c).

## What is the Embedded C exam in IITM BS?

CS2101 is a 4-credit Foundation course in the [IIT Madras BS in Electronic Systems](https://study.iitm.ac.in/es/) program. Per the official [course page](https://study.iitm.ac.in/es/course_pages/CS2101.html), it's graded through weekly online assignments, two in-person invigilated quizzes and an in-person end-term. Students carry the term "OPPE" over from the Data Science program — treat it as **programming-exam practice**: a timed, compile-and-run test on embedded C.

## The syllabus that matters most

The heaviest-scoring, most exam-relevant areas are:

- **Bit manipulation & registers** — masks, shifts, setting/clearing bits, `volatile`, fixed-width types. This underlies everything.
- **GPIO** — configure pins, read buttons, drive outputs. Practise the classic "blink an LED three different ways."
- **Serial buses** — UART, SPI, I2C register-level transfers.
- **Timers, PWM, interrupts and ADC** — the peripherals most likely to appear as a coding task.
- **RTOS basics** — scheduling and latency concepts (FreeRTOS).

## How to prepare (practical advice)

1. **Code every day in a timed window.** Reading embedded C isn't the same as writing it against a clock. Use the practice sets at [/app/subjects/embedded-c](/app/subjects/embedded-c).
2. **Master bit operations cold.** If you hesitate on `PORTB |= (1 << 3);`, you'll lose time on every question.
3. **Read like a datasheet.** Turn "configure Timer1 for 1 kHz" into register writes. Practise the translation.
4. **Debug fast.** Spot missing `volatile`, wrong bit width, and off-by-one register offsets quickly.
5. **Warm up your C fundamentals** (pointers, arrays, structs) on the [Python and programming practice](/app/subjects/python) if your base is rusty, then return to embedded specifics.
6. **Benchmark yourself** on the [leaderboard](/leaderboard) to gauge readiness.

For concept revision, the official [IIT Madras BS portal](https://study.iitm.ac.in/) is the anchor.

## FAQ

**Is the Embedded C exam online or offline?** The official CS2101 page lists in-person invigilated quizzes and end-term. Confirm your term's format on the current grading document.

**What language and tools are used?** Embedded C on a microcontroller model, with a standard C toolchain. Focus on register-level code, not libraries.

**What's the single most important topic?** Bit manipulation and register configuration — it appears everywhere, from GPIO to timers to serial buses.

**What's the prerequisite?** CS1101 – Introduction to C Programming. Solid plain-C skills are assumed.

**How should I practise?** Timed, hands-on coding on GPIO/timer/interrupt/ADC tasks. Start at [/app/subjects/embedded-c](/app/subjects/embedded-c).
