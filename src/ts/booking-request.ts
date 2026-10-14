/**
 * Defines the structured payload sent to the booking API.
 * Unlike the raw form data, this interface represents the parsed & validated
 * request, where fields like numberOfMembers have been converted to their appropriate types.
 */
export interface BookingRequest {
  // Personal & contact details of the primary traveler
  fullName: string
  phoneNumber: string

  // Logistics for the trip
  currentLocation: string
  destination: string

  // Travel dates (typically expected in YYYY-MM-DD ISO format)
  fromDate: string
  toDate: string

  // Parsed integer representing the total number of travelers
  numberOfMembers: number

  // Optional accommodations or additional notes
  specialRequests: string
}
