# Task: Build Dashboard & Settings Interface

## Objective
Create a modern, sleek dashboard for **Disperser Studio** to replace the current basic layout. The dashboard should include side navigation and a robust settings page for handling API authentication.

## Requirements

### 1. Modern Dashboard Layout
- **Design Aesthetic:** Minimalist, premium, using the established "Cyan & Blue" dark theme (`bg-[#080a0c]`).
- **Sidebar Menu:** Implement a sidebar or top navigation containing the following tabs/menus:
  - 📊 **Overview**
  - 🎵 **Upload Audio**
  - 🖼️ **Upload Image**
  - ⚙️ **Settings**

### 2. Settings Menu Implementation
- Create a dedicated Settings view.
- **Form Elements:**
  - Input field for **UserId**
  - Input field for **API_KEYS** (Open Cloud API Key)
- **Helper Section (How to get API Keys):**
  - Provide clear, step-by-step instructions on how users can generate their Open Cloud API Keys.
  - Include direct links to the **Roblox Creator Dashboard**.
  - Example instruction: *"Go to Creator Dashboard -> Credentials -> Open Cloud API Keys -> Create New Key (with Asset Read/Write permissions)."*

### 3. Technical Constraints
- Use **Vite + React + TypeScript**.
- Styling must use **Tailwind CSS v3**.
- Use **shadcn/ui** components (e.g., `Input`, `Button`, `Card`, `Label`) for the settings form to maintain consistency.
- Use **lucide-react** for any necessary icons.

## Acceptance Criteria
- [ ] The dashboard layout is responsive and cleanly structured.
- [ ] Navigation correctly switches between the 4 specified views (even if the content for Overview/Upload is currently empty/placeholder).
- [ ] The Settings form looks professional, handles inputs securely (password type for API Key), and saves to `localStorage` (or global state).
- [ ] The "How to get API Keys" helper text and link are visible and helpful.
