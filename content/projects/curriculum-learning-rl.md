---
slug: curriculum-learning-rl
title: Curriculum Learning for Reinforcement Learning
summary: >-
  Master's thesis at Politecnico di Milano - a curriculum-learning framework on top of
  policy-gradient methods that scales task difficulty on purpose, so sparse-reward problems
  that break vanilla RL become solvable.
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
published_at: 2024-07-01
draft: false
---

My master's thesis at **Politecnico di Milano** (advisor: Prof. Marcello Restelli). Standard
RL falls over on sparse-reward tasks - if the agent almost never stumbles into a reward,
there is almost nothing to learn from. The thesis builds a **curriculum-learning framework**
on top of **policy-gradient methods (PPO)** that starts the agent on easier versions of the
task and progressively scales the difficulty, deriving algorithms that keep the learning
signal alive where a from-cold-start policy would just wander.

The short version: don't ask an agent to solve the hard problem on day one. Teach it the way
you'd teach anything - easy first, then turn up the difficulty once it stops falling over.
