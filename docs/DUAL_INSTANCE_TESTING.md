# Dual Instance Testing Guide

This guide explains how to run two instances of the HandyApp simultaneously with different user roles for testing interactions between contractors and clients.

## Overview

The dual instance testing feature allows you to:

1. Run two separate instances of the Tauri app simultaneously
2. Configure each instance with a different role (contractor and client)
3. Visually distinguish between the instances with different styling and window titles
4. Test interactions between the two roles in real-time

## How to Run Dual Instances

### Method 1: Using the Automated Script (Recommended)

The simplest way to run dual instances is using the provided npm script:

```bash
npm run dual
```

This will:

- Launch a contractor instance on port 1420
- Launch a client instance on port 1421
- Apply different visual styling to each instance
- Set different window titles for easy identification

### Method 2: Using NPM Scripts

If you're familiar with the `npm run tauri dev` workflow, we've added convenient scripts:

1. Start the contractor instance:

   ```bash
   npm run tauri:contractor
   ```

2. Start the client instance (in a separate terminal):
   ```bash
   npm run tauri:client
   ```

### Method 3: Manual Launch

If you need more control, you can manually launch the instances:

1. Start the contractor instance:

   ```bash
   APP_ROLE=contractor VITE_PORT=1420 npm run dev
   ```

   In another terminal:

   ```bash
   APP_ROLE=contractor tauri dev
   ```

2. Start the client instance:
   ```bash
   APP_ROLE=client VITE_PORT=1421 npm run dev
   ```
   In another terminal:
   ```bash
   APP_ROLE=client tauri dev
   ```

## Visual Indicators

Each instance has visual indicators to help you identify which role you're working with:

- **Window Title**: The window title shows "HandyApp - Contractor" or "HandyApp - client"
- **Color Theme**:
  - Contractor: Blue theme
  - client: Green theme
- **Role Banner**: A colored banner at the top of the app displays the current role

## Testing Interactions

When testing interactions between roles:

1. Perform actions in one instance (e.g., a contractor creating a job)
2. Switch to the other instance to see and respond to those actions (e.g., a client viewing and accepting the job)
3. Continue the workflow by switching between instances as needed

## Potential Conflicts

The dual instance implementation handles several potential conflicts:

1. **Port Conflicts**: Each instance uses a different port for the dev server
2. **Window Title**: Each instance has a unique window title
3. **Visual Distinction**: Different color themes help distinguish between instances
4. **Local Storage**: Each instance maintains separate local storage

## Troubleshooting

If you encounter issues:

1. **Port Already in Use**: Kill any processes using ports 1420 or 1421:

   ```bash
   lsof -ti:1420,1421 | xargs kill -9
   ```

2. **Instances Not Starting**: Check the terminal output for errors. You may need to restart the script.

3. **Visual Styles Not Applied**: Refresh the app window or restart the instances.

## Implementation Details

The dual instance feature works by:

1. Setting different window titles for each instance through the tauri.conf.json file
2. Using the window title to determine the role in the frontend
3. Applying CSS themes based on the detected role
4. Using different ports for each dev server instance

The implementation minimizes changes to the existing codebase and focuses on configuration rather than code changes.

## Troubleshooting Common Issues

### Error: Failed to resolve import "@tauri-apps/api/tauri"

If you encounter this error, it means there's an issue with the Tauri API import. This has been fixed in the current implementation by using window title detection instead of direct Tauri API calls.

### Error: Window title not changing

If the window title isn't changing as expected:

1. Make sure the scripts/set-window-title.js file exists and has execute permissions
2. Check if there's a backup file (tauri.conf.json.bak) that needs to be cleaned up
3. Run `npm run restore-config` to reset the configuration and try again

### Error: Multiple instances not starting

If you're having trouble starting multiple instances:

1. Make sure no other processes are using ports 1420 or 1421
2. Check if there are any existing Tauri processes running
3. Try running the instances manually using Method 3 in the "How to Run Dual Instances" section
