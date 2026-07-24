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
