import vine from '@vinejs/vine'

export const photographerProfileValidator = vine.compile(
  vine.object({
    bio: vine.string().optional(),
    business_name: vine.string().optional(),
    business_address: vine.string().optional(),
    business_phone_number: vine.string().optional(),
    business_website: vine.string().optional(),
    equipment: vine
      .array(
        vine.object({
          name: vine.string(),
          type: vine.string(),
          description: vine.string().optional(),
        })
      )
      .optional(),
    specialties: vine.array(vine.string()).optional(),
    hourly_rate: vine.number().optional(),
    availability: vine
      .object({
        weekdays: vine.boolean().optional(),
        weekends: vine.boolean().optional(),
        custom_hours: vine
          .array(
            vine.object({
              day: vine.enum(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']),
              start_time: vine.string(),
              end_time: vine.string(),
            })
          )
          .optional(),
      })
      .optional(),
  })
)

export const photographerSearchValidator = vine.compile(
  vine.object({
    specialties: vine.array(vine.string()).optional(),
    availability: vine.enum(['weekdays', 'weekends', 'all']).optional(),
    price_range: vine
      .object({
        min: vine.number(),
        max: vine.number(),
      })
      .optional(),
    location: vine.string().optional(),
    rating: vine.number().min(1).max(5).optional(),
  })
)
