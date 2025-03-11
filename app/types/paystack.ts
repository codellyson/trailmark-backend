export type PaystackCustomer = {
  id: number
  first_name: string
  last_name: string
  email: string
  customer_code: string
  phone?: string
  metadata?: any
  risk_action?: string
}

export type PaystackMetadata = {
  payment_type: 'vendor_registration' | string
  event_organiser_id: number
  event_vendor_id: number
  event_vendor_service_id: number
  vendor_id: number
  event_id: number
  [key: string]: any
}

export type PaystackTransaction = {
  id: number
  status: string
  reference: string
  amount: number
  currency: string
  channel: string
  paid_at: string
  created_at: string
  metadata: PaystackMetadata
  customer: PaystackCustomer
  authorization: {
    authorization_code: string
    card_type: string
    last4: string
    exp_month: string
    exp_year: string
    bin: string
    bank: string
    brand: string
    [key: string]: any
  }
  [key: string]: any
}

export type PaystackWebhookEvent = {
  event: 'charge.success' | 'transfer.success' | 'transfer.failed' | string
  data: PaystackTransaction
}
