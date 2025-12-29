# Pasdaran Book City – AI Chatbot & Product Intelligence System

This repository contains a production-grade conversational AI system built for
**pasdaranbookcity.com**, designed to handle customer support, product discovery,
order tracking, and human handoff in Persian.

The system combines a custom web-based chat widget, an operator dashboard,
and n8n-powered automation workflows with a dedicated product intelligence backend.

---

## Key Features

- Embedded chat widget for website users
- Order tracking via automation workflows
- Product search and availability checks
- Supply request registration for out-of-stock items
- Automatic Telegram notifications to supervisors
- Seamless handoff from AI to human operators
- Operator dashboard for managing live conversations
- Fully Persian (RTL) user experience

---

## System Architecture (High-Level)

### Dual-Layer Product Intelligence

**Tier A – Inventory Layer (Deterministic)**
- Exact product lookup across 34,000+ SKUs
- Stock, price, and availability
- Supply request fallback
- Always correct, fast, and reliable

**Tier B – Semantic Layer (AI-Powered)**
- 3,000–5,000 enriched products
- Cleaned descriptions and semantic summaries
- Vector embeddings for meaning-based search
- Used only for:
  - recommendations
  - similar products
  - vague or conversational queries

This separation ensures speed, accuracy, and scalability.

---

## Technology Stack

### Frontend
- HTML / CSS / JavaScript
- Custom chat widget (RTL, Persian)
- Operator dashboard UI

### Automation & Orchestration
- n8n workflows
- OpenAI-powered intent extraction
- Conditional routing and clarification loops

### Backend (documented, not fully included)
- FastAPI product intelligence service
- Deterministic inventory search
- Vector-based semantic retrieval
- Telegram Bot API for notifications
- PHP endpoints for chat persistence and operator messaging

---

## Repository Structure

frontend-widget/ # Website chat widget
operator-dashboard/ # Human operator UI
n8n/ # n8n workflow exports
docs/ # Architecture and documentation


---

## n8n Workflow

The `n8n/` directory contains exported n8n workflows in JSON format.

To use:
1. Open n8n
2. Go to **Workflows → Import**
3. Import the JSON file

---

## Project Status

🚧 **Actively in development**

Planned upgrades:
- Image recognition for product queries
- vLLM-based inference for lower latency
- Expanded semantic catalog
- Improved recommendation reasoning

This repository reflects a real, evolving production system.

---

## Disclaimer

Sensitive credentials, production URLs, and internal databases are intentionally
excluded from this repository.
