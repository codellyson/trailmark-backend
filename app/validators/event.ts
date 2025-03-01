import vine from '@vinejs/vine'

export const createEventValidator = vine.compile(
  vine.object({
    title: vine.string(),
    description: vine.string(),
    custom_url: vine.string(),
    event_category: vine.string(),
    event_type: vine.enum(['offline', 'online', 'hybrid']),
    event_frequency: vine.enum(['single', 'recurring']),
    start_date: vine.string(),
    end_date: vine.string(),
    start_time: vine.string(),
    end_time: vine.string(),
    timezone: vine.string(),
    location: vine.string(),
    capacity: vine.number(),
    social_details: vine.object({
      website_url: vine.string().optional(),
      instagram_handle: vine.string().optional(),
      twitter_handle: vine.string().optional(),
      audiomack_url: vine.string().optional(),
      facebook_url: vine.string().optional(),
    }),
    thumbnails: vine.array(
      vine.object({
        url: vine.string(),
        key: vine.string(),
      })
    ),
    status: vine.enum(['draft', 'published']),
    theme_settings: vine.object({
      template: vine.enum([
        'default',
        'minimalist',
        'modern',
        'classic',
        'elegant',
        'creative',
        'vintage',
        'futuristic',
        'retro',
        'gothic',
        'boho',
        'hipster',
      ]),
      primary_color: vine.string(),
      secondary_color: vine.string(),
      font_family: vine.string(),
      hero_layout: vine.string(),
      show_countdown: vine.boolean(),
      custom_css: vine.string().optional(),
      customDomain: vine.string().optional(),
    }),

    vendors: vine.array(
      vine.object({
        id: vine.string(),
        name: vine.string(),
        description: vine.string(),
        category: vine.string(),
        contact_email: vine.string(),
        status: vine.enum(['pending', 'approved', 'rejected']),
        booth_number: vine.string().optional(),
      })
    ),
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
