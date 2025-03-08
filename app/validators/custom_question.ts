import vine from '@vinejs/vine'

export const createCustomQuestionValidator = vine.compile(
  vine.object({
    event_id: vine.number(),
    custom_questions: vine
      .array(
        vine.object({
          question: vine.string(),
          type: vine.string(),
          required: vine.boolean(),
          options: vine.array(vine.string()),
          tickets: vine.array(vine.string()),
        })
      )
      .optional(),
  })
)

export const updateCustomQuestionValidator = vine.compile(
  vine.object({
    custom_questions: vine
      .array(
        vine.object({
          id: vine.string(),
          question: vine.string(),
          type: vine.string(),
          required: vine.boolean(),
          options: vine.array(vine.string()),
          tickets: vine.array(vine.string()),
        })
      )
      .optional(),
  })
)
