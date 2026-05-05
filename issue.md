# Task: Audio Studio Bulk Processing & Editor Enhancements

## Objective
Enhance the **Audio Studio** bulk upload flow by integrating a user-friendly bulk editor UI that automatically loads after processing. Ensure that local file uploads and YouTube uploads behave consistently, and implement automatic naming to reduce user friction.

## Bug Description
Currently, when a user attempts to upload an audio asset to Roblox from the Audio Library feature, the application UI gets stuck or freezes, preventing further interaction.

### 1. Post-Processing Bulk Editor
- Once the bulk upload process (YouTube downloads or Local file reading) is complete, automatically transition the user to an **Edit Audio** page/view specifically designed for bulk processing.
- Instead of returning to the start or a blank state, the UI should present all successfully processed items ready for final editing (e.g., trimming, volume, pitch adjustments) before final submission to Roblox.

### 2. User-Friendly Bulk Edit UI
- Design the bulk edit interface to be highly intuitive.
- It should allow users to quickly switch between the audio items in the bulk queue, apply edits to individual tracks, and save them.
- Ensure clear visual indicators for which audio file is currently being edited.
- Incorporate existing tools (Waveform, Sliders) gracefully without cluttering the screen when multiple items exist.

### 3. Unified Handling for Local & YouTube Files
- Ensure that the workflow for **Local File Bulk Upload** is identical in experience to the **YouTube Bulk Upload**. 
- Both sources should funnel into the exact same bulk queue and post-processing bulk editor view.

### 4. Automatic Audio Naming
- To prevent user confusion and save time, automatically pre-fill the **Asset Name** input in the editor.
- For local files: Use the original filename (stripping out the extension like `.mp3` or `.wav`).
- For YouTube: Use the fetched YouTube video title.
- Users should still be able to edit this pre-filled name if they choose to do so before preparing the asset.

## Acceptance Criteria
- [ ] Processing a bulk queue (Local or YouTube) automatically opens a bulk-specific editing interface.
- [ ] The bulk editing interface is clean, user-friendly, and handles multiple tracks efficiently.
- [ ] Local file bulk uploads follow the exact same structural flow as YouTube bulk uploads.
- [ ] The audio's display name is automatically populated with the source filename or YouTube title.
