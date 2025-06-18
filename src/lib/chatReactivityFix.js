/**
 * Chat Reactivity Fix
 *
 * This module addresses Vue reactivity issues in the chat system where:
 * 1. Messages are received via WebSocket but UI doesn't update
 * 2. Subscription errors with undefined error messages
 * 3. Poor error reporting and diagnostics
 */

import { nextTick } from 'vue';
import { createLogger } from './loggerService';

const logger = createLogger('ChatReactivityFix');

class ChatReactivityManager {
  constructor() {
    this.reactivityIssues = [];
    this.messageUpdateQueue = [];
    this.isProcessingQueue = false;
  }

  /**
   * Enhanced message addition with multiple reactivity approaches
   */
  async addMessageWithReactivity(messagesRef, roomId, newMessage) {
    logger.info('Adding message with enhanced reactivity', {
      roomId,
      messageId: newMessage.id,
      messageType: newMessage.message_type,
    });

    try {
      // Ensure messages array exists for this room
      if (!messagesRef.value[roomId]) {
        logger.info('Creating new messages array for room', { roomId });
        messagesRef.value[roomId] = [];
      }

      // Check for duplicates
      const existingMessage = messagesRef.value[roomId].find(
        (msg) => msg.id === newMessage.id
      );

      if (existingMessage) {
        logger.warn('Message already exists, skipping duplicate', {
          roomId,
          messageId: newMessage.id,
        });
        return false;
      }

      // Get current messages and create new array
      const currentMessages = messagesRef.value[roomId] || [];
      const newMessages = [...currentMessages, newMessage];

      logger.info('Applying reactivity update', {
        roomId,
        oldCount: currentMessages.length,
        newCount: newMessages.length,
        messageId: newMessage.id,
      });

      // Method 1: Direct assignment with new array
      messagesRef.value[roomId] = newMessages;

      // Method 2: Force reactivity by creating completely new object
      const newMessagesState = { ...messagesRef.value };
      newMessagesState[roomId] = newMessages;
      messagesRef.value = newMessagesState;

      // Method 3: Use Vue's nextTick to ensure DOM updates
      await nextTick();

      // Method 4: Trigger additional reactivity if needed
      if (typeof window !== 'undefined' && window.Vue?.nextTick) {
        await window.Vue.nextTick();
      }

      // Verify the update was successful
      const finalCount = messagesRef.value[roomId]?.length || 0;
      const updateSuccessful = finalCount === newMessages.length;

      if (!updateSuccessful) {
        logger.error('Reactivity update failed', {
          roomId,
          expectedCount: newMessages.length,
          actualCount: finalCount,
          messageId: newMessage.id,
        });

        // Try alternative reactivity approach
        await this.forceReactivityUpdate(messagesRef, roomId, newMessages);
      } else {
        logger.info('Reactivity update successful', {
          roomId,
          finalCount,
          messageId: newMessage.id,
        });
      }

      return true;
    } catch (error) {
      logger.error('Error adding message with reactivity', {
        roomId,
        messageId: newMessage.id,
        error: error.message,
      });

      this.reactivityIssues.push({
        timestamp: new Date().toISOString(),
        roomId,
        messageId: newMessage.id,
        error: error.message,
        type: 'ADD_MESSAGE_ERROR',
      });

      throw error;
    }
  }

  /**
   * Force reactivity update using alternative methods
   */
  async forceReactivityUpdate(messagesRef, roomId, newMessages) {
    logger.info('Attempting force reactivity update', { roomId });

    try {
      // Method 1: Complete re-assignment
      const allMessages = { ...messagesRef.value };
      allMessages[roomId] = [...newMessages];
      messagesRef.value = {};
      await nextTick();
      messagesRef.value = allMessages;
      await nextTick();

      // Method 2: Trigger change detection
      const tempValue = messagesRef.value;
      messagesRef.value = null;
      await nextTick();
      messagesRef.value = tempValue;
      await nextTick();

      // Verify the fix worked
      const finalCount = messagesRef.value[roomId]?.length || 0;
      if (finalCount === newMessages.length) {
        logger.info('Force reactivity update successful', {
          roomId,
          finalCount,
        });
        return true;
      } else {
        logger.error('Force reactivity update failed', {
          roomId,
          expectedCount: newMessages.length,
          actualCount: finalCount,
        });
        return false;
      }
    } catch (error) {
      logger.error('Force reactivity update error', {
        roomId,
        error: error.message,
      });
      return false;
    }
  }

