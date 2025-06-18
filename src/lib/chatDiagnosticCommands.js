/**
 * Chat Diagnostic Commands
 *
 * Provides diagnostic commands to investigate real-time messaging issues
 */

import { subscriptionDiagnostics } from './subscriptionDiagnostics';

export class ChatDiagnosticCommands {
  constructor() {
    this.isEnabled = true;
  }

  /**
   * Enable diagnostic logging
   */
  enable() {
    this.isEnabled = true;
    console.log('[ChatDiagnostics] Diagnostic logging enabled');
  }

  /**
   * Disable diagnostic logging
   */
  disable() {
    this.isEnabled = false;
    console.log('[ChatDiagnostics] Diagnostic logging disabled');
  }

  /**
   * Log subscription lifecycle events
   */
  logSubscriptionLifecycle(roomId, event, data = {}) {
    if (!this.isEnabled) return;

    const timestamp = new Date().toISOString();
    console.log(`[ChatDiagnostics] SUBSCRIPTION_LIFECYCLE - ${event}`, {
      timestamp,
      roomId,
      event,
      data,
      stackTrace: new Error().stack,
    });
  }

  /**
   * Log component lifecycle events
   */
  logComponentLifecycle(componentName, event, data = {}) {
    if (!this.isEnabled) return;

    const timestamp = new Date().toISOString();
    console.log(`[ChatDiagnostics] COMPONENT_LIFECYCLE - ${event}`, {
      timestamp,
      componentName,
      event,
      data,
      stackTrace: new Error().stack,
    });
  }

  /**
   * Log message flow events
   */
  logMessageFlow(roomId, event, messageData = {}) {
    if (!this.isEnabled) return;

    const timestamp = new Date().toISOString();
    console.log(`[ChatDiagnostics] MESSAGE_FLOW - ${event}`, {
      timestamp,
      roomId,
      event,
      messageData,
      messageId: messageData.id,
      messageType: messageData.message_type,
      senderId: messageData.sender_user_id,
    });
  }

  /**
   * Log WebSocket events
   */
  logWebSocketEvent(roomId, event, data = {}) {
    if (!this.isEnabled) return;

    const timestamp = new Date().toISOString();
    console.log(`[ChatDiagnostics] WEBSOCKET - ${event}`, {
      timestamp,
      roomId,
      event,
      data,
    });
  }

  /**
   * Log reactivity issues
   */
  logReactivityIssue(roomId, issue, data = {}) {
    if (!this.isEnabled) return;

    const timestamp = new Date().toISOString();
    console.warn(`[ChatDiagnostics] REACTIVITY_ISSUE - ${issue}`, {
      timestamp,
      roomId,
      issue,
      data,
    });
  }

  /**
   * Get comprehensive diagnostic report
   */
  getDiagnosticReport() {
    const subscriptionReport = subscriptionDiagnostics.getDiagnosticReport();
    const issues = subscriptionDiagnostics.checkForIssues();

    return {
      timestamp: new Date().toISOString(),
      subscriptionDiagnostics: subscriptionReport,
      detectedIssues: issues,
      recommendations: this.generateRecommendations(issues),
    };
  }

  /**
   * Generate recommendations based on detected issues
   */
  generateRecommendations(issues) {
    const recommendations = [];

    issues.forEach((issue) => {
      switch (issue.type) {
        case 'TOO_MANY_SUBSCRIPTIONS':
          recommendations.push({
            priority: 'HIGH',
            action: 'Check subscription cleanup in ChatInterface component',
            details: 'Multiple subscriptions detected - likely cleanup issue',
          });
          break;
        case 'FAILED_SUBSCRIPTIONS':
          recommendations.push({
            priority: 'CRITICAL',
            action: 'Check authentication and RLS policies',
            details: 'Subscriptions failing - auth or permission issue',
          });
          break;
        case 'NO_RECENT_MESSAGE_EVENTS':
          recommendations.push({
            priority: 'MEDIUM',
            action: 'Check database function integration',
            details: 'Subscriptions active but not receiving events',
          });
          break;
      }
    });

    return recommendations;
  }

  /**
   * Test subscription setup for a specific room
   */
  async testSubscriptionSetup(roomId, chatStore) {
    console.log(
      `[ChatDiagnostics] Testing subscription setup for room: ${roomId}`
    );

    try {
      // Check current subscriptions
      const activeSubscriptions =
        subscriptionDiagnostics.getActiveSubscriptions();
      console.log(
        '[ChatDiagnostics] Current active subscriptions:',
        activeSubscriptions
      );

      // Test subscription creation
      const subscription = await chatStore.subscribeToMessages(roomId);
      console.log('[ChatDiagnostics] Subscription created:', !!subscription);

      // Wait a moment and check status
      setTimeout(() => {
        const updatedSubscriptions =
          subscriptionDiagnostics.getActiveSubscriptions();
        console.log(
          '[ChatDiagnostics] Updated subscriptions:',
          updatedSubscriptions
        );
      }, 2000);

      return subscription;
    } catch (error) {
      console.error('[ChatDiagnostics] Subscription test failed:', error);
      throw error;
    }
  }

  /**
   * Monitor message reception for a specific time period
   */
  monitorMessageReception(roomId, durationMs = 30000) {
    console.log(
      `[ChatDiagnostics] Starting message reception monitoring for room ${roomId} for ${durationMs}ms`
    );

    const startTime = Date.now();
    const receivedMessages = [];

    // Store original console.log to capture subscription events
    const originalLog = console.log;
    console.log = (...args) => {
      if (
        args[0] &&
        args[0].includes &&
        args[0].includes('Real-time message received')
      ) {
        receivedMessages.push({
          timestamp: new Date().toISOString(),
          args: args,
        });
      }
      originalLog.apply(console, args);
    };

    // Restore console.log after monitoring period
    setTimeout(() => {
      console.log = originalLog;
      console.log(
        `[ChatDiagnostics] Message reception monitoring completed for room ${roomId}`
      );
      console.log(
        `[ChatDiagnostics] Messages received during monitoring:`,
        receivedMessages
      );
    }, durationMs);
  }
}

// Global instance
export const chatDiagnostics = new ChatDiagnosticCommands();

// Make available globally for debugging
if (typeof window !== 'undefined') {
  window.chatDiagnostics = chatDiagnostics;
}
