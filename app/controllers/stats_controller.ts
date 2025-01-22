import type { HttpContext } from '@adonisjs/core/http'
import Event from '#models/event'
import EventPayment from '#models/event_payment'
import { DateTime } from 'luxon'

export default class OrganizerStatsController {
  /**
   * Get organizer dashboard statistics
   */
  async getDashboardStats({ auth, response }: HttpContext) {
    const user = auth.user!
    const now = DateTime.now()
    const startOfMonth = now.startOf('month')
    const endOfMonth = now.endOf('month')

    try {
      // Get events statistics
      const eventsCount = await Event.query().where('organizer_id', user.id).count('*', 'total')

      const activeEventsCount = await Event.query()
        .where('organizer_id', user.id)
        .where('date', '>=', now.toSQL())
        .count('*', 'total')

      // Get payments statistics
      const payments = await EventPayment.query()
        .whereHas('event', (query) => {
          query.where('organizer_id', user.id)
        })
        .where('status', 'completed')

      // Calculate total sales
      const totalSales = payments.reduce((sum, payment) => sum + Number(payment.amount), 0)

      // Calculate monthly sales
      const monthlyPayments = payments.filter((payment) => {
        const paymentDate = DateTime.fromJSDate(new Date(payment.created_at as any))
        return paymentDate >= startOfMonth && paymentDate <= endOfMonth
      })
      const monthlySales = monthlyPayments.reduce((sum, payment) => sum + Number(payment.amount), 0)
      // Calculate weekly sales
      const startOfWeek = now.startOf('week')
      const endOfWeek = now.endOf('week')

      const weeklyPayments = payments.filter((payment) => {
        const paymentDate = DateTime.fromJSDate(new Date(payment.created_at as any))
        return paymentDate >= startOfWeek && paymentDate <= endOfWeek
      })
      const weeklySales = weeklyPayments.reduce((sum, payment) => sum + Number(payment.amount), 0)

      // Calculate monthly breakdown for the past 12 months
      const monthlyBreakdown = []
      for (let i = 11; i >= 0; i--) {
        const monthStart = now.minus({ months: i }).startOf('month')
        const monthEnd = now.minus({ months: i }).endOf('month')

        const monthlyData = payments.filter((payment) => {
          const paymentDate = DateTime.fromJSDate(new Date(payment.created_at as any))
          return paymentDate >= monthStart && paymentDate <= monthEnd
        })

        monthlyBreakdown.push({
          month: monthStart.toFormat('MMM'),
          totalSales: monthlyData.reduce((sum, payment) => sum + Number(payment.amount), 0),
          totalTickets: monthlyData.length,
        })
      }

      // Calculate weekly breakdown for the past 7 days
      const weeklyBreakdown = []
      for (let i = 6; i >= 0; i--) {
        const dayStart = now.minus({ days: i }).startOf('day')
        const dayEnd = now.minus({ days: i }).endOf('day')

        const dailyData = payments.filter((payment) => {
          const paymentDate = DateTime.fromJSDate(new Date(payment.created_at as any))
          return paymentDate >= dayStart && paymentDate <= dayEnd
        })

        weeklyBreakdown.push({
          day: dayStart.toFormat('EEE'),
          totalSales: dailyData.reduce((sum, payment) => sum + Number(payment.amount), 0),
          totalTickets: dailyData.length,
        })
      }

      // Calculate daily breakdown for today
      const todayStart = now.startOf('day')
      const todayEnd = now.endOf('day')

      const todayPayments = payments.filter((payment) => {
        const paymentDate = DateTime.fromJSDate(new Date(payment.created_at as any))
        return paymentDate >= todayStart && paymentDate <= todayEnd
      })

      const dailyBreakdown = {
        totalSales: todayPayments.reduce((sum, payment) => sum + Number(payment.amount), 0),
        totalTickets: todayPayments.length,
        platformFees: todayPayments.reduce((sum, payment) => sum + Number(payment.platform_fee), 0),
      }
      // Get tickets sold
      const ticketsSold = payments.length

      // Calculate platform fees
      const platformFees = payments.reduce((sum, payment) => sum + Number(payment.platform_fee), 0)

      return response.json({
        success: true,
        data: {
          events: {
            total: Number(eventsCount[0].$extras.total),
            active: Number(activeEventsCount[0].$extras.total),
          },
          sales: {
            total: totalSales,
            monthly: monthlySales,
            weekly: weeklySales,
            breakdown: monthlyBreakdown,
            daily: dailyBreakdown,
            weeklyBreakdown,
          },
          tickets: {
            total: ticketsSold,
            monthly: monthlyPayments.length,
            weekly: weeklyPayments.length,
          },
          fees: {
            total: platformFees,
            monthly: monthlyPayments.reduce(
              (sum, payment) => sum + Number(payment.platform_fee),
              0
            ),
            weekly: weeklyPayments.reduce((sum, payment) => sum + Number(payment.platform_fee), 0),
          },
        },
        error: null,
        meta: {
          timestamp: new Date().toISOString(),
          period: {
            start: startOfMonth.toISO(),
            end: endOfMonth.toISO(),
          },
        },
      })
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
      return response.internalServerError({
        success: false,
        data: null,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch dashboard statistics',
        },
        meta: { timestamp: new Date().toISOString() },
      })
    }
  }
}
