import vine from '@vinejs/vine'

export const addonSchema = vine.object({
  name: vine.string(),
  description: vine.string().optional(),
  type: vine.enum(['photography', 'equipment_rental', 'transportation', 'custom']),
  price: vine.number(),
  currency: vine.string(),
  currency_symbol: vine.string(),
  capacity: vine.number().optional(),
  status: vine.enum(['active', 'inactive', 'sold_out']).optional(),
  event_id: vine.number(),
  photographer_id: vine.number().nullable().optional(),
  photo_count: vine.number().nullable().optional(),
  equipment_details: vine
    .object({
      brand: vine.string().optional(),
      model: vine.string().optional(),
      year: vine.string().optional(),
      serial_number: vine.string().optional(),
      condition: vine.string().optional(),
    })
    .optional(),
  transportation_details: vine
    .object({
      vehicle_type: vine.string().optional(),
      capacity: vine.number().optional(),
      pickup_location: vine.string().optional(),
      drop_off_location: vine.string().optional(),
      includes: vine.array(vine.string()).optional(),
    })
    .optional(),
})

export const createAddonValidator = vine.compile(
  vine.object({
    add_ons: vine.array(addonSchema), // Changed from 'data' to 'add_ons'
  })
)
