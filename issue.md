# Task: Audio Studio Improvements & Library Enhancements

## Objective
Improve the **Audio Studio** import flow and enhance the **Audio Library** table with pagination, bulk actions, and optimized API polling.

## Requirements

### 1. YouTube Import — 7 Minute Duration Filter
- **Before downloading**, check the duration of the YouTube video using `yt-dlp --print %(duration)s`.
- If the video exceeds **7 minutes (420 seconds)**, block the import and show an error message:
  > _"This video is too long. Maximum allowed duration is 7 minutes for Roblox audio uploads."_
- Display the detected duration in the UI so the user knows the length before importing.

### 2. Audio Library — Pagination & Visual Polish
- Implement **client-side pagination** on the Audio Library table.
  - Default page size: **10 items per page**.
  - Show page navigation controls (Previous / Next, page numbers).
  - Display total count: _"Showing 1–10 of 47 assets"_.
- Add a **header section** above the table with:
  - Title and description text.
  - Summary stats (total assets, pending, approved, rejected counts).
- Improve the empty state with a more descriptive illustration or message.

### 3. Audio Library — Bulk Upload to Roblox
- Add a **checkbox column** to each row in the table.
- Add a **"Select All"** checkbox in the header.
- When one or more items are selected, show a **bulk action bar** with:
  - "Upload X selected to Roblox" button.
  - "Delete X selected" button (with confirmation dialog).
- Bulk upload should process items **sequentially** (one at a time) to avoid rate-limiting.
- Show a progress indicator during bulk upload (e.g., "Uploading 3 of 7...").

### 4. Roblox Status Polling — Reduce Frequency
- Change the polling interval from **4 seconds** to **30 seconds**.
- This reduces unnecessary API calls to Roblox and avoids potential rate-limiting.
- The background refresh interval should also be adjusted to **30 seconds**.

## Technical Constraints
- Use **Vite + React + TypeScript**.
- Styling uses **Tailwind CSS** and **shadcn/ui** components.
- Maintain the existing "Cyan & Blue" dark theme.
- Audio duration check should be done on the **backend** via `yt-dlp`.

## Acceptance Criteria
- [ ] YouTube imports over 7 minutes are blocked with a clear error message.
- [ ] Audio Library table has working pagination (10 per page).
- [ ] Audio Library header shows descriptive text and asset statistics.
- [ ] Users can select multiple assets and bulk upload/delete them.
- [ ] Roblox polling interval is set to 30 seconds instead of 4 seconds.
