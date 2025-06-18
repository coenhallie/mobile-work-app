# Store Migration Guide

This guide explains how to migrate from the monolithic job store to the new split store architecture for better code splitting and bundle size optimization.

## Overview of Changes

The large `useJobStore` has been split into focused, smaller stores:

1. **`useJobStore`** - Core job management (CRUD operations, status updates, filtering)
2. **`useJobApplicationsStore`** - Job application management
3. **`useJobImagesStore`** - Job image upload and management
4. **`useUnifiedNotifications`** - Unified notification system (composable)

## Migration Steps

### 1. Job Applications

**Before:**

```javascript
import { useJobStore } from '@/stores/job';

const jobStore = useJobStore();

// Apply to job
await jobStore.applyToJob(jobId, contractorId, message);

// Get applications
await jobStore.getJobApplications(jobId);
const applications = jobStore.jobApplications;

// Select contractor
await jobStore.selectContractor(jobId, applicationId);

// Mark as read
await jobStore.markJobApplicationsAsRead(jobId);
await jobStore.markApplicationAsRead(applicationId);

// Check unread
const hasUnread = await jobStore.hasUnreadApplications(jobId);
```

**After:**

```javascript
import { useJobApplicationsStore } from '@/stores/jobApplications';

const jobApplicationsStore = useJobApplicationsStore();

// Apply to job
await jobApplicationsStore.applyToJob(jobId, contractorId, message);

// Get applications
await jobApplicationsStore.getJobApplications(jobId);
const applications = jobApplicationsStore.jobApplications;

// Select contractor
await jobApplicationsStore.selectContractor(jobId, applicationId);

// Mark as read
await jobApplicationsStore.markJobApplicationsAsRead(jobId);
await jobApplicationsStore.markApplicationAsRead(applicationId);

// Check unread
const hasUnread = await jobApplicationsStore.hasUnreadApplications(jobId);
```

### 2. Job Images

**Before:**

```javascript
import { useJobStore } from '@/stores/job';

const jobStore = useJobStore();

// Upload image
const imageUrl = await jobStore.uploadJobImage(file, jobId);

// Remove photo
await jobStore.removePhotoFromJob(jobId, photoUrl);
```

**After:**

```javascript
import { useJobImagesStore } from '@/stores/jobImages';

const jobImagesStore = useJobImagesStore();

// Upload image
const imageUrl = await jobImagesStore.uploadJobImage(file, jobId);

// Remove photo
await jobImagesStore.removePhotoFromJob(jobId, photoUrl);
```

### 3. Notifications

**Before:**

```javascript
import { useFCM } from '@/composables/useFCM';
import { useLocalNotifications } from '@/composables/useLocalNotifications';
import { usePushNotifications } from '@/composables/usePushNotifications';
import { useTauriNotifications } from '@/composables/useTauriNotifications';

// Multiple imports and complex setup...
```

**After:**

```javascript
import {
  useUnifiedNotifications,
  NotificationPresets,
} from '@/composables/useUnifiedNotifications';

const notifications = useUnifiedNotifications();

// Initialize once
await notifications.initialize({
  appId: 'your-onesignal-app-id',
  onNotificationReceived: (notification) => {
    console.log('Received:', notification);
  },
  onNotificationClicked: (notification) => {
    console.log('Clicked:', notification);
  },
});

// Request permission
await notifications.requestPermission();

// Send notification
await notifications.sendNotification({
  title: 'Hello',
  body: 'World',
  onClick: () => console.log('Notification clicked!'),
});

// Use presets
await notifications.sendNotification(
  NotificationPresets.jobApplication('Plumbing Job', 'John Doe')
);

// Register device for push notifications
await notifications.registerDevice(userId);

// Add tags for segmentation
await notifications.sendTag('user_type', 'contractor');
```

## Dynamic Imports for Stores

To further optimize bundle size, you can dynamically import stores only when needed:

### Lazy Loading Job Applications

```javascript
// In a component that handles job applications
export default {
  async mounted() {
    // Only load job applications store when needed
    const { useJobApplicationsStore } = await import(
      '@/stores/jobApplications'
    );
    this.jobApplicationsStore = useJobApplicationsStore();
  },
};
```

### Lazy Loading Job Images

```javascript
// In a component that handles image uploads
const handleImageUpload = async (file, jobId) => {
  // Only load images store when uploading
  const { useJobImagesStore } = await import('@/stores/jobImages');
  const jobImagesStore = useJobImagesStore();

  return await jobImagesStore.uploadJobImage(file, jobId);
};
```

### Lazy Loading Notifications

```javascript
// In a component that sends notifications
const sendJobNotification = async (jobData) => {
  // Only load notifications when sending
  const { useUnifiedNotifications, NotificationPresets } = await import(
    '@/composables/useUnifiedNotifications'
  );
  const notifications = useUnifiedNotifications();

  await notifications.sendNotification(
    NotificationPresets.jobApplication(jobData.title, jobData.contractor)
  );
};
```

## Component Updates

### Job Details Component

**Before:**

```vue
<script setup>
import { useJobStore } from '@/stores/job';

const jobStore = useJobStore();

const applyToJob = async () => {
  await jobStore.applyToJob(jobId, contractorId, message);
};

const getApplications = async () => {
  await jobStore.getJobApplications(jobId);
};
</script>
```

**After:**

```vue
<script setup>
import { useJobStore } from '@/stores/job';
import { useJobApplicationsStore } from '@/stores/jobApplications';

const jobStore = useJobStore();
const jobApplicationsStore = useJobApplicationsStore();

const applyToJob = async () => {
  await jobApplicationsStore.applyToJob(jobId, contractorId, message);
};

const getApplications = async () => {
  await jobApplicationsStore.getJobApplications(jobId);
};
</script>
```

### Job Form Component

**Before:**

```vue
<script setup>
import { useJobStore } from '@/stores/job';

const jobStore = useJobStore();

const uploadImages = async (files) => {
  const urls = [];
  for (const file of files) {
    const url = await jobStore.uploadJobImage(file, jobId);
    if (url) urls.push(url);
  }
  return urls;
};
</script>
```

**After:**

```vue
<script setup>
import { useJobStore } from '@/stores/job';
import { useJobImagesStore } from '@/stores/jobImages';

const jobStore = useJobStore();
const jobImagesStore = useJobImagesStore();

const uploadImages = async (files) => {
  const urls = [];
  for (const file of files) {
    const url = await jobImagesStore.uploadJobImage(file, jobId);
    if (url) urls.push(url);
  }
  return urls;
};
</script>
```

## Benefits of the New Architecture

1. **Smaller Initial Bundle**: Only load the stores you need
2. **Better Code Splitting**: Each store can be loaded independently
3. **Improved Maintainability**: Focused, single-responsibility stores
4. **Enhanced Performance**: Reduced memory usage and faster initial load
5. **Better Tree Shaking**: Unused store functionality is eliminated from the bundle

## Backward Compatibility

The main `useJobStore` still includes some functions for backward compatibility, but these are marked as deprecated. Update your code to use the new stores for optimal performance.

## Testing the Migration

After migrating, test that:

1. Job applications still work correctly
2. Image uploads function properly
3. Notifications are sent and received
4. Bundle size has decreased
5. Initial page load is faster

## Bundle Analysis

To verify the improvements, run:

```bash
npm run build
npx vite-bundle-analyzer dist
```

This will show you the bundle composition and verify that code splitting is working correctly.
