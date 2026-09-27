import { Booking } from '../types/booking';
import { APP_CONFIG } from '../config/appConfig';

export interface INotificationService {
  sendBookingConfirmation(booking: Booking): Promise<{ success: boolean; channel: string }>;
  sendCancellationNotification(booking: Booking): Promise<{ success: boolean; channel: string }>;
}

/**
 * Notification Service
 * Operates in structured DEMO_MODE without exposing credentials or fake endpoints.
 * Prepares backend-ready payloads for SendGrid/Postmark/Resend, Twilio SMS, and WhatsApp Cloud API.
 */
class NotificationService implements INotificationService {
  async sendBookingConfirmation(booking: Booking): Promise<{ success: boolean; channel: string }> {
    if (APP_CONFIG.DEMO_MODE) {
      // In demo mode, log the structured notification payload for inspection
      console.info('[NotificationService:DEMO] Booking Confirmation Prepared:', {
        recipientEmail: booking.customer.email,
        recipientPhone: `${booking.customer.countryCode}${booking.customer.phoneNumber}`,
        bookingReference: booking.bookingReference,
        tour: booking.tourTitle,
        date: booking.date,
        total: booking.pricing.formattedTotal,
        paymentStatus: booking.paymentStatus,
      });

      return { success: true, channel: 'demo-console' };
    }

    // Future backend integration: POST /api/notifications/confirmation
    return { success: true, channel: 'email-sms' };
  }

  async sendCancellationNotification(booking: Booking): Promise<{ success: boolean; channel: string }> {
    if (APP_CONFIG.DEMO_MODE) {
      console.info('[NotificationService:DEMO] Cancellation Request Prepared:', {
        recipientEmail: booking.customer.email,
        bookingReference: booking.bookingReference,
        reason: booking.cancellationReason,
        requestedAt: booking.cancellationRequestedAt,
      });

      return { success: true, channel: 'demo-console' };
    }

    return { success: true, channel: 'email-sms' };
  }
}

export const notificationService: INotificationService = new NotificationService();
