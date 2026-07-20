---
slug: how-do-you-make-llms-cheaper
question: How do you make an LLM cheaper to run?
category: work
order: 3
draft: false
---

Two levers, in this order: **quantization** to shrink the weights, and the **right runtime**
to serve them — TensorRT or vLLM instead of a naive forward pass — with continuous batching
and KV-cache reuse doing a lot of quiet work.

Then the unglamorous part: **measure everything**. Latency, throughput, memory, and quality,
on real traffic shapes, because a 2× speedup that quietly costs you three accuracy points is
not a speedup, it's a regression with good PR. Done properly on on-prem hardware, that got me
to **4× less GPU memory and 1.8× faster** without giving up the outputs anyone cared about.
