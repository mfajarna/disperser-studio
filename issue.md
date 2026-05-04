# Task: Build Landing Page for Disperser Studio

## 📌 Overview
We need to build a minimalist and modern **Landing Page** for our web application, **Disperser Studio**. 

Disperser Studio is a platform designed to streamline the process of preparing and uploading assets (like audio and images) to Roblox. For this initial MVP phase, **our primary focus is strictly on audio assets**.

## 🎯 Objectives
- **Design Style**: Modern, minimalist, and sleek (think premium SaaS, dark mode preferred but follow standard best practices).
- **Branding**: The product name is **Disperser Studio**. Please ensure the typography and layout reflect a professional creator tool.
- **Call to Action (CTA)**: The primary action on the landing page must be a "Login with Discord" button. 

## 📝 Requirements

### 1. Hero Section
- **Headline**: Catchy and clear, explaining what the tool does (e.g., "The Ultimate Roblox Audio Preparation Tool").
- **Subheadline**: A brief description mentioning the ability to import, edit, and bulk-upload audio assets to Roblox effortlessly.
- **Primary CTA**: A prominent button saying "Login with Discord". You can use a standard Discord brand color/icon for this.

### 2. Features/Highlights Section (Minimal)
- Briefly highlight the core capabilities:
  - **YouTube to Audio**: Import audio directly via URL.
  - **Built-in Studio**: Trim, adjust pitch, speed, and volume in the browser.
  - **Smart Queue**: Bypass Roblox upload friction and track moderation status accurately.

### 3. Tech Stack Constraints
- The project is built using **Vite + React + TypeScript**.
- We are using **Tailwind CSS (v3)** for styling.
- We have **shadcn/ui** installed. Please utilize existing shadcn components (like `Button`, `Card`, etc.) to build this page quickly and consistently.

## ✅ Acceptance Criteria
- [ ] A new `LandingPage.tsx` (or similar) component is created and wired up to the root route (`/`).
- [ ] The design is responsive (works well on mobile and desktop).
- [ ] The "Login with Discord" CTA is highly visible (no backend functionality needed yet, just the UI).
- [ ] The code is clean, well-commented, and utilizes Tailwind CSS utility classes.

## 💡 Developer Notes
- You don't need to implement the actual Discord OAuth flow; just design the UI state for the landing page.
- Keep the aesthetic aligned with high-end creator tools (dark themes, subtle borders, glowing accents if appropriate).
