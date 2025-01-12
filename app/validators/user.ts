import vine from '@vinejs/vine'

export const createUserValidator = vine.compile(
  vine.object({
    email: vine.string().email(),
    password: vine.string().trim().minLength(8),
    first_name: vine.string().trim().minLength(2),
    last_name: vine.string().trim().minLength(2),
    role: vine.enum(['user', 'photographer', 'organizer']), // Updated to include photographer
  })
)

const preferencesSchema = vine.object({
  equipment: vine.array(
    vine.object({
      name: vine.string().trim().minLength(2),
      type: vine.string().trim().minLength(2),
      description: vine.string().trim().minLength(2),
    })
  ),
  specialties: vine.array(vine.string().trim().minLength(2)),
  hourly_rate: vine.number().min(0),
  availability: vine.object({
    weekdays: vine.boolean(),
    weekends: vine.boolean(),
    custom_hours: vine.array(
      vine.object({
        day: vine.enum([
          'monday',
          'tuesday',
          'wednesday',
          'thursday',
          'friday',
          'saturday',
          'sunday',
        ]),
        start_time: vine.string().trim().minLength(2),
        end_time: vine.string().trim().minLength(2),
      })
    ),
  }),
  business_settings: vine.object({
    business_name: vine.string().optional(),
    business_address: vine.string().optional(),
    business_phone: vine.string().optional(),
    business_email: vine.string().optional(),
    business_website: vine.string().optional(),
  }),
  portfolio_settings: vine.object({
    featured_photos: vine.array(vine.string().optional()),
    social_media: vine.object({
      instagram: vine.string().optional(),
      facebook: vine.string().optional(),
      twitter: vine.string().optional(),
    }),
  }),
})

export const updatePhotographerProfileValidator = vine.compile(
  vine.object({
    first_name: vine.string().trim().minLength(2),
    last_name: vine.string().trim().minLength(2),
    avatar_url: vine.string().trim().minLength(2),
    bio: vine.string().trim().minLength(2),
    preferences: vine
      .object({
        ...preferencesSchema.getProperties(),
      })
      .optional(),
  })
)
