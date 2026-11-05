# 🛰️ UAV Precision Agriculture Simulation Engine

A high-performance algorithmic simulation of Autonomous Drone (UAV) Precision Agriculture and Area Coverage Path Planning (CCPP), built for **CS3212: Design and Analysis of Algorithms (DAA)**.

[![Vite](https://img.shields.io/badge/Vite-6.1-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-4.0-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

---

## 📌 Project Overview

This project simulates multi-rotor drone fleets executing precision spraying and canopy inspection across complex agricultural environments. 

The core simulation is built with **zero external runtime dependencies** in the algorithmic layer, utilizing flat typed arrays (`Uint8Array`, `Int16Array`) to maximize cache locality and achieve zero-allocation per frame execution.

---

## 🧠 Key Algorithmic Components

### 1. Graph Traversal & Connectivity (BFS)
- **Algorithm:** Breadth-First Search (BFS) in $\mathcal{O}(V + E)$ where $V \le 1600$ cells and $E \le 6400$ directed edges.
- **Purpose:** Verifies traversability across the $40 \times 40$ field grid and ensures reachability between all four corner docking hubs (Alpha, Bravo, Charlie, Delta) before dispatching sorties.
- **Memory Optimization:** Uses flat typed arrays as an allocation-free circular queue.

### 2. Deterministic Procedural Field Generation
- **Mulberry32 PRNG:** 32-bit pseudo-random number generator for seeded, reproducible obstacle generation.
- **Topologies Supported:**
  - **Open Acreage:** Randomized obstacle clusters, irrigation pivots, and crop patches.
  - **Structured Orchard:** Parallel tree rows, headlands, windbreaks, and orthogonal trellis systems.

### 3. Memory Layout & Cache Locality
- Grid represented as a 1D contiguous `Uint8Array(1600)` mapped via $\text{Index} = y \times 40 + x$.
- Low memory footprint ($\approx 1.6 \text{ KB}$ per grid state), enabling instant headless verification and fast frame rates.

---

## 🛠️ Tech Stack

- **Core & Algorithms:** TypeScript (pure headless engine)
- **Frontend / Visualization:** React 19, HTML5 Canvas
- **Build & Dev Tool:** Vite
- **Styling & UI:** Tailwind CSS v4, Lucide React
- **Verification Engine:** Node.js + tsx runner

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18.0 or higher recommended)
- npm or yarn

### 1. Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/ptundurwar19/DAA-PROJECT.git
cd DAA-PROJECT
npm install
```

### 2. Running the Interactive Simulation
Launch the development server:
```bash
npm run dev
```
Open your browser at the local URL shown in your terminal (typically `http://localhost:5173`).

### 3. Headless Verification Suite
Run the automated academic verification suite in pure Node.js (tests determinism, memory allocation, and BFS reachability):
```bash
npm run test:headless
```

### 4. Production Build
```bash
npm run build
```

---

## 📁 Project Architecture

```
DAA PROJECT/
├── src/
│   ├── environments/         # Field generators (Open Acreage, Structured Orchard)
│   ├── runner/               # Headless Node.js test & verification suite
│   ├── simulation/           # Core DAA logic (BFS, FieldGrid, Mulberry32 PRNG, Types)
│   ├── ui/                   # React components (CanvasField, ControlDeck, TelemetryHUD)
│   ├── index.css
│   └── main.tsx
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 👥 Authors
- **Paras Tundurwar** ([@ptundurwar19](https://github.com/ptundurwar19))
