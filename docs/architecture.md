# Chatbot System Architecture

This document describes the high-level architecture of the Pasdaran Book City
conversational AI system.

The system is designed as a modular, production-ready platform that separates
user experience, automation, and product intelligence.

---

## High-Level Overview

The chatbot consists of five main layers:

1. Website Chat Widget (Frontend)
2. PHP Backend (Persistence & Bridging)
3. Automation Layer (n8n)
4. Product Intelligence API
5. Human Operator & Supervisor Channels

---

## 1. Website Chat Widget

**Technologies:** HTML, CSS, JavaScript

- Embedded as a widget on pasdaranbookcity.com
- Handles user messages and UI state
- Sends messages to backend PHP endpoints
- Displays AI or operator responses

This layer is intentionally lightweight and stateless.

---

## 2. PHP Backend Layer

**Technologies:** PHP, MySQL

Responsibilities:
- Persist chat sessions and messages
- Fetch chat lists and chat history
- Accept operator replies
- Act as a secure bridge between frontend and automation workflows

Key endpoints:
- `send-message.php` – store incoming user messages
- `get-chats.php` – list conversations for operators
- `get-chat-details.php` – fetch full chat history
- `operator-reply.php` – send operator messages to users

---

## 3. Automation & Orchestration (n8n)

**Technologies:** n8n, OpenAI, HTTP Webhooks

Responsibilities:
- Intent classification (product, FAQ, order tracking, etc.)
- Clarification handling
- Routing to correct backend services
- Calling product intelligence API
- Triggering Telegram notifications for supervisors
- Returning structured responses to the website

n8n acts as the **control plane**, not the intelligence itself.

---

## 4. Product Intelligence API

**Technologies:** FastAPI, SQLite, Vector Search

### Dual-Layer Design

**Tier A – Deterministic Inventory Layer**
- Exact product lookup
- Stock and price checks
- Supply request fallback
- Covers 34,000+ products

**Tier B – Semantic Recommendation Layer**
- Enriched product subset (3,000–5,000 items)
- Cleaned descriptions and summaries
- Vector embeddings for semantic similarity
- Used only for recommendations and vague queries

This separation ensures correctness and scalability.

---

## 5. Human Operator & Supervisor Channels

**Technologies:** Custom Operator Dashboard, Telegram Bot API

- Operators handle live chats via a dedicated dashboard
- Supervisors receive supply requests via Telegram
- Human handoff is triggered explicitly by the automation layer

This prevents AI overreach and maintains operational control.

---

## Design Principles

- Separation of concerns
- Deterministic core with AI augmentation
- Incremental semantic processing
- Human-in-the-loop safety
- Production-first architecture

---

## Current Status

The system is live and actively evolving.
Planned upgrades include image-based product recognition and vLLM-based inference.
