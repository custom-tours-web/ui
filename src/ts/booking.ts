import { BookingFormControls } from './booking-form-controls.js'
import type { BookingRequest } from './booking-request.js'
import { createBookingRequest, isBookingDateRangeValid } from './booking-utils.js'

// Cache the main form & status container elements from the DOM
const bookingForm = document.querySelector<HTMLFormElement>('.booking-form')
const bookingStatus = document.querySelector<HTMLElement>('.booking-status')

/**
 * Queries & validates all required form controls from the booking form.
 * Returns null if any required element is missing to prevent runtime errors.
 */
const getBookingFormControls = (form: HTMLFormElement): BookingFormControls | null => {
  const fullName = form.querySelector<HTMLInputElement>('#full-name')
  const phoneNumber = form.querySelector<HTMLInputElement>('#phone-number')
  const currentLocation = form.querySelector<HTMLInputElement>('#location')
  const destination = form.querySelector<HTMLSelectElement>('#destination')
  const fromDate = form.querySelector<HTMLInputElement>('#from-date')
  const toDate = form.querySelector<HTMLInputElement>('#to-date')
  const numberOfMembers = form.querySelector<HTMLInputElement>('#travelers')
  const specialRequests = form.querySelector<HTMLTextAreaElement>('#special-requests')
  const submitButton = form.querySelector<HTMLButtonElement>('.submit-button')

  // Fail fast if the DOM structure is incomplete
  if (
    !fullName ||
    !phoneNumber ||
    !currentLocation ||
    !destination ||
    !fromDate ||
    !toDate ||
    !numberOfMembers ||
    !specialRequests ||
    !submitButton
  ) return null

  return {
    fullName,
    phoneNumber,
    currentLocation,
    destination,
    fromDate,
    toDate,
    numberOfMembers,
    specialRequests,
    submitButton,
  }
}

/**
 * Updates the UI status message with success or error styling.
 */
const setBookingStatus = (
  status: HTMLElement,
  message: string,
  state: 'error' | 'success',
): void => {
  status.textContent = message
  // Reset previous state classes before applying the new one
  status.classList.remove('is-error', 'is-success')
  status.classList.add(`is-${state}`)
}

/**
 * Validates the chronological order of the booking dates using the HTML5 constraint validation API.
 */
const validateBookingDates = (fromDate: HTMLInputElement, toDate: HTMLInputElement): boolean => {
  // Clear any existing custom validation errors before re-evaluating
  fromDate.setCustomValidity('')
  toDate.setCustomValidity('')

  if (!isBookingDateRangeValid(fromDate.value, toDate.value)) {
    // Trigger the browser's native UI popover for invalid fields
    toDate.setCustomValidity('To Date cannot be before From Date.')
    toDate.reportValidity()
    return false
  }

  return true
}

/**
 * Submits the structured booking payload to the local API endpoint.
 */
const sendBookingRequest = async (payload: BookingRequest): Promise<void> => {
  const response : Response = await fetch('http://localhost:5166/api/v1/booking-requests', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  // Throw to trigger the catch block in the main submit handler if the server rejects the request
  if (!response.ok) throw new Error(`Booking request failed with status ${response.status}.`)
}

/**
 * Toggles the loading state of the submit button to prevent double-submissions.
 */
const setSubmitting = (
  submitButton: HTMLButtonElement,
  isSubmitting: boolean,
  label: string | null,
): void => {
  submitButton.disabled = isSubmitting
  submitButton.textContent = isSubmitting ? 'Sending...' : label
}

/**
 * Orchestrates the form submission lifecycle: validation, payload creation, API interaction, & UI updates.
 */
const handleBookingSubmit = async (
  form: HTMLFormElement,
  status: HTMLElement,
  event: SubmitEvent,
): Promise<void> => {
  // Prevent standard HTML form POST behavior
  event.preventDefault()

  const controls : BookingFormControls = getBookingFormControls(form)!
  if (!controls) {
    setBookingStatus(
      status,
      'The booking form is incomplete. Please reload & try again.',
      'error',
    )
    console.error('Booking submission could not start because a required form control is missing.')
    return
  }

  if (!validateBookingDates(controls.fromDate, controls.toDate)) return

  // Map the raw DOM input values into the strictly typed API payload format
  const payload : BookingRequest = createBookingRequest({
    fullName: controls.fullName.value,
    phoneNumber: controls.phoneNumber.value,
    currentLocation: controls.currentLocation.value,
    destination: controls.destination.value,
    fromDate: controls.fromDate.value,
    toDate: controls.toDate.value,
    numberOfMembers: controls.numberOfMembers.value,
    specialRequests: controls.specialRequests.value,
  })

  // Cache the original button text before overwriting it with the loading state
  const buttonLabel : string = controls.submitButton.textContent
  setSubmitting(controls.submitButton, true, buttonLabel)

  // Clear any previous status messages
  status.textContent = ''
  status.classList.remove('is-error', 'is-success')

  try {
    await sendBookingRequest(payload)
    setBookingStatus(
      status,
      'Your booking request was sent successfully. We’ll be in touch soon.',
      'success',
    )
    form.reset() // Clear the form only on success
  } catch (error) {
    console.error('Booking request could not be submitted.', error)
    setBookingStatus(
      status,
      'We couldn’t send your request. Please check your connection & try again.',
      'error',
    )
  } finally {
    // Restore button functionality regardless of success or failure
    setSubmitting(controls.submitButton, false, buttonLabel)
  }
}

/**
 * Bootstraps the booking logic by attaching event listeners if the form exists.
 */
const initializeBookingForm = (): void => {
  // Exit cleanly if the script is loaded on a page without the booking form
  if (!bookingForm || !bookingStatus) return
  const destination = bookingForm.querySelector<HTMLSelectElement>('#destination')
  const destinationLinks = document.querySelectorAll<HTMLAnchorElement>(
    'a[data-booking-destination]',
  )

  // Allow external links (like 'Book Ooty') to pre-fill the destination dropdown
  if (destination) {
    destinationLinks.forEach((link) => {
      link.addEventListener('click', () => {
        const selectedDestination : string = link.dataset.bookingDestination!
        // Ensure the external link's target actually exists in the dropdown options
        const matchingOption : HTMLOptionElement = Array.from(destination.options).find(
          (option) => option.value === selectedDestination,
        )!

        if (matchingOption) destination.value = matchingOption.value
      })
    })
  }

  // Bind the async submit handler, swallowing the unhandled promise return
  bookingForm.addEventListener('submit', (event: SubmitEvent) => {
    void handleBookingSubmit(bookingForm, bookingStatus, event)
  })
}

// Start the module
initializeBookingForm()
