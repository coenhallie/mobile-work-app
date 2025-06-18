/**
 * Real-time Connection Manager
 *
 * This module provides a centralized way to manage Supabase real-time connections
 * and addresses the critical connectivity issues:
 * 1. CHANNEL_ERROR and TIMED_OUT - WebSocket subscriptions failing
 * 2. Authentication and session management for real-time
 * 3. Connection retry and error recovery
 * 4. Improved error reporting and diagnostics
 */

import { ref, computed } from 'vue';
import { createLogger } from './loggerService';

const logger = createLogger('RealtimeConnectionManager');

class RealtimeConnectionManager {
  constructor() {
    this.connections = new Map();
    this.connectionStatus = ref('disconnected');
    this.lastError = ref(null);
    this.retryAttempts = ref(0);
    this.maxRetryAttempts = 3;
    this.retryDelay = 1000; // Start with 1 second
    this.maxRetryDelay = 30000; // Max 30 seconds
    this.supabaseClient = null;
    this.authToken = ref(null);
    this.isAuthenticated = ref(false);
  }

  /**
   * Initialize the connection manager with Supabase client
   */
  initialize(supabaseClient) {
    this.supabaseClient = supabaseClient;
    this.setupAuthListener();
    logger.info('RealtimeConnectionManager initialized');
  }

  /**
   * Setup authentication listener to handle token changes
   */
  setupAuthListener() {
    if (!this.supabaseClient) {
      logger.error('Cannot setup auth listener - no Supabase client');
      return;
    }

    this.supabaseClient.auth.onAuthStateChange(async (event, session) => {
      logger.info('Auth state changed', { event, hasSession: !!session });

      if (session?.access_token) {
        this.authToken.value = session.access_token;
        this.isAuthenticated.value = true;

        // Set realtime auth
        try {
          await this.supabaseClient.realtime.setAuth(session.access_token);
          logger.info('Realtime auth token updated successfully');

          // Reconnect existing subscriptions with new auth
          await this.reconnectAllSubscriptions();
        } catch (error) {
          logger.error('Failed to set realtime auth token', {
            error: error.message,
          });
          this.lastError.value = `Auth token update failed: ${error.message}`;
        }
      } else {
        this.authToken.value = null;
        this.isAuthenticated.value = false;
        logger.warn(
          'No auth token available - real-time features may not work'
        );
      }
    });
  }

  /**
   * Create a real-time subscription with enhanced error handling and retry logic
   */
  async createSubscription(subscriptionId, config) {
    if (!this.supabaseClient) {
      throw new Error('Supabase client not initialized');
    }

    if (!this.isAuthenticated.value) {
      logger.warn('Creating subscription without authentication - may fail');
    }

    logger.info('Creating real-time subscription', { subscriptionId, config });

    // Clean up existing subscription if it exists
    await this.removeSubscription(subscriptionId);

    const subscriptionConfig = {
      retryAttempts: 0,
      maxRetries: this.maxRetryAttempts,
      status: 'connecting',
      channel: null,
      config,
      lastError: null,
      createdAt: new Date().toISOString(),
    };

    this.connections.set(subscriptionId, subscriptionConfig);

    return this.attemptSubscription(subscriptionId);
  }

  /**
   * Attempt to create a subscription with retry logic
   */
  async attemptSubscription(subscriptionId) {
    const subscription = this.connections.get(subscriptionId);
    if (!subscription) {
      throw new Error(`Subscription ${subscriptionId} not found`);
    }

    const { config } = subscription;

    try {
      logger.info('Attempting subscription', {
        subscriptionId,
        attempt: subscription.retryAttempts + 1,
      });

      // Ensure we have auth token before creating channel
      if (this.isAuthenticated.value && this.authToken.value) {
        await this.supabaseClient.realtime.setAuth(this.authToken.value);
      }

      // Create the channel
      const channel = this.supabaseClient.channel(config.channelName, {
        config: {
          private: true, // Enable RLS authorization
          broadcast: { self: false },
          ...config.channelConfig,
        },
      });

      // Add postgres changes listener
      if (config.postgresChanges) {
        channel.on('postgres_changes', config.postgresChanges, (payload) => {
          logger.info('Real-time event received', {
            subscriptionId,
            event: payload.eventType,
            table: payload.table,
          });

          if (config.onEvent) {
            try {
              config.onEvent(payload);
            } catch (error) {
              logger.error('Error in event handler', {
                subscriptionId,
                error: error.message,
              });
            }
          }
        });
      }

      // Subscribe with enhanced status handling
      const subscribePromise = new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          logger.error('Subscription timeout', { subscriptionId });
          reject(new Error('Subscription timeout'));
        }, 10000); // 10 second timeout

