import { inject } from '@adonisjs/core'

import axios from 'axios'
import env from '#start/env'

@inject()
class PaymentsService {
  private baseURL: string
  constructor() {
    this.baseURL = 'https://api.paystack.co/transaction/initialize'
  }

  public async initializePaystackPayment(payload: {
    email: string
    amount: number
    reference: string
    callback_url: string
    metadata: {
      payment_id: string
      event_id: string
      customer_id: string
    }
  }) {
    const paystackResponse = await axios.post(`${this.baseURL}`, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.get('PAYSTACK_SECRET_KEY')}`,
      },
    })

    return paystackResponse.data
  }
}

export default new PaymentsService()
