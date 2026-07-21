---
slug: teleport-mdp
title: Teleport MDPs — Curriculum Learning for RL
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

My master's thesis at **Politecnico di Milano** (advisor: Prof. Marcello Restelli), with
Dr. Alberto Maria Metelli and Dr. Luca Sabbioni. Everyone in RL uses curricula - start the
agent on an easy version of the task, ramp up the difficulty - but the *theory* for why that
helps was thin. So we built one: the **Teleport MDP (TMDP)**.

The trick is teleportation. A TMDP extends a normal MDP with a mechanism that can relocate
the agent to a fresh state mid-episode, governed by a teleport rate **τ** and a teleport
distribution **ξ** - so the transition model becomes `P_τ = (1−τ)·P + τ·ξ`. Crank τ up and
the agent stops planning for the distant future and chases immediate reward: the horizon is
effectively **truncated** and the task gets easier. A curriculum, then, is just annealing τ
down to zero - starting on a short, forgiving horizon and gradually handing the agent the
full problem.

We proved the bounds and derived the exact algorithm (**Teleport Model Policy Iteration** -
correct, and completely impractical), then two that actually run: a **Static** and a
**Dynamic** teleport schedule. On sparse-reward benchmarks - Frozen Lake and River Swim -
both beat their vanilla counterparts. The short version: don't ask an agent to solve the
hard problem on day one.
