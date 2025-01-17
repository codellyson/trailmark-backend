import vine from '@vinejs/vine'

export const createEventValidator = vine.compile(
  vine.object({
    title: vine.string(),
    description: vine.string(),
    date: vine.string(),
    start_time: vine.string(),
    end_time: vine.string(),
    location: vine.string(),
    event_type: vine.string(),
    capacity: vine.number(),
    thumbnails: vine.array(
      vine.object({
        url: vine.string(),
        key: vine.string(),
      })
    ),
    slug: vine.string().optional(),
  })
)

export const updateEventValidator = vine.compile(
  vine.object({
    sales_start_date: vine.string().optional(),
    sales_deadline: vine.string().optional(),
    status: vine.enum(['draft', 'cancelled', 'completed', 'published']).optional(),
    waiver: vine
      .object({
        enabled: vine.boolean().optional(),
        content: vine.string().optional(),
      })
      .optional(),
  })
)
