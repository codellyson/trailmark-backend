import vine from '@vinejs/vine'

export const updateUserValidator = vine.compile(
  vine.object({
    first_name: vine.string().optional(),
    last_name: vine.string().optional(),
    email: vine.string().email().optional(),
    avatar_url: vine.string().optional(),
    bio: vine.string().optional(),
    social_links: vine
      .object({
        instagram: vine.string().optional(),
        facebook: vine.string().optional(),
        twitter: vine.string().optional(),
        linkedin: vine.string().optional(),
        youtube: vine.string().optional(),
        tiktok: vine.string().optional(),
        whatsapp: vine.string().optional(),
      })
      .optional(),
    business_name: vine.string().optional(),
    business_description: vine.string().optional(),
    business_address: vine.string().optional(),
    business_phone_number: vine.string().optional(),
    business_email: vine.string().email().optional(),
    business_website: vine.string().url().optional(),
    business_category: vine.string().optional(),
    business_logo: vine.string().optional(),
    business_banner: vine.string().optional(),

    preferences: vine
      .object({
        receive_email_notifications: vine.boolean().optional(),
        receive_sms_notifications: vine.boolean().optional(),
        receive_push_notifications: vine.boolean().optional(),
      })
      .optional(),
  })
)

export const updatePasswordValidator = vine.compile(
  vine.object({
    current_password: vine.string().minLength(8),
    new_password: vine.string().minLength(8),
  })
)
