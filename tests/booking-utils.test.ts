import { describe, expect, it } from 'vitest'
import { createBookingRequest, isBookingDateRangeValid } from '../src/ts/booking-utils'

// Test suite for validating the chronological order of booking dates
describe('booking date validation', () => {
  it('accepts dates in chronological order, including the same day', () => {
    // Valid standard date range (start date comes before end date)
    expect(isBookingDateRangeValid('2026-10-05', '2026-10-06')).toBe(true)
    // Valid same-day booking (start date is the same as end date)
    expect(isBookingDateRangeValid('2026-10-05', '2026-10-05')).toBe(true)
  })

  it('rejects an end date before the start date', () => {
    // Invalid date range (end date precedes the start date)
    expect(isBookingDateRangeValid('2026-10-06', '2026-10-05')).toBe(false)
  })
})

// Test suite for ensuring booking request payloads are formatted & sanitized correctly
describe('booking request creation', () => {
  it('trims text fields & converts the traveler count to a number', () => {
    expect(
      createBookingRequest({
        // Inputs with excessive whitespace
        fullName: '  Naren  ',
        phoneNumber: '  +91 12345 67890 ',
        currentLocation: ' Madurai ',
        destination: 'ooty',
        fromDate: '2026-10-05',
        toDate: '2026-10-07',
        // String input that should be converted to a number
        numberOfMembers: '3',
        specialRequests: '  Window seat  ',
      }),
    ).toEqual({
      // Expected output: Whitespace trimmed & string converted to integer
      fullName: 'Naren',
      phoneNumber: '+91 12345 67890',
      currentLocation: 'Madurai',
      destination: 'ooty',
      fromDate: '2026-10-05',
      toDate: '2026-10-07',
      numberOfMembers: 3,
      specialRequests: 'Window seat',
    })
  })
})
