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
        'minimal',
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
  })
)

export const updateEventValidator = vine.compile(
  vine.object({
    title: vine.string().optional(),
    description: vine.string().optional(),
    event_category: vine.string().optional(),
    event_type: vine.enum(['offline', 'online', 'hybrid']).optional(),
    event_frequency: vine.enum(['single', 'recurring']).optional(),
    start_date: vine.string().optional(),
    end_date: vine.string().optional(),
    start_time: vine.string().optional(),
    end_time: vine.string().optional(),
    timezone: vine.string().optional(),
    location: vine.string().optional(),
    capacity: vine.number().optional(),
    social_details: vine
      .object({
        website_url: vine.string().optional(),
        instagram_handle: vine.string().optional(),
        twitter_handle: vine.string().optional(),
        audiomack_url: vine.string().optional(),
        facebook_url: vine.string().optional(),
      })
      .optional(),
    thumbnails: vine
      .array(
        vine.object({
          url: vine.string(),
          key: vine.string(),
        })
      )
      .optional(),
    status: vine.enum(['draft', 'published']).optional(),
    event_sale_status: vine
      .object({
        type: vine.enum(['none', 'pre_sale', 'post_sale']).optional(),
        pre_sale_message: vine.string().optional(),
        post_sale_message: vine.string().optional(),
      })
      .optional(),
    confirmation_message: vine.string().optional(),
    theme_settings: vine
      .object({
        template: vine
          .enum([
            'default',
            'minimal',
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
          ])
          .optional(),
        primary_color: vine.string().optional(),
        secondary_color: vine.string().optional(),
        font_family: vine.string().optional(),
        hero_layout: vine.string().optional(),
        show_countdown: vine.boolean().optional(),
        custom_css: vine.string().optional(),
        customDomain: vine.string().optional(),
      })
      .optional(),
  })
)

export const createVendorApplicationValidator = vine.compile(
  vine.object({
    vendors: vine.array(
      vine.object({
        vendor_id: vine.string(),
        booth_number: vine.string(),
        booth_location: vine.string(),
        agreed_price: vine.number(),
        setup_time: vine.string(),
        teardown_time: vine.string(),
        service_id: vine.string(),
        status: vine.enum(['pending', 'approved', 'rejected']),
      })
    ),
  })
)

export const generateVendorPaymentLinkValidator = vine.compile(
  vine.object({
    vendor_id: vine.string(),
    event_id: vine.string(),
  })
)
