---
slug: cheaper-inference
question: How do you actually make a model cheaper to run?
category: inference
order: 4
draft: false
---

The honest answer is "buy a bigger GPU," but let's be useful.

Training and serving are different problems. Models train in **bf16** for numerical
stability; serving doesn't need that headroom. At today's state of the art, **8-bit
quantization** is basically lossless and immediately lighter on memory - the speedup is
hardware-dependent, so don't promise one you can't measure. That makes quantizing the
no-brainer first move. Need it smaller still? Go lower-bit, but now you're trading accuracy,
so watch it.

Different angle: **distillation** - train a small student to mimic a big teacher. More
powerful, more work; you need data and compute you didn't before. Rule of thumb: if
quantization is enough, ship it. If not, distill, then quantize - unless you actually see
the accuracy drop, in which case stop and measure before you optimize yourself into a worse
model.
