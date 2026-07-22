---
question: What's the "Teleport MDP" (your thesis) about?
category: research
order: 6
draft: false
---

My master's thesis went after a question everyone skips: *why* do curricula work? They're
everywhere - start easy, ramp up - but the theory was thin. So we built a framework, the
**Teleport MDP**, to formalize curriculum learning in reinforcement learning.

The trick is "teleportation": let the agent jump to a different state mid-episode - really a
way of **truncating the horizon**. Crank the probability up and the agent chases immediate
reward; the task gets easier. So a curriculum is just annealing that probability to zero:
start with a short, forgiving horizon, then gradually hand over the full problem.

We proved the bounds, wrote the exact algorithm (correct, completely impractical), then two
that run - one static, one dynamic - and both beat the baseline across several environments.
