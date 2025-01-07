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
  })
)

export const updateEventValidator = vine.compile(
  vine.object({
    sales_start_date: vine.string().optional(),
    sales_deadline: vine.string().optional(),
    ticket_options: vine.array(
      vine.object({
        ticket_price: vine.number().optional(),
        ticket_name: vine.string().optional(),
        ticket_description: vine.string().optional(),
        ticket_capacity: vine.number().optional(),
        ticket_type: vine.string().optional(),
        ticket_currency: vine.string().optional(),
        ticket_currency_symbol: vine.string().optional(),
      })
    ),

    add_ons: vine.object({
      photography_addons: vine.object({
        enabled: vine.boolean().optional(),
        packages: vine
          .array(
            vine.object({
              price: vine.number().optional(),
              name: vine.string().optional(),
              description: vine.string().optional(),
              photo_count: vine.number().optional(),
              photographer_id: vine.number().optional(),
            })
          )
          .optional(),
      }),
      equipment_rentals: vine
        .object({
          enabled: vine.boolean().optional(),
          packages: vine
            .array(
              vine.object({
                price: vine.number().optional(),
                name: vine.string().optional(),
                description: vine.string().optional(),
              })
            )
            .optional(),
        })
        .optional(),
      transportation_services: vine.object({
        enabled: vine.boolean().optional(),
        packages: vine
          .array(
            vine.object({
              price: vine.number().optional(),
              name: vine.string().optional(),
              description: vine.string().optional(),
            })
          )
          .optional(),
      }),
      custom_addons: vine
        .object({
          enabled: vine.boolean().optional(),
          packages: vine
            .array(
              vine.object({
                price: vine.number().optional(),
                name: vine.string().optional(),
                description: vine.string().optional(),
              })
            )
            .optional(),
        })
        .optional(),
    }),
    waiver: vine
      .object({
        enabled: vine.boolean().optional(),
        content: vine.string().optional(),
      })
      .optional(),
  })
)
