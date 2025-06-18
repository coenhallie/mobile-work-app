# Unread Message Notification System

## Overview

This document describes the implementation of the proper unread message notification system that replaces the basic time-based detection with actual unread message counting.

## Features Implemented

### 1. Real-time Unread Message Tracking

- **Actual unread count calculation** based on `read_at` field in messages
- **Per-room unread tracking** with individual counts for each chat room
- **Total unread count** aggregated across all rooms
- **Real-time updates** when new messages arrive via Supabase subscriptions

### 2. Enhanced Navigation Badge

- **Red notification badge** on Messages tab in bottom navigation
- **Unread count display** showing actual number (e.g., "3", "12", "99+")
- **Dynamic visibility** - badge appears/disappears based on unread status
- **Responsive design** - proper positioning and sizing for mobile

### 3. Message Read Status Management

- **Automatic read marking** when user opens a conversation
- **Database synchronization** - updates `read_at` field in Supabase
- **Local state updates** - immediate UI feedback without waiting for database
- **Proper filtering** - only marks messages from other users as read

## Technical Implementation

### Chat Store Enhancements (`src/stores/chat.js`)

#### New State Variables

```javascript
const _unreadCounts = ref({}); // Track unread message counts per room
```

#### New Computed Properties

```javascript
const unreadCounts = computed(() => _unreadCounts.value);
const totalUnreadCount = computed(() =>
  Object.values(_unreadCounts.value).reduce((total, count) => total + count, 0)
);
const hasUnreadMessages = computed(() => totalUnreadCount.value > 0);
```

#### New Functions

- `calculateUnreadCount(roomId)` - Calculates unread messages for a specific room
- `updateUnreadCount(roomId)` - Updates the unread count for a room
- `refreshUnreadCounts()` - Refreshes unread counts for all rooms

#### Enhanced Functions

- `fetchMessages()` - Now updates unread counts when messages are loaded
- `markMessagesAsRead()` - Updates both database and local state
- `subscribeToMessages()` - Updates unread counts when new messages arrive
- `fetchChatRooms()` - Fetches messages for all rooms to calculate initial unread counts

### Navigation Component Updates (`src/components/navigation/MobileBottomNavigation.vue`)

#### Replaced Time-based Detection

```javascript
// OLD: Basic time-based detection
const hasUnreadMessages = computed(() => {
  // Check for rooms created in last 24 hours
  const recentChatRooms = chatStore.chatRooms.filter((room) => {
    const timeDiff = new Date() - new Date(room.created_at);
    return timeDiff < 24 * 60 * 60 * 1000;
  });
  return recentChatRooms.length > 0;
});

// NEW: Actual unread message tracking
const hasUnreadMessages = computed(() => {
  if (!props.isSignedIn) return false;
  return chatStore.hasUnreadMessages;
});

const totalUnreadCount = computed(() => {
  if (!props.isSignedIn) return 0;
  return chatStore.totalUnreadCount;
});
```

#### Enhanced Badge Display

```html
<!-- OLD: Simple red dot -->
<div class="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>

<!-- NEW: Count badge -->
<div
  class="min-w-[18px] h-[18px] bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse"
>
  {{ totalUnreadCount > 99 ? '99+' : totalUnreadCount }}
</div>
```

### Conversation View Updates (`src/views/ConversationView.vue`)

#### Automatic Read Marking

```javascript
async function fetchRoomDetails() {
  // Fetch messages
  await chatStore.fetchMessages(roomId.value);

  // Mark messages as read when opening conversation
  await chatStore.markMessagesAsRead(roomId.value);

  // Continue with room details...
}
```

### Bug Fixes

#### ChatInterface Component (`src/components/chat/ChatInterface.vue`)

Fixed channel cleanup error:

```javascript
// Fixed unsubscribe method call
if (messageChannel) {
  messageChannel.unsubscribe();
}
```

## How It Works

### 1. Initial Load

1. User signs in and chat rooms are fetched
2. Messages are loaded for each room
3. Unread counts are calculated based on `read_at` field
4. Navigation badge displays total unread count

### 2. Real-time Updates

1. New message arrives via Supabase subscription
2. Message is added to local state
3. Unread count is recalculated for the room
4. Navigation badge updates immediately

### 3. Reading Messages

1. User opens a conversation
2. `markMessagesAsRead()` is called automatically
3. Database is updated with `read_at` timestamp
4. Local state is updated immediately
5. Unread count for that room becomes 0
6. Navigation badge updates

### 4. Cross-room Tracking

1. Each room maintains its own unread count
2. Total count is sum of all room counts
3. Badge shows total across all conversations
4. Individual room counts available for future features

## Database Schema Requirements

The system relies on the existing `chat_messages` table structure:

```sql
-- Required fields for unread tracking
chat_messages (
  id UUID PRIMARY KEY,
  room_id UUID REFERENCES chat_rooms(id),
  sender_user_id UUID,
  content TEXT,
  created_at TIMESTAMP,
  read_at TIMESTAMP NULL  -- Key field for unread tracking
)
```

## Testing

### Manual Testing

1. **Initial State**: Badge should not appear when no unread messages
2. **New Messages**: Badge appears when receiving messages from others
3. **Read Messages**: Badge updates when opening conversations
4. **Multiple Rooms**: Badge shows total count across all rooms
5. **Real-time**: Badge updates immediately without page refresh

### Test Script

Use the provided `test-notification-system.js` script:

```javascript
// Run in browser console
testUnreadMessageSystem();
```

## Performance Considerations

### Optimizations Implemented

- **Shallow reactivity** for message arrays to reduce re-renders
- **Computed properties** for efficient unread count calculations
- **Debounced updates** to prevent excessive recalculations
- **Selective message fetching** only when needed

### Memory Management

- **Proper cleanup** of Supabase subscriptions
- **Cache management** for message data
- **State reset** when users sign out

## Future Enhancements

### Potential Improvements

1. **Per-room badges** in messages list view
2. **Push notification integration** with unread counts
3. **Unread message indicators** within conversations
4. **Mark all as read** functionality
5. **Unread count persistence** across app restarts

### FCM Integration Points

The system is designed to integrate with Firebase Cloud Messaging:

- Unread counts can be included in push notifications
- Badge counts can be synchronized with system notifications
- Real-time updates work alongside push notifications

## Troubleshooting

### Common Issues

1. **Badge not appearing**: Check if user is signed in and has chat rooms
2. **Count not updating**: Verify Supabase real-time subscriptions are working
3. **Incorrect counts**: Check `read_at` field updates in database
4. **Performance issues**: Monitor message fetching and unread calculations

### Debug Tools

- Browser console logs with `[ChatStore]` prefix
- Test script for state inspection
- Vue DevTools for reactive state monitoring

## Conclusion

The unread message notification system provides a robust, real-time solution for tracking unread messages across all chat conversations. It replaces the previous time-based approach with actual message read status tracking, providing accurate and immediate feedback to users about new messages.

The implementation is scalable, performant, and integrates seamlessly with the existing chat infrastructure while providing a foundation for future notification enhancements.
