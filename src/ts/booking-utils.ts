import { BookingForm } from "./booking-form"
import type { BookingRequest } from "./booking-request"

export function isBookingDateRangeValid(fromDate: string, toDate: string): boolean {
  return toDate >= fromDate
}

export function createBookingRequest(values: BookingForm): BookingRequest {
  return {
    fullName: values.fullName.trim(),
    phoneNumber: values.phoneNumber.trim(),
    currentLocation: values.currentLocation.trim(),
    destination: values.destination,
    fromDate: values.fromDate,
    toDate: values.toDate,
    numberOfMembers: Number(values.numberOfMembers),
    specialRequests: values.specialRequests.trim(),
  }
}
