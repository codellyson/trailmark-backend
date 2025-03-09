import { inject } from '@adonisjs/core'
import axios from 'axios'
import env from '#start/env'

@inject()
export class PaymentService {
  private baseURL: string

  constructor() {
    this.baseURL = 'https://api.paystack.co/transaction/initialize'
  }

  public async createPayment(payload: { email: string; amount: number; reference: string }) {
    const response = await axios.post(this.baseURL, payload, {
      headers: {
        Authorization: `Bearer ${env.get('PAYSTACK_SECRET_KEY')}`,
      },
    })
  }

  public async verifyPayment(reference: string) {
    const response = await axios.get(`${this.baseURL}/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${env.get('PAYSTACK_SECRET_KEY')}`,
      },
    })

    return response.data
  }

  public async getPaymentDetails(reference: string) {
    const response = await axios.get(`${this.baseURL}/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${env.get('PAYSTACK_SECRET_KEY')}`,
      },
    })
  }
}
