---
title: Teleport MDPs - Curriculum Learning for RL
summary: >-
  Master's thesis at Politecnico di Milano: a formal framework - the Teleport MDP - that
  explains why curricula work in reinforcement learning, plus algorithms that keep the
  learning signal alive on sparse-reward tasks where vanilla RL just wanders.
stack:
  - Python
  - PyTorch
  - NumPy
  - Gymnasium
  - PPO
tags:
  - reinforcement-learning
  - curriculum-learning
  - ppo
  - thesis
repository_url: https://github.com/cris96spa/teleportMPD
demo_url: https://cris96spa.github.io/teleportMPD/
published_at: 2024-07-01
draft: false
---

My master's thesis at **Politecnico di Milano** (advisor Prof. Marcello Restelli, with
Dr. Alberto Maria Metelli and Dr. Luca Sabbioni). Everyone in RL uses curricula: start the
agent easy, ramp up. Almost nobody could tell you *why* that works. We built the missing
mathematical object: the **Teleport MDP**.

The mechanism is teleportation. With rate **τ** and distribution **ξ**, the transition
model becomes `P_τ = (1−τ)·P + τ·ξ`: the agent sometimes gets relocated mid-episode, which
truncates the horizon it can plan over. High τ, short horizon, easy problem. A curriculum
stops being folklore and becomes a schedule - anneal τ to zero and hand the agent the full
problem one notch at a time.

We derived the bounds and the exact algorithm (**Teleport Model Policy Iteration**:
provably correct, practically useless), then two schedules that actually run, one static
and one dynamic. Both beat their vanilla counterparts on sparse-reward benchmarks like
Frozen Lake and River Swim. Short version: don't ask an agent to solve the hard problem on
day one - and now there's math for why not.
