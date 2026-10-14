import { BookingForm } from './booking-form.js'
import type { BookingRequest } from './booking-request.js'

/**
 * Validates that the selected end date does not logically precede the start date.
 * Relies on lexicographical string comparison, which works safely for standard ISO 8601
 * date strings (YYYY-MM-DD) without needing complex date parsing logic.
 *
 * @param fromDate - The start date of the booking.
 * @param toDate - The end date of the booking.
 * @returns boolean - True if the date range is chronological or on the same day.
 */
export const isBookingDateRangeValid = (fromDate: string, toDate: string): boolean => toDate >= fromDate

/**
 * Transforms & sanitizes raw form input data into a structured booking request payload.
 *
 * @param values - The raw, unparsed string values extracted from the DOM inputs.
 * @returns A validated & type-coerced BookingRequest ready for API submission.
 */
export const createBookingRequest = (values: BookingForm): BookingRequest => ({
    // Strip accidental leading/trailing whitespace from user text fields
    fullName: values.fullName.trim(),
    phoneNumber: values.phoneNumber.trim(),
    currentLocation: values.currentLocation.trim(),

    // Dropdowns & controlled date pickers output clean values naturally
    destination: values.destination,
    fromDate: values.fromDate,
    toDate: values.toDate,

    // Coerce the raw string input from the DOM into a numeric format for the API payload
    numberOfMembers: Number(values.numberOfMembers),

    // Sanitize optional multi-line text area input
    specialRequests: values.specialRequests.trim(),
  })
