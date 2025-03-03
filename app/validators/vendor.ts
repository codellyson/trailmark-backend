import vine from '@vinejs/vine'

/**
 * Validator for creating a new vendor
 */
export const createVendorValidator = vine.compile(
  vine.object({
    business_name: vine.string().trim().minLength(2).maxLength(100),
    description: vine.string().trim().optional(),
    category: vine.string(),
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
        lat: vine.number().min(-90).max(90),
        lng: vine.number().min(-180).max(180),
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
    category: vine.string().optional(),
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
        lat: vine.number().min(-90).max(90),
        lng: vine.number().min(-180).max(180),
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

export const createVendorServiceValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(2).maxLength(100),
    price: vine.number().min(0),
    price_type: vine.enum(['fixed', 'hourly', 'daily', 'per_person']),
    description: vine.string().trim().optional(),
    category: vine.string().trim().minLength(2).maxLength(100),
    status: vine.enum(['pending', 'active', 'suspended', 'inactive']).optional(),
    images: vine.array(vine.string().url()).optional(),
    features: vine.array(vine.string()).optional(),
  })
)

export const updateVendorServiceValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(2).maxLength(100).optional(),
    price: vine.number().min(0).optional(),
    price_type: vine.enum(['fixed', 'hourly', 'daily', 'per_person']).optional(),
    description: vine.string().trim().optional(),
    category: vine.string().trim().minLength(2).maxLength(100).optional(),
    status: vine.enum(['pending', 'active', 'suspended', 'inactive']).optional(),
    images: vine.array(vine.string().url()).optional(),
    features: vine.array(vine.string()).optional(),
  })
)
