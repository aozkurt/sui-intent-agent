# sui-intent-agent

An AI-powered intent agent that converts natural language commands into **validated Sui blockchain transactions**.

This project allows users to write commands like:

> “send 0.1 sui to 0xabc...”

The system uses an AI model **only to interpret intent**, then **strict validation** ensure that no unsafe transaction can be executed.

---

## Features

- Natural language → structured intent (AI-powered)
- Strict schema validation with Zod (no blind AI execution)
- Local key signing (private keys never leave your machine)
- Sui Testnet support
- Easily extensible to new intents (stake, swap, NFT, etc.)

---

## Architecture Overview

User Input
↓
AI Intent Parser (UNTRUSTED)
↓
Schema Validation (Zod) ← SAFETY LAYER
↓
Transaction Builder (Sui SDK)
↓
Local Sign & Execute


**Important:**  
The AI **never signs transactions** and **never touches private keys**.  
All blockchain actions are executed only after validation.

---

## Security Model

- Private keys are stored locally (`key.json`) and ignored by Git
- AI output is treated as untrusted input
- Only schema-validated intents can trigger transactions
- Amounts are converted and checked before execution

This design prevents prompt injection, hallucinated actions, and unauthorized transfers.

---

## Tech Stack

- **TypeScript**
- **Sui SDK**
- **OpenAI API**
- **Zod** (runtime validation)
- **dotenv** (environment variables)

---

### Clone the repository

```bash
git clone https://github.com/aozkurt/sui-intent-agent.git
cd sui-intent-agent
