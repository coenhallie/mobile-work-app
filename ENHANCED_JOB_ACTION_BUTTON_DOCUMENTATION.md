# Enhanced JobActionButton Component Documentation

## Overview

The enhanced `JobActionButton` component implements a three-tier action hierarchy system based on the Job Action Prominence Design Plan. It provides context-aware action prioritization, enhanced visual hierarchy, and mobile-first responsive design.

## Key Features

### 🎯 Three-Tier Action Hierarchy

- **Primary Actions**: Large, prominent buttons (48px height) for critical workflow actions
- **Secondary Actions**: Medium buttons (40px height) for important but non-critical actions
- **Tertiary Actions**: Smaller buttons (32px height) for optional actions in overflow menus

### 🧠 Context-Aware Logic

- Intelligent action prioritization based on job status and user role
- Time sensitivity and urgency indicators
- Conditional action display based on job state

### 📱 Mobile-First Design

- Touch-friendly targets (minimum 44px for mobile)
- Responsive layout adaptations
- Overflow menus for constrained spaces
- Swipe gesture support (planned)

### ♿ Accessibility

- ARIA labels and keyboard navigation
- High contrast mode support
- Screen reader compatibility
- Focus management

## Props

### Core Props

```typescript
interface JobActionButtonProps {
  job: Object; // Required: Job object with status, id, etc.
  userRole: 'contractor' | 'client' | 'admin'; // Required: User's role
  hasAppliedProp?: boolean; // Optional: Override application status
  isJobDetailsView?: boolean; // Optional: Show additional actions
}
```

### Enhanced Props

```typescript
interface EnhancedProps {
  actionPriority?: 'auto' | 'primary' | 'secondary' | 'tertiary';
  showSecondaryActions?: boolean; // Default: true
  showTertiaryActions?: boolean; // Default: false
  maxSecondaryActions?: number; // Default: 2
  compactMode?: boolean; // Default: false
  urgencyLevel?: 'low' | 'normal' | 'high' | 'urgent'; // Default: 'normal'
}
```

## Events

```typescript
interface Events {
  action: (actionType: string) => void; // Primary action events
  applied: (data: { applicationId: string }) => void; // Application success
  'application-error': (error: string) => void; // Application errors
  'secondary-action': (actionType: string) => void; // Secondary action tracking
}
```

## Action Definitions

### Contractor Actions

#### Open Jobs

- **Primary**: Apply (urgent priority)
- **Secondary**: View Details, Save Job
- **State**: Shows "You've Applied" when already applied

#### Assigned Jobs

- **Primary**: Start Job (urgent priority)
- **Secondary**: View Details, Message Client
- **Visual**: Urgent styling with animation

#### In Progress Jobs

- **Primary**: Mark Complete (high priority)
- **Secondary**: View Details, Message Client
- **Tertiary**: Upload Progress

#### Completed Jobs

- **Status**: Awaiting Review (disabled state)
- **Secondary**: View Details, Message Client

### Client Actions

#### Open Jobs

- **Primary**: View Applications (if has applications) OR Edit Job
- **Secondary**: View Details, Promote Job
- **Tertiary**: Cancel Job

#### Assigned Jobs

- **Primary**: View Progress
- **Secondary**: Message Contractor, View Details

#### Completed Jobs

- **Primary**: Review Work (urgent priority)
- **Secondary**: Message Contractor, View Details

#### In Review Jobs

- **Primary**: Finalize Job (urgent priority)
- **Secondary**: Request Changes, Message Contractor

## Usage Examples

### Basic Usage

```vue
<template>
  <JobActionButton :job="job" :user-role="userRole" @action="handleAction" />
</template>
```

### Enhanced Usage with All Features

```vue
<template>
  <JobActionButton
    :job="job"
    :user-role="userRole"
    :urgency-level="getUrgencyLevel(job)"
    :show-secondary-actions="true"
    :show-tertiary-actions="isJobDetailsView"
    :compact-mode="isMobile"
    :max-secondary-actions="2"
    @action="handleAction"
    @secondary-action="trackSecondaryAction"
    @applied="handleApplicationSuccess"
    @application-error="handleApplicationError"
  />
</template>

<script setup>
const handleAction = (actionType) => {
  switch (actionType) {
    case 'start':
      startJob();
      break;
    case 'complete':
      markJobComplete();
      break;
    case 'review':
      openReviewModal();
      break;
    // ... handle other actions
  }
};

const getUrgencyLevel = (job) => {
  if (job.deadline && isNearDeadline(job.deadline)) {
    return 'urgent';
  }
  if (job.status === 'completed' || job.status === 'assigned') {
    return 'high';
  }
  return 'normal';
};
</script>
```

