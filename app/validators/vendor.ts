import vine from '@vinejs/vine'

/**
 * Validator for creating a new vendor
 */
export const createVendorValidator = vine.compile(
  vine.object({
    business_name: vine.string().trim().minLength(2).maxLength(100),
    description: vine.string().trim().optional(),
    category: vine.enum(['photographer', 'caterer', 'decorator', 'musician', 'venue', 'other']),
    services: vine.array(vine.string()).optional(),
    portfolio_images: vine
      .array(
        vine.object({
          url: vine.string().url(),
          key: vine.string(),
        })
      )
      .optional(),
    contact_email: vine.string().email(),
    contact_phone: vine.string().mobile(),
    address: vine.string().optional(),
    location: vine
      .object({
        lat: vine.number().between(-90, 90),
        lng: vine.number().between(-180, 180),
      })
      .optional(),
    social_media: vine
      .object({
        facebook: vine.string().url().optional(),
        instagram: vine.string().url().optional(),
        twitter: vine.string().url().optional(),
        website: vine.string().url().optional(),
      })
      .optional(),
  })
)

/**
 * Validator for updating a vendor
 */
export const updateVendorValidator = vine.compile(
  vine.object({
    business_name: vine.string().trim().minLength(2).maxLength(100).optional(),
    description: vine.string().trim().optional(),
    category: vine.enum(['photographer', 'caterer', 'decorator', 'musician', 'venue', 'other']).optional(),
    services: vine.array(vine.string()).optional(),
    portfolio_images: vine
      .array(
        vine.object({
          url: vine.string().url(),
          key: vine.string(),
        })
      )
      .optional(),
    contact_email: vine.string().email().optional(),
    contact_phone: vine.string().mobile().optional(),
    address: vine.string().optional(),
    location: vine
      .object({
        lat: vine.number().between(-90, 90),
        lng: vine.number().between(-180, 180),
      })
      .optional(),
    social_media: vine
      .object({
        facebook: vine.string().url().optional(),
        instagram: vine.string().url().optional(),
        twitter: vine.string().url().optional(),
        website: vine.string().url().optional(),
      })
      .optional(),
    status: vine.enum(['pending', 'active', 'suspended', 'inactive']).optional(),
  })
)
