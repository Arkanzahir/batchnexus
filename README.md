# BatchNexus™ Enterprise Control Tower

![BatchNexus Status](https://img.shields.io/badge/Status-Production_Ready-success?style=for-the-badge) ![Version](https://img.shields.io/badge/Version-1.0.0--enterprise-blue?style=for-the-badge) ![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js) ![AI Copilot](https://img.shields.io/badge/AI_Powered-Groq_Llama_3-blue?style=for-the-badge)

**BatchNexus** is a next-generation Enterprise Supply Chain Management (SCM) and Manufacturing Execution System (MES), designed specifically to bridge the operational gap between raw material procurement, quality assurance, production scheduling, and global logistics dispatch. 

Built on a modern microservices architecture utilizing Next.js App Router and a robust Data-as-a-Service (DaaS) backend, BatchNexus delivers real-time operational visibility and AI-augmented decision making capabilities.

---

## 🏗️ Core Architecture & Features

BatchNexus provides an end-to-end operational workflow, completely replacing disjointed legacy systems with a single source of truth:

### 1. AI-Assisted Inbound Intake
Automated ingestion of raw materials from suppliers. Features an integrated OCR and NLP engine (powered by Groq Llama-3) to instantly extract supplier documents, quantities, and origin data directly into the DaaS backend.

### 2. Quality Control (QC) Command Center
A comprehensive validation module for quality assurance officers. Features automated parameter checking, defect risk scoring, and one-click lot generation for materials passing the quality threshold.

### 3. PPIC (Production Planning & Inventory Control) Kanban
A highly interactive, real-time drag-and-drop kanban interface for production scheduling. 
* **Smart Queuing**: Automatically routes QC-released lots to production.
* **AI Copilot Assignment**: An intelligent agent analyzes production priority, material expiry, and demand to automatically suggest and execute lot movements into the production line.

### 4. Smart Warehousing & Hazard Segregation
Intelligent slotting engine that maps incoming finished goods to the warehouse floor plan. Includes automated safety checks to prevent incompatible chemical combinations (e.g., Flammable vs. Oxidizer) from being stored in adjacent bins.

### 5. Global Sample Dispatch Logistics
An integrated outbound logistics module tailored for handling localized shipping and export routing. Connects finalized production lots to courier and freight forwarding endpoints.

---

## 💻 Tech Stack & Infrastructure

- **Frontend Core:** Next.js 16 (App Router), React 18, TypeScript
- **Styling & UI:** Tailwind CSS, Material Design 3 (M3) Tokens, Dynamic Dark Mode
- **Backend Infrastructure:** Buildpad DaaS (Data-as-a-Service) RESTful API
- **Artificial Intelligence Engine:** Groq Cloud Llama-3 (Document extraction, QC scoring algorithms, automated daily reporting)
- **Deployment:** AWS Amplify / Vercel Edge Network

---

## 🔒 Security & Compliance

BatchNexus is designed with enterprise security standards in mind:
- **Immutable Audit Logs:** Every state change (QC approval, lot movement, dispatch) is cryptographically recorded in the `/audit` trail.
- **Role-Based Access Control (RBAC):** UI elements dynamically render based on strict departmental privileges (Admin, QC Officer, Warehouse Manager).

---

## ⚙️ System Deployment

BatchNexus requires a Node.js environment (v18.17+) and access to the Buildpad DaaS infrastructure.

### Local Initialization

```bash
# Clone the enterprise repository
git clone https://github.com/Arkanzahir/batchnexus.git
cd batchnexus

# Install package dependencies
pnpm install

# Initialize development server
pnpm dev
```

### Environment Configuration

System administrators must provision the `.env.local` file with appropriate enterprise credentials before starting the Next.js runtime:

```env
NEXT_PUBLIC_BUILDPAD_DAAS_URL=https://daas.buildpad.io/v1
GROQ_API_KEY=your_enterprise_api_key
```

---

<p align="center">
  <small>© 2026 BatchNexus Systems & Sima Arôme Corporation. All Rights Reserved.</small>
</p>
