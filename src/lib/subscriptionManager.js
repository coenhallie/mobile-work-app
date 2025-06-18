/**
 * Subscription Manager
 *
 * Centralized management of WebSocket subscriptions to prevent conflicts
 * and ensure proper cleanup.
 */

import { subscriptionDiagnostics } from './subscriptionDiagnostics';
import { chatDiagnostics } from './chatDiagnosticCommands';

class SubscriptionManager {
  constructor() {
    this.activeSubscriptions = new Map(); // roomId -> subscription info
    this.pendingSubscriptions = new Map(); // roomId -> promise
    this.cleanupPromises = new Map(); // roomId -> cleanup promise
  }

  /**
   * Get or create a subscription for a room
   * Ensures only one subscription per room exists
   */
  async getOrCreateSubscription(roomId, subscriptionFactory) {
    chatDiagnostics.logSubscriptionLifecycle(
      roomId,
      'MANAGER_GET_OR_CREATE_STARTED',
      {
        hasExisting: this.activeSubscriptions.has(roomId),
        hasPending: this.pendingSubscriptions.has(roomId),
        hasCleanupInProgress: this.cleanupPromises.has(roomId),
      }
    );

    // If cleanup is in progress, wait for it to complete
    if (this.cleanupPromises.has(roomId)) {
      chatDiagnostics.logSubscriptionLifecycle(
        roomId,
        'WAITING_FOR_CLEANUP',
        {}
      );
      await this.cleanupPromises.get(roomId);
    }

    // If subscription already exists and is healthy, return it
    const existing = this.activeSubscriptions.get(roomId);
    if (existing && this.isSubscriptionHealthy(existing)) {
      chatDiagnostics.logSubscriptionLifecycle(
        roomId,
        'RETURNING_EXISTING_SUBSCRIPTION',
        {
          status: existing.status,
          createdAt: existing.createdAt,
        }
      );
      return existing.channel;
    }

    // If subscription creation is already in progress, wait for it
    if (this.pendingSubscriptions.has(roomId)) {
      chatDiagnostics.logSubscriptionLifecycle(
        roomId,
        'WAITING_FOR_PENDING_SUBSCRIPTION',
        {}
      );
      return await this.pendingSubscriptions.get(roomId);
    }

    // Clean up any existing unhealthy subscription
    if (existing) {
      chatDiagnostics.logSubscriptionLifecycle(
        roomId,
        'CLEANING_UP_UNHEALTHY_SUBSCRIPTION',
        {
          status: existing.status,
        }
      );
      await this.cleanupSubscription(roomId);
    }

    // Create new subscription
    const subscriptionPromise = this.createNewSubscription(
      roomId,
      subscriptionFactory
    );
    this.pendingSubscriptions.set(roomId, subscriptionPromise);

    try {
      const channel = await subscriptionPromise;
      this.pendingSubscriptions.delete(roomId);
      return channel;
    } catch (error) {
      this.pendingSubscriptions.delete(roomId);
      throw error;
    }
  }

  /**
   * Create a new subscription
   */
  async createNewSubscription(roomId, subscriptionFactory) {
    chatDiagnostics.logSubscriptionLifecycle(
      roomId,
      'CREATING_NEW_SUBSCRIPTION',
      {}
    );

    try {
      const channel = await subscriptionFactory();

      if (!channel) {
        throw new Error('Subscription factory returned null/undefined');
      }

      // Store subscription info
      const subscriptionInfo = {
        channel,
        roomId,
        createdAt: new Date().toISOString(),
        status: 'PENDING',
        lastActivity: new Date().toISOString(),
      };

      this.activeSubscriptions.set(roomId, subscriptionInfo);

      // Wrap the channel to track status changes
      this.wrapChannelForTracking(channel, roomId);

      chatDiagnostics.logSubscriptionLifecycle(
        roomId,
        'NEW_SUBSCRIPTION_CREATED',
        {
          channelExists: !!channel,
        }
      );

      return channel;
    } catch (error) {
      chatDiagnostics.logSubscriptionLifecycle(
        roomId,
        'SUBSCRIPTION_CREATION_FAILED',
        {
          error: error.message,
        }
      );
      throw error;
    }
  }

