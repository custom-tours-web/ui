import type { BookingRequest } from "./booking-request";

export interface BookingFormValues {
  fullName: string;
  phoneNumber: string;
  currentLocation: string;
  destination: string;
  fromDate: string;
  toDate: string;
  numberOfMembers: string;
  specialRequests: string;
}

export function isBookingDateRangeValid(fromDate: string, toDate: string): boolean {
  return toDate >= fromDate;
}

export function createBookingRequest(values: BookingFormValues): BookingRequest {
  return {
    fullName: values.fullName.trim(),
    phoneNumber: values.phoneNumber.trim(),
    currentLocation: values.currentLocation.trim(),
    destination: values.destination,
    fromDate: values.fromDate,
    toDate: values.toDate,
    numberOfMembers: Number(values.numberOfMembers),
    specialRequests: values.specialRequests.trim(),
  };
}
