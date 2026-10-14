/**
 * Defines the raw data structure extracted directly from the booking form inputs.
 * Note that all fields here are strictly strings as they represent raw DOM input values
 * before any parsing or type conversion occurs.
 */
export interface BookingForm {
  // Personal & contact details
  fullName: string
  phoneNumber: string

  // Trip routing information
  currentLocation: string
  destination: string

  // Travel dates (typically in YYYY-MM-DD format from date inputs)
  fromDate: string
  toDate: string

  // Raw string input representing the traveler count (must be parsed later)
  numberOfMembers: string

  // Optional notes or accommodations requested by the user
  specialRequests: string
}
