import type { HttpContext } from '@adonisjs/core/http'

export default class WebhooksController {
  async paystackWebhook(ctx: HttpContext) {
    console.log(ctx.request.body())

    // Handle photographer fees and escrow for photography addons
    // for (const detail of addonDetails) {
    //   if (detail.type === 'photography' && detail.photographer_id) {
    //     const photographerFee = detail.total

    //     // Create escrow for photographer payment
    //     await EscrowAccount.create(
    //       {
    //         event_id: Number(event.id),
    //         photographer_id: detail.photographer_id,
    //         amount: photographerFee,
    //         status: 'held',
    //         held_at: DateTime.now(),
    //         release_date: event.date,
    //         metadata: {
    //           payment_id: payment.id,
    //           addon_id: detail.addon_id,
    //           customer_id: auth.user!.id,
    //           completed_at: DateTime.now().toISO(),
    //           deliverables: [],
    //         },
    //       },
    //       { client: trx }
    //     )

    //     // Confirm addon sale
    //     const addon = await Addon.findOrFail(detail.addon_id)
    //     await addon.confirmSale(detail.quantity)
    //   }
    // }

    // // Update organizer's wallet
    // const organizerShare = totalAmount - totalAmount * 0.1 // Minus platform fee
    // const organizerWallet = await Wallet.firstOrCreate(
    //   { user_id: event.organizer_id },
    //   {
    //     user_id: event.organizer_id,
    //     available_balance: 0,
    //     pending_balance: 0,
    //   }
    // )

    // await organizerWallet.addTransaction({
    //   type: 'event_payment_received',
    //   amount: organizerShare,
    //   status: 'completed',
    //   reference_type: 'event_payment',
    //   reference_id: payment.id,
    //   metadata: {
    //     event_id: Number(event.id),
    //     customer_id: auth.user!.id,
    //     platform_fee: totalAmount * 0.1,
    //     addons: addonDetails,
    //   },
    // })

    // // Update payment status
    // payment.status = 'completed'
    // payment.paidAt = DateTime.now()
    // await payment.save()

    ctx.response.status(200).send('Webhook received')
  }
}
