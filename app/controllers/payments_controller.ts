import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import EventPayment from '#models/event_payment'
import { DateTime } from 'luxon'
import env from '#start/env'
import PhotographyService from '#models/photography_service'
import Addon from '#models/addon'
import EscrowAccount from '#models/escrow_account'
import { createHash } from 'node:crypto'
import db from '@adonisjs/lucid/services/db'
import axios from 'axios'

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