  /**
   * Enhanced room update with reactivity fixes
   */
  async updateRoomWithReactivity(roomsRef, roomId, updateData) {
    logger.info('Updating room with enhanced reactivity', {
      roomId,
      updateData,
    });

    try {
      const roomIndex = roomsRef.value.findIndex((room) => room.id === roomId);

      if (roomIndex === -1) {
        logger.warn('Room not found for update', { roomId });
        return false;
      }

      // Create new rooms array with updated room
      const newRooms = [...roomsRef.value];
      newRooms[roomIndex] = { ...newRooms[roomIndex], ...updateData };

      // Apply reactivity update
      roomsRef.value = newRooms;
      await nextTick();

      // Re-sort if needed (for latest message updates)
      if (updateData.updated_at || updateData.latestMessage) {
        roomsRef.value.sort(
          (a, b) => new Date(b.updated_at) - new Date(a.updated_at)
        );
        await nextTick();
      }

      logger.info('Room update successful', { roomId });
      return true;
    } catch (error) {
      logger.error('Error updating room with reactivity', {
        roomId,
        error: error.message,
      });
      return false;
    }
  }

  /**
   * Queue-based message processing to prevent race conditions
   */
  async queueMessageUpdate(messagesRef, roomId, newMessage) {
    return new Promise((resolve, reject) => {
      this.messageUpdateQueue.push({
        messagesRef,
        roomId,
        newMessage,
        resolve,
        reject,
        timestamp: Date.now(),
      });

      this.processMessageQueue();
    });
  }

