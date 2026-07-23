---
question: 'Cheaper inference: quantization, distillation, or a bigger GPU?'
category: inference
order: 4
draft: false
---

Buy a bigger GPU. Wait, wait, just kidding.

Training and serving are different problems. Models train in **bf16** for numerical
stability; serving doesn't need that headroom. At today's state of the art, **8-bit
quantization** is basically lossless and immediately lighter on memory - the no-brainer
first move. The speedup is hardware-dependent, so don't promise one you can't measure. Need
it smaller? Go lower-bit, but now you're trading accuracy.

Different angle: **distillation** - train a small student to mimic a big teacher. More
powerful, more work; you need data and compute you didn't before. Rule of thumb: if
quantization is enough, ship it. If not, distill, then quantize - and stop the moment you
see the accuracy drop, before you optimize yourself into a worse model.
