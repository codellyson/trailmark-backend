import type { HttpContext } from '@adonisjs/core/http'
import TicketCustomQuestion from '#models/custom_question'
import {
  createCustomQuestionValidator,
  updateCustomQuestionValidator,
} from '#validators/custom_question'

export default class CustomQuestionsController {
  /**
   * Get all custom questions for a ticket
   */
  async index({ params, response }: HttpContext) {
    const ticketId = params.ticket_id
    const questions = await TicketCustomQuestion.query().where(
      'custom_questions',
      'like',
      `%${ticketId}%`
    )

    return response.ok({
      success: true,
      data: questions,
      error: null,
      meta: { timestamp: new Date().toISOString() },
    })
  }

  /**
   * Create a new custom question
   */
  async store({ request, response }: HttpContext) {
    const payload = await request.validateUsing(createCustomQuestionValidator)
    const question = await TicketCustomQuestion.create({
      custom_questions: payload.custom_questions,
      event_id: payload.event_id,
    })

    return response.created({
      success: true,
      data: question,
      error: null,
      meta: { timestamp: new Date().toISOString() },
    })
  }

  /**
   * Get a specific custom question
   */
  async show({ params, response }: HttpContext) {
    const question = await TicketCustomQuestion.findOrFail(params.id)

    return response.ok({
      success: true,
      data: question,
      error: null,
      meta: { timestamp: new Date().toISOString() },
    })
  }

  /**
   * Update a custom question
   */
  async update({ params, request, response }: HttpContext) {
    const question = await TicketCustomQuestion.findOrFail(params.id)
    const payload = await request.validateUsing(updateCustomQuestionValidator)

    await question
      .merge({
        custom_questions: payload.custom_questions,
      })
      .save()

    return response.ok({
      success: true,
      data: question,
      error: null,
      meta: { timestamp: new Date().toISOString() },
    })
  }

  /**
   * Delete a custom question
   */
  async destroy({ params, response }: HttpContext) {
    const question = await TicketCustomQuestion.findOrFail(params.id)
    await question.delete()

    return response.ok({
      success: true,
      data: null,
      error: null,
      meta: { timestamp: new Date().toISOString() },
    })
  }
}
