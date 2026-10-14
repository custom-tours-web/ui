/**
 * Defines the strongly-typed DOM elements required for the booking form.
 * This interface ensures that form controls are correctly queried & accessed
 * with their specific HTML element types.
 */
export interface BookingFormControls {
  // Personal details
  fullName: HTMLInputElement
  phoneNumber: HTMLInputElement

  // Trip logistics
  currentLocation: HTMLInputElement
  destination: HTMLSelectElement

  // Travel dates
  fromDate: HTMLInputElement
  toDate: HTMLInputElement

  // Party size & preferences
  numberOfMembers: HTMLInputElement
  specialRequests: HTMLTextAreaElement

  // Form submission action
  submitButton: HTMLButtonElement
}
