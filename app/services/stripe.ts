import Stripe from 'stripe'
import env from '#start/env'

export const stripe = new Stripe(env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2024-10-28.acacia',
})