  /**
   * Process message update queue sequentially
   */
  async processMessageQueue() {
    if (this.isProcessingQueue || this.messageUpdateQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    try {
      while (this.messageUpdateQueue.length > 0) {
        const update = this.messageUpdateQueue.shift();

        try {
          const result = await this.addMessageWithReactivity(
            update.messagesRef,
            update.roomId,
            update.newMessage
          );
          update.resolve(result);
        } catch (error) {
          update.reject(error);
        }

        // Small delay to prevent overwhelming the reactivity system
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
    } finally {
      this.isProcessingQueue = false;
    }
  }

  /**
   * Enhanced error reporting with better diagnostics
   */
  createEnhancedErrorHandler(context = 'unknown') {
    return (error, additionalInfo = {}) => {
      const enhancedError = {
        timestamp: new Date().toISOString(),
        context,
        message: error?.message || 'Unknown error',
        code: error?.code || 'UNKNOWN',
        details: error?.details || null,
        hint: error?.hint || null,
        stack: error?.stack || null,
        additionalInfo,
        userAgent:
          typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
        url: typeof window !== 'undefined' ? window.location.href : 'server',
      };

      logger.error('Enhanced error report', enhancedError);

      // Store error for diagnostics
      this.reactivityIssues.push({
        ...enhancedError,
        type: 'ENHANCED_ERROR',
      });

      return enhancedError;
    };
  }

  /**
   * Validate message structure before processing
   */
  validateMessage(message) {
    // Base required fields for all message types
    const baseRequiredFields = ['id', 'sender_user_id', 'created_at'];
    const missingBaseFields = baseRequiredFields.filter(
      (field) => !message[field]
    );

    if (missingBaseFields.length > 0) {
      throw new Error(
        `Invalid message structure. Missing fields: ${missingBaseFields.join(', ')}`
      );
    }

    // Additional validation for base fields
    if (typeof message.id !== 'string' || message.id.length === 0) {
      throw new Error('Message ID must be a non-empty string');
    }

    // Message type specific validation
    const messageType = message.message_type || 'text';

    switch (messageType) {
      case 'image':
        // Image messages should have image_url and can have empty content
        if (!message.image_url || typeof message.image_url !== 'string') {
          throw new Error('Image messages must have a valid image_url');
        }
        // Content should be a string (can be empty for images)
        if (typeof message.content !== 'string') {
          throw new Error('Message content must be a string');
        }
        break;

      case 'budget_proposal':
        // Budget proposal messages should have budget_data and can have empty content
        if (!message.budget_data || typeof message.budget_data !== 'object') {
          throw new Error(
            'Budget proposal messages must have valid budget_data'
          );
        }
        // Content should be a string (can be empty for budget proposals)
        if (typeof message.content !== 'string') {
          throw new Error('Message content must be a string');
        }
        break;

      case 'text':
      default:
        // Text messages must have non-empty content
        if (
          !message.content ||
          typeof message.content !== 'string' ||
          message.content.trim().length === 0
        ) {
          throw new Error('Text messages must have non-empty content');
        }
        break;
    }

    return true;
  }

  /**
   * Get reactivity diagnostics
   */
  getDiagnostics() {
    return {
      reactivityIssues: this.reactivityIssues,
      queueLength: this.messageUpdateQueue.length,
      isProcessingQueue: this.isProcessingQueue,
      summary: {
        totalIssues: this.reactivityIssues.length,
        errorTypes: [
          ...new Set(this.reactivityIssues.map((issue) => issue.type)),
        ],
        recentIssues: this.reactivityIssues.filter(
          (issue) => Date.now() - new Date(issue.timestamp).getTime() < 60000 // Last minute
        ).length,
      },
    };
  }

  /**
   * Clear old diagnostics data
   */
  clearOldDiagnostics(maxAge = 300000) {
    // 5 minutes
    const cutoff = Date.now() - maxAge;
    this.reactivityIssues = this.reactivityIssues.filter(
      (issue) => new Date(issue.timestamp).getTime() > cutoff
    );
  }

  /**
   * Test reactivity system
   */
  async testReactivity(messagesRef, testRoomId = 'test-reactivity') {
    logger.info('Testing reactivity system', { testRoomId });

    const testMessage = {
      id: `test-${Date.now()}`,
      content: 'Reactivity test message',
      sender_user_id: 'test-user',
      created_at: new Date().toISOString(),
      message_type: 'text',
    };

    try {
      const result = await this.addMessageWithReactivity(
        messagesRef,
        testRoomId,
        testMessage
      );

      // Clean up test data
      if (messagesRef.value[testRoomId]) {
        messagesRef.value[testRoomId] = messagesRef.value[testRoomId].filter(
          (msg) => msg.id !== testMessage.id
        );
      }

      logger.info('Reactivity test completed', { result });
      return result;
    } catch (error) {
      logger.error('Reactivity test failed', { error: error.message });
      throw error;
    }
  }
}

// Create singleton instance
const chatReactivityManager = new ChatReactivityManager();

export default chatReactivityManager;

// Export utility functions
export const addMessageWithReactivity = (messagesRef, roomId, newMessage) =>
  chatReactivityManager.addMessageWithReactivity(
    messagesRef,
    roomId,
    newMessage
  );

export const updateRoomWithReactivity = (roomsRef, roomId, updateData) =>
  chatReactivityManager.updateRoomWithReactivity(roomsRef, roomId, updateData);

export const queueMessageUpdate = (messagesRef, roomId, newMessage) =>
  chatReactivityManager.queueMessageUpdate(messagesRef, roomId, newMessage);

export const createEnhancedErrorHandler = (context) =>
  chatReactivityManager.createEnhancedErrorHandler(context);

export const validateMessage = (message) =>
  chatReactivityManager.validateMessage(message);

export const getReactivityDiagnostics = () =>
  chatReactivityManager.getDiagnostics();
