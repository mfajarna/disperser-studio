# Task: Audio Studio Core Features (YouTube & Library)

## Objective
Implement the core functionality of the **Audio Studio**, allowing users to download audio directly from YouTube, edit it in the browser, and manage their uploaded audio library.

## Requirements

### 1. YouTube Audio Downloader & Editor
- **Input:** Provide an input field to accept YouTube URLs.
- **Backend Integration:** Connect to a backend API (or create one) to extract and download the audio stream from the provided YouTube link.
- **In-Browser Manipulation:** 
  - Once downloaded, load the audio into a waveform visualizer (e.g., using Wavesurfer.js).
  - Implement controls for:
    - ✂️ **Trim**: Start and end points.
    - ⏩ **Speedup**: Adjust playback rate.
    - 🎚️ **Pitch**: Adjust pitch independent of speed if possible, or simple speed-based pitch adjustment.
- **Upload Action:** A button to finalize the edit and prepare the audio for upload to Roblox.

### 2. Audio Menu Restructuring
- Split the current "Upload Audio" section into two distinct sub-menus or tabs:
  - 🎙️ **Studio Upload:** The interface containing the YouTube downloader and audio manipulation tools described above.
  - 📚 **Audio Library:** A data table view showing previously uploaded audio assets.

### 3. Audio Library Table
- Recreate the robust table view from previous iterations.
- **Columns:** Should display asset name, status (e.g., Pending, Approved, Rejected), duration, and any relevant IDs.
- **Features:** Must include pagination, sorting, and row selection for bulk actions.

## Technical Constraints
- Use **Vite + React + TypeScript**.
- Styling must use **Tailwind CSS v3** and **shadcn/ui**.
- Ensure the UI aligns with the new "Cyan & Blue" dark theme dashboard design.
- Consider utilizing audio processing libraries suitable for the browser or coordinate with the backend.

## Acceptance Criteria
- [ ] Users can input a YouTube URL and see the audio waveform appear after processing.
- [ ] Users can apply trim, speed, and pitch manipulations to the loaded audio.
- [ ] The Audio section clearly presents two tabs/menus: "Studio Upload" and "Audio Library".
- [ ] The "Audio Library" displays a clean, sortable table of past uploads.
