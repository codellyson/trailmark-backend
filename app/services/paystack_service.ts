import env from '#start/env'
import axios from 'axios'
import { createHash } from 'node:crypto'
export default class PaystackService {
  private baseUrl = 'https://api.paystack.co'
  private secretKey = env.get('PAYSTACK_SECRET_KEY')

  private get headers() {
    return {
      'Authorization': `Bearer ${this.secretKey}`,
      'Content-Type': 'application/json',
      'x-paystack-signature': createHash('sha512')
        .update(env.get('PAYSTACK_WEBHOOK_SECRET')!)
        .digest('hex'),
    }
  }

  /**
   * Initialize payment
   */
  async initializePayment({
    amount,
    email,
    reference,
    metadata,
    callbackUrl,
  }: {
    amount: number
    email: string
    reference: string
    metadata?: Record<string, any>
    callbackUrl: string
  }) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/transaction/initialize`,
        {
          amount: amount * 100, // Convert to kobo
          email,
          reference,
          callback_url: callbackUrl,
          metadata,
        },
        { headers: this.headers }
      )

      return {
        success: true,
        data: response.data.data,
        error: null,
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error.response?.data?.message || 'Payment initialization failed',
      }
    }
  }

  /**
   * Verify payment
   */
  async verifyPayment(reference: string) {
    try {
      const response = await axios.get(`${this.baseUrl}/transaction/verify/${reference}`, {
        headers: this.headers,
      })

      return {
        success: true,
        data: response.data.data,
        error: null,
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error.response?.data?.message || 'Payment verification failed',
      }
    }
  }
}
