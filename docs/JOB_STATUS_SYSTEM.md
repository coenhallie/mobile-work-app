# Job Status System Documentation

## Overview

The job status system is a core component of the mobile work application, managing the lifecycle of jobs from creation to completion. This document explains the job status workflow, how UI components work together, and how to extend the system in the future.

## Job Status Workflow

Jobs in the system follow a defined workflow through the following statuses:

1. **OPEN**

   - Initial status when a job is created by a client
   - Visible to all contractors in the "Available Opportunities" section
   - Contractors can apply for these jobs

2. **ASSIGNED**

   - Status after a contractor applies for and is assigned to a job
   - Contractor can see this job in their "Current Jobs" list
   - Contractor can start working on the job
   - client sees this in their "Active Projects" list with "Awaiting Start" status

3. **IN_PROGRESS**

   - Status after a contractor starts working on the job
   - Contractor can mark the job as complete when finished
   - client sees this in their "Active Projects" list with "In Progress" status

4. **COMPLETED**

   - Status after a contractor marks the job as complete
   - Client can review the completed work on-site and finalize the job
   - Appears in the client's "Active Projects" list with a "Finalize Job" action

5. **FINALIZED**
   - Final status after the client approves the work and finalizes the job
   - Job is considered complete and payment is processed
   - Job no longer appears in active lists

## UI Components Architecture

The job status system is implemented through several interconnected components:

### Data Layer

1. **Job Store (`src/stores/job.js`)**

   - Central data store using Pinia
   - Defines job status constants and transitions
   - Provides actions for status changes:
     - `applyToJob`: OPEN → ASSIGNED
     - `markJobInProgress`: ASSIGNED → IN_PROGRESS
     - `markJobCompleted`: IN_PROGRESS → COMPLETED
     - `finalizeJob`: COMPLETED → FINALIZED
   - Manages job filtering and fetching based on status

2. **Router Navigation Guard (`src/router/index.js`)**
   - Ensures users can only access appropriate views based on their role
   - Redirects unauthenticated users to login

### UI Components

1. **HomeView (`src/views/HomeView.vue`)**

   - Entry point with conditional rendering based on user type:
     - Contractors see "In-Progress Jobs" and "New Opportunities"
     - clients see "Active Projects"
     - Both see action cards for navigation

2. **JobList (`src/components/jobs/JobList.vue`)**

   - Reusable component for displaying job lists
   - Handles loading, error, and empty states
   - Configurable to show/hide posted by and assigned to information
   - Emits events for job viewing and actions

3. **JobStatusIndicator (`src/components/jobs/JobStatusIndicator.vue`)**

   - Visual indicator of job status with appropriate colors
   - Maps status codes to human-readable labels

4. **JobActionButton (`src/components/jobs/JobActionButton.vue`)**

   - Context-aware button that shows appropriate actions based on:
     - Current job status
     - User role (contractor or client)
   - Emits action events to parent components

5. **ContractorDashboardView (`src/views/ContractorDashboardView.vue`)**
   - Specialized view for contractors
   - Shows current jobs and available opportunities
   - Includes filtering capabilities

## Status Transition Logic

### For Contractors:

- Can apply for OPEN jobs → job becomes ASSIGNED
- Can start ASSIGNED jobs → job becomes IN_PROGRESS
- Can complete IN_PROGRESS jobs → job becomes COMPLETED
- Must wait for client to finalize during COMPLETED status

### For clients:

- Can finalize COMPLETED jobs → job becomes FINALIZED
- Must wait during ASSIGNED and IN_PROGRESS statuses

## Extending the System

### Adding New Job Statuses

1. Add the new status to the `JOB_STATUS` object in `src/stores/job.js`:

   ```javascript
   export const JOB_STATUS = {
     // Existing statuses...
     NEW_STATUS: 'new_status',
   };
   ```

2. Update the `JobStatusIndicator.vue` component:

   - Add a label in the `statusLabel` computed property
   - Add appropriate colors in the `statusColor` and `textColor` computed properties

3. Update the `JobActionButton.vue` component:

   - Add conditional rendering for the new status
   - Define appropriate actions for each user role

4. Add any new actions to the job store:

   ```javascript
   async function markJobNewStatus(jobId) {
     return updateJobStatus(jobId, JOB_STATUS.NEW_STATUS);
   }

   // Don't forget to expose the new function in the return statement
   ```

### Adding New User Roles

1. Update the role validator in `JobActionButton.vue`:

   ```javascript
   validator: (value) => ['contractor', 'client', 'admin', 'new_role'].includes(value),
   ```

2. Add conditional rendering for the new role in `JobActionButton.vue` and `HomeView.vue`

3. Update the router navigation guard in `router/index.js` to handle the new role's permissions

### Adding New Job Properties

1. Update the database schema to include the new property

2. Update the `addJob` function in the job store to include the new property

3. Update the `JobList.vue` component to display the new property

## Legacy Status Handling

There was a legacy status `pending_assignment` that was renamed to `assigned`. The system has been updated to handle this legacy status:

1. **UI Components**: The `JobStatusIndicator` and `JobActionButton` components have been updated to handle the legacy status, treating it the same as `assigned`.

2. **Database Migration**: A migration script (`supabase/migrations/20250412_update_legacy_job_status.sql`) has been created to update any jobs with the legacy status to the current status.

3. **Documentation**: The `JOB_STATUS` enum in `src/stores/job.js` includes a comment about the legacy status.

If you encounter any jobs with the legacy status, they should be automatically handled by the UI components, but it's recommended to run the migration script to update the database for consistency.

## Best Practices

1. **Status Transitions**: Always use the provided store actions for status transitions to ensure consistency and proper event handling.

2. **Component Reuse**: Leverage the existing components when building new features. The `JobList`, `JobStatusIndicator`, and `JobActionButton` components are designed to be reusable.

3. **Role-Based Access**: Always check user roles before displaying actions or allowing status changes.

4. **Error Handling**: All status change operations should include proper error handling to maintain system integrity.

5. **Testing**: When adding new statuses or transitions, ensure comprehensive testing of all possible paths through the workflow.

6. **Status Consistency**: Always use the constants defined in the `JOB_STATUS` enum for status values. Avoid hardcoding status strings.
