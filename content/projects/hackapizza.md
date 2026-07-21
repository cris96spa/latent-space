---
title: Hackapizza 2025 — Cosmic Pizza RAG Agent
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
in Cosmic Cycle 789, gastronomy spans the multiverse, and an AI assistant has to recommend
dishes to interdimensional travelers - honoring dietary restrictions for thousands of
species and ingredients that exist in several quantum states at once, all while staying
compliant with **Galactic Federation** food law. Under the costume it's a serious
retrieval-and-reasoning problem.

The solution is three parts. An **ingestion pipeline** parses menus, blogs, cookbooks, and
regulations to extract the entities that matter - ingredients, dishes, planets, techniques -
and stores them in a **Neo4j** knowledge graph, so structure the free text implies becomes
structure you can query. A **LangGraph** agent then answers a free-form request by generating
and executing **Cypher** against that graph, reasoning over the results with an LLM. A final
stage maps matched dishes back to their IDs and handles the no-match cases, to line up with
the Kaggle evaluation harness.

Grounding a language model in a graph instead of letting it freestyle is precisely what keeps
it from confidently inventing a dish that would violate three treaties and poison a delegate.