  /**
   * Wrap channel to track status changes
   */
  wrapChannelForTracking(channel, roomId) {
    if (!channel.subscribe) return;

    const originalSubscribe = channel.subscribe.bind(channel);
    channel.subscribe = (callback) => {
      return originalSubscribe((status, error) => {
        // Update our tracking
        const subscriptionInfo = this.activeSubscriptions.get(roomId);
        if (subscriptionInfo) {
          subscriptionInfo.status = status;
          subscriptionInfo.lastActivity = new Date().toISOString();
          if (error) {
            subscriptionInfo.error = error;
          }
        }

        chatDiagnostics.logSubscriptionLifecycle(
          roomId,
          'SUBSCRIPTION_STATUS_UPDATED',
          {
            status,
            error: error?.message || error,
          }
        );

        // Call original callback
        if (callback) callback(status, error);
      });
    };
  }

  /**
   * Check if a subscription is healthy
   */
  isSubscriptionHealthy(subscriptionInfo) {
    if (!subscriptionInfo || !subscriptionInfo.channel) {
      return false;
    }

    // Check if subscription is in a good state
    const healthyStatuses = ['SUBSCRIBED', 'PENDING'];
    const isStatusHealthy = healthyStatuses.includes(subscriptionInfo.status);

    // Check if subscription is not too old without activity
    const now = new Date().getTime();
    const lastActivity = new Date(subscriptionInfo.lastActivity).getTime();
    const isNotStale = now - lastActivity < 300000; // 5 minutes

    return isStatusHealthy && isNotStale;
  }

  /**
   * Clean up a subscription
   */
  async cleanupSubscription(roomId) {
    chatDiagnostics.logSubscriptionLifecycle(roomId, 'CLEANUP_STARTED', {});

    const subscriptionInfo = this.activeSubscriptions.get(roomId);
    if (!subscriptionInfo) {
      chatDiagnostics.logSubscriptionLifecycle(
        roomId,
        'CLEANUP_NO_SUBSCRIPTION_FOUND',
        {}
      );
      return;
    }

    // Create cleanup promise to prevent concurrent cleanups
    const cleanupPromise = this.performCleanup(roomId, subscriptionInfo);
    this.cleanupPromises.set(roomId, cleanupPromise);

    try {
      await cleanupPromise;
    } finally {
      this.cleanupPromises.delete(roomId);
    }
  }

  /**
   * Perform the actual cleanup
   */
  async performCleanup(roomId, subscriptionInfo) {
    try {
      if (
        subscriptionInfo.channel &&
        typeof subscriptionInfo.channel.unsubscribe === 'function'
      ) {
        await subscriptionInfo.channel.unsubscribe();
        chatDiagnostics.logSubscriptionLifecycle(
          roomId,
          'CHANNEL_UNSUBSCRIBED',
          {}
        );
      }
    } catch (error) {
      chatDiagnostics.logSubscriptionLifecycle(roomId, 'CLEANUP_ERROR', {
        error: error.message,
      });
      // Don't throw - cleanup should be best effort
    } finally {
      this.activeSubscriptions.delete(roomId);
      subscriptionDiagnostics.removeSubscription(roomId);
      chatDiagnostics.logSubscriptionLifecycle(roomId, 'CLEANUP_COMPLETED', {});
    }
  }

  /**
   * Clean up all subscriptions
   */
  async cleanupAll() {
    chatDiagnostics.logSubscriptionLifecycle('ALL', 'CLEANUP_ALL_STARTED', {
      activeCount: this.activeSubscriptions.size,
    });

    const cleanupPromises = Array.from(this.activeSubscriptions.keys()).map(
      (roomId) => this.cleanupSubscription(roomId)
    );

    await Promise.allSettled(cleanupPromises);

    chatDiagnostics.logSubscriptionLifecycle(
      'ALL',
      'CLEANUP_ALL_COMPLETED',
      {}
    );
  }

  /**
   * Get diagnostic information
   */
  getDiagnosticInfo() {
    return {
      activeSubscriptions: Array.from(this.activeSubscriptions.entries()).map(
        ([roomId, info]) => ({
          roomId,
          status: info.status,
          createdAt: info.createdAt,
          lastActivity: info.lastActivity,
          isHealthy: this.isSubscriptionHealthy(info),
        })
      ),
      pendingSubscriptions: Array.from(this.pendingSubscriptions.keys()),
      cleanupInProgress: Array.from(this.cleanupPromises.keys()),
    };
  }

  /**
   * Force refresh a subscription
   */
  async refreshSubscription(roomId, subscriptionFactory) {
    chatDiagnostics.logSubscriptionLifecycle(
      roomId,
      'FORCE_REFRESH_STARTED',
      {}
    );

    await this.cleanupSubscription(roomId);
    return await this.getOrCreateSubscription(roomId, subscriptionFactory);
  }
}

// Global instance
export const subscriptionManager = new SubscriptionManager();

// Make available for debugging
if (typeof window !== 'undefined') {
  window.subscriptionManager = subscriptionManager;
}
