import { inject } from '@adonisjs/core'

import { PaymentService } from '#services/payment_service'
import { HttpContext } from '@adonisjs/core/http'
@inject()
export default class PaymentsController {
  paymentservice: PaymentService
  constructor() {
    this.paymentservice = new PaymentService()
  }

  @inject()
  async listOfBanks({ response }: HttpContext) {
    try {
      const banks = await this.paymentservice.listOfBanks()
      return response.ok({
        success: true,
        data: banks,
        error: null,
        meta: { timestamp: new Date().toISOString() },
      })
    } catch (error) {
      return response.badRequest({
        success: false,
        data: null,
        error: error,
      })
    }
  }

  @inject()
  async verifyAccountNumber({ request, response }: HttpContext) {
    try {
      const payload = request.all()
      const accountNumber = payload.account_number
      const bankCode = payload.bank_code

      const accountNumberDetails = await this.paymentservice.verifyAccountNumber({
        account_number: accountNumber,
        bank_code: bankCode,
      })
      console.log(accountNumberDetails)
      return response.ok({
        success: true,
        data: accountNumberDetails,
        error: null,
        meta: { timestamp: new Date().toISOString() },
      })
    } catch (error) {
      console.log(error)
      return response.badRequest({
        success: false,
        data: null,
        error: error,
      })
    }
  }
}