### Mobile/Compact Mode

```vue
<template>
  <JobActionButton
    :job="job"
    :user-role="userRole"
    :compact-mode="true"
    :max-secondary-actions="1"
    @action="handleAction"
  />
</template>
```

## Styling Customization

### CSS Custom Properties

```css
.job-action-container {
  --primary-action-height: 48px;
  --secondary-action-height: 40px;
  --tertiary-action-height: 32px;
  --mobile-touch-target: 44px;
}
```

### Responsive Breakpoints

- **Mobile**: < 768px (stacked layout, larger touch targets)
- **Tablet**: 768px - 1024px (hybrid layout)
- **Desktop**: > 1024px (full horizontal layout with hover effects)

## Integration with Job Cards

### ClientJobCard Integration

```vue
<template>
  <div class="job-card">
    <!-- Job content -->
    <div class="job-actions">
      <JobActionButton
        :job="job"
        user-role="client"
        :urgency-level="getJobUrgency(job)"
        :show-secondary-actions="!compactView"
        @action="handleJobAction"
      />
    </div>
  </div>
</template>
```

### ContractorJobCard Integration

```vue
<template>
  <div class="job-card">
    <!-- Job content -->
    <div class="job-actions">
      <JobActionButton
        :job="job"
        user-role="contractor"
        :has-applied-prop="hasApplied"
        :urgency-level="getContractorUrgency(job)"
        @action="handleContractorAction"
        @applied="updateApplicationStatus"
      />
    </div>
  </div>
</template>
```

## Performance Considerations

### Lazy Loading

- Icons are loaded on-demand
- Overflow menus render only when needed
- Event listeners are properly cleaned up

### State Management

- Minimal re-renders with computed properties
- Efficient action state tracking
- Debounced action handlers

## Testing

### Unit Tests

```javascript
// Test action hierarchy
expect(getActionSize('primary')).toBe('lg');
expect(getActionSize('secondary')).toBe('default');

// Test urgency levels
expect(getActionVariant({ urgency: 'urgent' })).toBe('default');
expect(getPrimaryActionClasses({ urgency: 'urgent' })).toContain(
  'urgent-action'
);

// Test responsive behavior
expect(visibleSecondaryActions.value).toHaveLength(1); // compact mode
```

### Integration Tests

```javascript
// Test action emissions
await wrapper.find('.primary-action-button').trigger('click');
expect(wrapper.emitted('action')).toEqual([['start']]);

// Test overflow menu
await wrapper.find('.overflow-menu-button').trigger('click');
expect(wrapper.find('.overflow-dropdown').isVisible()).toBe(true);
```

## Migration Guide

### From Old Component

```vue
<!-- Old -->
<Button
  v-if="job.status === 'assigned'"
  size="sm"
  @click="handleAction('start')"
>
  Start Job
</Button>

<!-- New -->
<JobActionButton :job="job" :user-role="userRole" @action="handleAction" />
```

### Backward Compatibility

- All existing props are supported
- Event signatures remain the same
- Styling can be gradually migrated

## Best Practices

### Action Priority

1. Use `urgencyLevel="urgent"` for time-sensitive actions
2. Limit secondary actions to 2-3 for optimal UX
3. Reserve tertiary actions for job details view

### Mobile Optimization

1. Always test with `compactMode` enabled
2. Ensure touch targets meet 44px minimum
3. Consider gesture-based interactions

### Accessibility

1. Provide meaningful `aria-label` attributes
2. Test with screen readers
3. Ensure keyboard navigation works

## Troubleshooting

### Common Issues

#### Actions Not Showing

- Check job status matches action definitions
- Verify user role is correct
- Ensure job object has required properties

#### Styling Issues

- Verify Tailwind CSS classes are available
- Check for CSS conflicts with existing styles
- Test responsive behavior across breakpoints

#### Performance Issues

- Limit number of secondary actions
- Use `compactMode` for mobile
- Implement proper event cleanup

## Future Enhancements

### Planned Features

- Swipe gesture support for mobile
- Bulk action capabilities
- Advanced animation system
- Voice command integration
- Offline action queuing

### Extensibility

- Custom action definitions
- Plugin system for additional actions
- Theme customization API
- Analytics integration hooks
