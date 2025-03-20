import { inject } from '@adonisjs/core'
import type { ServiceAccount } from 'firebase-admin'
import { getMessaging } from 'firebase-admin/messaging'
import { initializeApp, type App } from 'firebase-admin/app'
import { cert } from 'firebase-admin/app'
import env from '#start/env'
import NotificationToken from '#models/notification_token'
import User from '#models/user'

let firebaseApp: App | undefined

@inject()
export default class NotificationService {
  constructor() {
    // Initialize Firebase Admin SDK if not already initialized
    if (!firebaseApp) {
      const serviceAccount = JSON.parse(env.get('FIREBASE_SERVICE_ACCOUNT')) as ServiceAccount
      firebaseApp = initializeApp({
        credential: cert(serviceAccount),
      })
    }
  }

  /**
   * Subscribe a user's device to push notifications
   */
  public async subscribe(userId: number, token: string, deviceType: 'android' | 'ios' | 'web') {
    // Deactivate any existing tokens for this device type
    await NotificationToken.query()
      .where('user_id', userId)
      .where('device_type', deviceType)
      .update({ is_active: false })

    // Create new token
    const notificationToken = await NotificationToken.create({
      user_id: userId,
      token,
      device_type: deviceType,
      is_active: true,
    })

    // Update user preferences to enable push notifications if not already enabled
    await User.query()
      .where('id', userId)
      .whereRaw("(preferences->>'receive_push_notifications')::boolean = false")
      .update({
        preferences: {
          receive_push_notifications: true,
        },
      })

    return notificationToken
  }

  /**
   * Unsubscribe a device from push notifications
   */
  public async unsubscribe(userId: number, token: string) {
    await NotificationToken.query()
      .where('user_id', userId)
      .where('token', token)
      .update({ is_active: false })

    // If no active tokens remain, update user preferences
    const activeTokens = await NotificationToken.query()
      .where('user_id', userId)
      .where('is_active', true)
      .count('* as count')

    if (Number(activeTokens[0].$extras.count) === 0) {
      await User.query()
        .where('id', userId)
        .update({
          preferences: {
            receive_push_notifications: false,
          },
        })
    }
  }

  /**
   * Send a push notification to a specific user
   */
  public async sendToUser(
    userId: number,
    notification: {
      title: string
      body: string
      data?: Record<string, string>
    }
  ) {
    const tokens = await NotificationToken.query().where('user_id', userId).where('is_active', true)

    if (tokens.length === 0) return

    const messaging = getMessaging(firebaseApp)

    const message = {
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: notification.data || {},
      tokens: tokens.map((t) => t.token),
    }

    try {
      const response = await messaging.sendEachForMulticast(message)

      // Handle failed tokens
      if (response.failureCount > 0) {
        const failedTokens = tokens.filter((_, index) => !response.responses[index].success)
        await NotificationToken.query()
          .whereIn(
            'token',
            failedTokens.map((t) => t.token)
          )
          .update({ is_active: false })
      }

      return response
    } catch (error) {
      console.error('Error sending notification:', error)
      throw error
    }
  }

  /**
   * Send a push notification to multiple users
   */
  public async sendToUsers(
    userIds: number[],
    notification: {
      title: string
      body: string
      data?: Record<string, string>
    }
  ) {
    const tokens = await NotificationToken.query()
      .whereIn('user_id', userIds)
      .where('is_active', true)

    if (tokens.length === 0) return

    const messaging = getMessaging(firebaseApp)

    const message = {
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: notification.data || {},
      tokens: tokens.map((t) => t.token),
    }

    try {
      const response = await messaging.sendEachForMulticast(message)

      // Handle failed tokens
      if (response.failureCount > 0) {
        const failedTokens = tokens.filter((_, index) => !response.responses[index].success)
        await NotificationToken.query()
          .whereIn(
            'token',
            failedTokens.map((t) => t.token)
          )
          .update({ is_active: false })
      }

      return response
    } catch (error) {
      console.error('Error sending notification:', error)
      throw error
    }
  }
}
