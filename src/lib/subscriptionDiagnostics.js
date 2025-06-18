/**
 * Subscription Diagnostics Utility
 *
 * This utility helps diagnose WebSocket subscription issues in the chat system.
 */

export class SubscriptionDiagnostics {
  constructor() {
    this.activeSubscriptions = new Map();
    this.subscriptionEvents = [];
    this.messageEvents = [];
  }

  logSubscriptionEvent(roomId, event, data = {}) {
    const timestamp = new Date().toISOString();
    const eventData = {
      timestamp,
      roomId,
      event,
      data,
      activeSubscriptionsCount: this.activeSubscriptions.size,
    };

    this.subscriptionEvents.push(eventData);
    console.log(
      `[SubscriptionDiagnostics] ${event} for room ${roomId}:`,
      eventData
    );

    // Keep only last 50 events
    if (this.subscriptionEvents.length > 50) {
      this.subscriptionEvents = this.subscriptionEvents.slice(-50);
    }
  }

  logMessageEvent(roomId, messageId, event, data = {}) {
    const timestamp = new Date().toISOString();
    const eventData = {
      timestamp,
      roomId,
      messageId,
      event,
      data,
    };

    this.messageEvents.push(eventData);
    console.log(
      `[SubscriptionDiagnostics] Message ${event} for room ${roomId}:`,
      eventData
    );

    // Keep only last 100 message events
    if (this.messageEvents.length > 100) {
      this.messageEvents = this.messageEvents.slice(-100);
    }
  }

  trackSubscription(roomId, channel) {
    if (this.activeSubscriptions.has(roomId)) {
      this.logSubscriptionEvent(roomId, 'DUPLICATE_SUBSCRIPTION_DETECTED', {
        warning: 'Multiple subscriptions for the same room detected',
      });
    }

    this.activeSubscriptions.set(roomId, {
      channel,
      createdAt: new Date().toISOString(),
      status: 'PENDING',
    });

    this.logSubscriptionEvent(roomId, 'SUBSCRIPTION_TRACKED');
  }

  updateSubscriptionStatus(roomId, status, error = null) {
    const subscription = this.activeSubscriptions.get(roomId);
    if (subscription) {
      subscription.status = status;
      subscription.lastStatusUpdate = new Date().toISOString();
      if (error) {
        subscription.error = error;
      }
    }

    this.logSubscriptionEvent(roomId, 'SUBSCRIPTION_STATUS_UPDATED', {
      status,
      error,
    });
  }

  removeSubscription(roomId) {
    const removed = this.activeSubscriptions.delete(roomId);
    this.logSubscriptionEvent(roomId, 'SUBSCRIPTION_REMOVED', {
      wasTracked: removed,
    });
    return removed;
  }

  getActiveSubscriptions() {
    return Array.from(this.activeSubscriptions.entries()).map(
      ([roomId, data]) => ({
        roomId,
        ...data,
      })
    );
  }

  getDiagnosticReport() {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60000);

    const recentSubscriptionEvents = this.subscriptionEvents.filter(
      (event) => new Date(event.timestamp) > oneMinuteAgo
    );

    const recentMessageEvents = this.messageEvents.filter(
      (event) => new Date(event.timestamp) > oneMinuteAgo
    );

    return {
      timestamp: now.toISOString(),
      activeSubscriptions: this.getActiveSubscriptions(),
      recentSubscriptionEvents,
      recentMessageEvents,
      summary: {
        totalActiveSubscriptions: this.activeSubscriptions.size,
        recentSubscriptionEvents: recentSubscriptionEvents.length,
        recentMessageEvents: recentMessageEvents.length,
        duplicateSubscriptions: recentSubscriptionEvents.filter(
          (e) => e.event === 'DUPLICATE_SUBSCRIPTION_DETECTED'
        ).length,
      },
    };
  }

  checkForIssues() {
    const issues = [];

    // Check for duplicate subscriptions
    if (this.activeSubscriptions.size > 5) {
      issues.push({
        type: 'TOO_MANY_SUBSCRIPTIONS',
        severity: 'WARNING',
        message: `${this.activeSubscriptions.size} active subscriptions detected`,
        recommendation: 'Check for subscription cleanup issues',
      });
    }

    // Check for failed subscriptions
    const failedSubscriptions = Array.from(
      this.activeSubscriptions.values()
    ).filter(
      (sub) => sub.status === 'CHANNEL_ERROR' || sub.status === 'TIMED_OUT'
    );

    if (failedSubscriptions.length > 0) {
      issues.push({
        type: 'FAILED_SUBSCRIPTIONS',
        severity: 'ERROR',
        message: `${failedSubscriptions.length} failed subscriptions detected`,
        recommendation: 'Check authentication and network connectivity',
      });
    }

    // Check for subscriptions without recent message events
    const oneMinuteAgo = new Date(Date.now() - 60000);
    const recentMessageEvents = this.messageEvents.filter(
      (event) => new Date(event.timestamp) > oneMinuteAgo
    );

    if (this.activeSubscriptions.size > 0 && recentMessageEvents.length === 0) {
      issues.push({
        type: 'NO_RECENT_MESSAGE_EVENTS',
        severity: 'WARNING',
        message: 'Active subscriptions but no recent message events',
        recommendation: 'Check if subscriptions are receiving events properly',
      });
    }

    return issues;
  }

  reset() {
    this.activeSubscriptions.clear();
    this.subscriptionEvents = [];
    this.messageEvents = [];
    console.log('[SubscriptionDiagnostics] Reset completed');
  }
}

// Global instance
export const subscriptionDiagnostics = new SubscriptionDiagnostics();

// Helper function to add diagnostics to existing subscription code
export function wrapSubscriptionWithDiagnostics(roomId, subscriptionFunction) {
  return async (...args) => {
    subscriptionDiagnostics.logSubscriptionEvent(
      roomId,
      'SUBSCRIPTION_SETUP_STARTED'
    );

    try {
      const result = await subscriptionFunction(...args);

      if (result && typeof result.subscribe === 'function') {
        subscriptionDiagnostics.trackSubscription(roomId, result);

        // Wrap the original subscribe method
        const originalSubscribe = result.subscribe.bind(result);
        result.subscribe = (callback) => {
          return originalSubscribe((status, error) => {
            subscriptionDiagnostics.updateSubscriptionStatus(
              roomId,
              status,
              error
            );
            if (callback) callback(status, error);
          });
        };
      }

      subscriptionDiagnostics.logSubscriptionEvent(
        roomId,
        'SUBSCRIPTION_SETUP_COMPLETED'
      );
      return result;
    } catch (error) {
      subscriptionDiagnostics.logSubscriptionEvent(
        roomId,
        'SUBSCRIPTION_SETUP_FAILED',
        { error: error.message }
      );
      throw error;
    }
  };
}
