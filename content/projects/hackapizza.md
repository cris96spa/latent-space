---
title: Hackapizza 2025 - Cosmic Pizza RAG Agent
summary: >-
  2nd place at Hackapizza 2025 (IBM Studios, Milano): a RAG agent that answers "what can I
  actually eat here?" for interdimensional restaurants by turning menus and Galactic
  Federation food law into a knowledge graph and querying it with LLM-generated Cypher.
stack:
  - Python
  - LangGraph
  - Neo4j
  - Cypher
  - RAG
  - uv
tags:
  - rag
  - knowledge-graph
  - agents
  - hackathon
  - llm
repository_url: https://github.com/cris96spa/hackapizza
published_at: 2025-01-19
draft: false
---

**2nd place at Hackapizza 2025**, IBM Studios in Milano. The premise was gleefully absurd:
in Cosmic Cycle 789 an AI assistant recommends dishes to interdimensional travelers -
dietary restrictions for thousands of species, ingredients in quantum superposition, full
compliance with **Galactic Federation** food law. Strip the costume and it's a serious
retrieval-and-reasoning problem.

Our solution has three parts. An **ingestion pipeline** parses menus, blogs, and
regulations into a **Neo4j** knowledge graph - ingredients, dishes, planets, techniques -
so structure the text implies becomes structure you can query. A **LangGraph** agent turns
each free-form question into **Cypher**, runs it, and reasons over the result. A final
stage maps dishes back to their IDs and owns the no-match cases, because the Kaggle
harness does not grade vibes.

Grounding the model in a graph instead of letting it freestyle is exactly what keeps it
from inventing a dish that violates three treaties and poisons a delegate.
