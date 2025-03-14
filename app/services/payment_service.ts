import { inject } from '@adonisjs/core'
import axios from 'axios'
import env from '#start/env'

@inject()
export class PaymentService {
  private baseURL: string
  private paystackBaseURL: string

  constructor() {
    this.baseURL = 'https://api.paystack.co'
    this.paystackBaseURL = 'https://api.paystack.co'
  }

  public async createPayment(payload: {
    email: string
    amount: number
    reference: string
    metadata: any
    callback_url?: string
  }) {
    try {
      const response = await axios.post(`${this.paystackBaseURL}/transaction/initialize`, payload, {
        headers: {
          Authorization: `Bearer ${env.get('PAYSTACK_SECRET_KEY')}`,
        },
      })

      return response.data
    } catch (error) {
      console.log(error)
      throw error
    }
  }

  public async generatePaystackSubaccount(payload: {
    business_name: string
    account_number: string
    bank_code: string
    percentage_charge: number
  }) {
    // What is required for a subaccount? business_name, bank_code, account_number, percentage_charge.
    const response = await axios.post(`${this.paystackBaseURL}/subaccount`, payload, {
      headers: {
        Authorization: `Bearer ${env.get('PAYSTACK_SECRET_KEY')}`,
      },
    })

    return response.data
  }

  public async listOfBanks() {
    const response = await axios.get(`${this.paystackBaseURL}/bank`, {
      headers: {
        Authorization: `Bearer ${env.get('PAYSTACK_SECRET_KEY')}`,
      },
    })

    return response.data
  }

  public async verifyAccountNumber(payload: { account_number: string; bank_code: string }) {
    const response = await axios.get(
      `${this.paystackBaseURL}/bank/resolve?account_number=${payload.account_number}&bank_code=${payload.bank_code}`,
      {
        headers: {
          Authorization: `Bearer ${env.get('PAYSTACK_SECRET_KEY')}`,
        },
      }
    )

    return response.data.data
  }

  public async verifyPayment(reference: string) {
    const response = await axios.get(`${this.paystackBaseURL}/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${env.get('PAYSTACK_SECRET_KEY')}`,
      },
    })

    return response.data.data
  }

  public async getPaymentDetails(reference: string) {
    const response = await axios.get(`${this.paystackBaseURL}/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${env.get('PAYSTACK_SECRET_KEY')}`,
      },
    })

    return response.data
  }
}