        channel.subscribe((status, error) => {
          clearTimeout(timeout);

          logger.info('Subscription status change', {
            subscriptionId,
            status,
            error: error?.message,
          });

          subscription.status = status;
          subscription.lastError = error?.message || null;

          if (status === 'SUBSCRIBED') {
            logger.info('Subscription successful', { subscriptionId });
            subscription.channel = channel;
            subscription.retryAttempts = 0; // Reset retry count on success
            this.connectionStatus.value = 'connected';
            resolve(channel);
          } else if (status === 'CHANNEL_ERROR') {
            logger.error('Channel error', {
              subscriptionId,
              error: error?.message,
            });
            subscription.lastError = error?.message || 'Channel error';

            // Attempt retry if we haven't exceeded max attempts
            if (subscription.retryAttempts < subscription.maxRetries) {
              this.scheduleRetry(subscriptionId);
              resolve(null); // Don't reject, we'll retry
            } else {
              reject(
                new Error(
                  `Channel error after ${subscription.maxRetries} attempts: ${error?.message}`
                )
              );
            }
          } else if (status === 'TIMED_OUT') {
            logger.error('Subscription timed out', { subscriptionId });
            subscription.lastError = 'Subscription timed out';

            if (subscription.retryAttempts < subscription.maxRetries) {
              this.scheduleRetry(subscriptionId);
              resolve(null);
            } else {
              reject(
                new Error(
                  `Subscription timed out after ${subscription.maxRetries} attempts`
                )
              );
            }
          } else if (status === 'CLOSED') {
            logger.warn('Subscription closed', { subscriptionId });
            subscription.status = 'closed';
          }
        });
      });

      return await subscribePromise;
    } catch (error) {
      logger.error('Subscription attempt failed', {
        subscriptionId,
        error: error.message,
        attempt: subscription.retryAttempts + 1,
      });

      subscription.lastError = error.message;

      if (subscription.retryAttempts < subscription.maxRetries) {
        this.scheduleRetry(subscriptionId);
        return null;
      } else {
        this.connectionStatus.value = 'error';
        this.lastError.value = error.message;
        throw error;
      }
    }
  }

  /**
   * Schedule a retry attempt with exponential backoff
   */
  scheduleRetry(subscriptionId) {
    const subscription = this.connections.get(subscriptionId);
    if (!subscription) return;

    subscription.retryAttempts++;
    const delay = Math.min(
      this.retryDelay * Math.pow(2, subscription.retryAttempts - 1),
      this.maxRetryDelay
    );

    logger.info('Scheduling retry', {
      subscriptionId,
      attempt: subscription.retryAttempts,
      delay,
    });

    setTimeout(() => {
      this.attemptSubscription(subscriptionId).catch((error) => {
        logger.error('Retry attempt failed', {
          subscriptionId,
          error: error.message,
        });
      });
    }, delay);
  }

  /**
   * Remove a subscription
   */
  async removeSubscription(subscriptionId) {
    const subscription = this.connections.get(subscriptionId);
    if (!subscription) return;

    logger.info('Removing subscription', { subscriptionId });

    if (subscription.channel) {
      try {
        await subscription.channel.unsubscribe();
      } catch (error) {
        logger.error('Error unsubscribing channel', {
          subscriptionId,
          error: error.message,
        });
      }
    }

    this.connections.delete(subscriptionId);

    // Update connection status if no active connections
    if (this.connections.size === 0) {
      this.connectionStatus.value = 'disconnected';
    }
  }

  /**
   * Reconnect all existing subscriptions (useful after auth changes)
   */
  async reconnectAllSubscriptions() {
    logger.info('Reconnecting all subscriptions', {
      count: this.connections.size,
    });

    const reconnectPromises = Array.from(this.connections.keys()).map(
      async (subscriptionId) => {
        const subscription = this.connections.get(subscriptionId);
        if (subscription && subscription.status !== 'SUBSCRIBED') {
          subscription.retryAttempts = 0; // Reset retry count
          return this.attemptSubscription(subscriptionId);
        }
      }
    );

    await Promise.allSettled(reconnectPromises);
  }

  /**
   * Get connection status for diagnostics
   */
  getConnectionStatus() {
    return {
      status: this.connectionStatus.value,
      isAuthenticated: this.isAuthenticated.value,
      hasAuthToken: !!this.authToken.value,
      lastError: this.lastError.value,
      activeConnections: this.connections.size,
      connections: Array.from(this.connections.entries()).map(([id, conn]) => ({
        id,
        status: conn.status,
        retryAttempts: conn.retryAttempts,
        lastError: conn.lastError,
        createdAt: conn.createdAt,
      })),
    };
  }

  /**
   * Force reconnect all subscriptions
   */
  async forceReconnect() {
    logger.info('Force reconnecting all subscriptions');

    // Reset connection status
    this.connectionStatus.value = 'connecting';
    this.lastError.value = null;

    // Reset retry attempts for all subscriptions
    for (const subscription of this.connections.values()) {
      subscription.retryAttempts = 0;
      if (subscription.channel) {
        try {
          await subscription.channel.unsubscribe();
        } catch (error) {
          logger.error('Error during force reconnect unsubscribe', {
            error: error.message,
          });
        }
        subscription.channel = null;
      }
    }

    await this.reconnectAllSubscriptions();
  }

  /**
   * Test connection health
   */
  async testConnection() {
    if (!this.supabaseClient) {
      throw new Error('Supabase client not initialized');
    }

    logger.info('Testing connection health');

    try {
      // Test basic API connectivity
      const { data, error } = await this.supabaseClient
        .from('chat_messages')
        .select('count')
        .limit(1);

      if (error) {
        throw new Error(`API test failed: ${error.message}`);
      }

      // Test real-time connectivity with a temporary subscription
      const testChannel = this.supabaseClient.channel('health-check', {
        config: { private: false },
      });

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          testChannel.unsubscribe();
          reject(new Error('Real-time health check timeout'));
        }, 5000);

        testChannel.subscribe((status, error) => {
          clearTimeout(timeout);
          testChannel.unsubscribe();

          if (status === 'SUBSCRIBED') {
            resolve({ api: true, realtime: true });
          } else {
            reject(
              new Error(
                `Real-time health check failed: ${status} - ${error?.message}`
              )
            );
          }
        });
      });
    } catch (error) {
      logger.error('Connection health test failed', { error: error.message });
      throw error;
    }
  }
}

// Create singleton instance
const realtimeConnectionManager = new RealtimeConnectionManager();

export default realtimeConnectionManager;

// Export computed properties for reactive access
export const connectionStatus = computed(
  () => realtimeConnectionManager.connectionStatus.value
);
export const isAuthenticated = computed(
  () => realtimeConnectionManager.isAuthenticated.value
);
export const lastError = computed(
  () => realtimeConnectionManager.lastError.value
);
