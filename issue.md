# Task: Fix Audio Library Upload Flow

## Objective
Fix a critical bug in the **Audio Library** where the page gets stuck when uploading audio assets to Roblox. This task is intended to be handed off to a junior programmer or a cheaper AI model.

## Bug Description
Currently, when a user attempts to upload an audio asset to Roblox from the Audio Library feature, the application UI gets stuck or freezes, preventing further interaction.

## Requirements & Next Steps
- Investigate the `handleUploadToRoblox` or similar functions in the Audio Library component (`frontend/src/pages/AudioLibrary.tsx` or related).
- Identify if the state transition (e.g., `loading`, `isUploading`) is failing to reset after an API call or if there's an unhandled promise/error causing the UI thread to hang.
- Ensure that success and error scenarios are properly caught, and UI loaders are dismissed accordingly.
- Test the upload flow to verify that the page remains interactive and responsive during and after the upload process.

## Acceptance Criteria
- [ ] The page no longer gets stuck when uploading audio to Roblox.
- [ ] Appropriate loading states are shown during the upload.
- [ ] The user receives a clear success or error notification when the upload completes or fails.
- [ ] The page returns to its normal interactive state after the upload process finishes.
