---
question: What's the "Teleport MDP" (your thesis) about?
category: research
order: 6
draft: false
---

My master's thesis went after a question everyone skips: *why* do curricula work? Everyone
uses them - start easy, ramp up the difficulty - but the theory was thin. So we built a
framework, the **Teleport MDP**, to formalize curriculum learning in reinforcement
learning.

The trick is "teleportation": let the agent jump to a different state mid-episode, which is
really a way of **truncating the horizon**. Crank the teleport probability up and the agent
stops worrying about the distant future and chases immediate reward - the task effectively
gets easier. So a curriculum is just annealing that probability down to zero: start with a
short, forgiving horizon, and gradually hand the agent the full problem.

We proved the bounds, wrote the exact algorithm (correct, completely impractical), then two
that actually run - one static, one dynamic - and both beat the baseline across several
environments.
