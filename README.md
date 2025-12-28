# 🚀 Progress Visualization Dashboard

A high-performance, "Control Room" style dashboard designed to visualize project progression by parsing **Google Conductor** artifacts directly from public Git repositories.

## 📌 Overview

This dashboard automates the tracking of development milestones. By analyzing structured files like `tracks.md`, `plan.md`, and `setup_state.json`, it transforms raw repository data into an interactive, visual progress model.

---

## ✨ Features

### 🛠 Core Functionality

* **Live Git Sync:** Fetch real-time data via GitHub REST API with an on-demand "Sync" trigger.
* **Conductor Context Parsing:** Intelligent extraction of application goals, stages, and tasks from standardized Conductor artifacts.
* **Unified Progress Model:** A normalized schema that calculates completion percentages and tracks statuses (Completed, In Progress, Pending, Blocked).

### 📊 Visualization & UI

* **Control Room Aesthetic:** A responsive, high-tech interface available in both **Light and Dark modes**.
* **Dynamic Charts:** Donut charts for high-level completion and a timeline stepper for phase tracking.
* **Activity Feed:** Recent commit history mapped to project tasks.
* **Advanced Filtering:** Sort and view tasks by status or specific project phases.

---

## 🏗 System Architecture

1. **Ingestion Layer:** Connects to GitHub API and pulls specific markdown and JSON artifacts.
2. **Parsing Engine:** Logic to interpret the hierarchy of `plan.md` and the state of `setup_state.json`.
3. **Visualization Layer:** Frontend components (Charts, Timelines, Tables) that consume the normalized data.



**Would you like me to generate the specific Markdown templates for the `tracks.md` and `plan.md` files so that users know exactly how to format their repository for your dashboard?**
