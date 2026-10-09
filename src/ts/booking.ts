import { BookingFormControls } from './booking-form-controls'
import type { BookingRequest } from './booking-request'
import { createBookingRequest, isBookingDateRangeValid } from './booking-utils'

const bookingForm = document.querySelector<HTMLFormElement>('.booking-form')
const bookingStatus = document.querySelector<HTMLElement>('.booking-status')

function getBookingFormControls(form: HTMLFormElement): BookingFormControls | null {
  const fullName = form.querySelector<HTMLInputElement>('#full-name')
  const phoneNumber = form.querySelector<HTMLInputElement>('#phone-number')
  const currentLocation = form.querySelector<HTMLInputElement>('#location')
  const destination = form.querySelector<HTMLSelectElement>('#destination')
  const fromDate = form.querySelector<HTMLInputElement>('#from-date')
  const toDate = form.querySelector<HTMLInputElement>('#to-date')
  const numberOfMembers = form.querySelector<HTMLInputElement>('#travelers')
  const specialRequests = form.querySelector<HTMLTextAreaElement>('#special-requests')
  const submitButton = form.querySelector<HTMLButtonElement>('.submit-button')

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
  ) {
    return null
  }

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

function setBookingStatus(
  status: HTMLElement,
  message: string,
  state: 'error' | 'success',
): void {
  status.textContent = message
  status.classList.remove('is-error', 'is-success')
  status.classList.add(`is-${state}`)
}

function validateBookingDates(fromDate: HTMLInputElement, toDate: HTMLInputElement): boolean {
  fromDate.setCustomValidity('')
  toDate.setCustomValidity('')

  if (!isBookingDateRangeValid(fromDate.value, toDate.value)) {
    toDate.setCustomValidity('To Date cannot be before From Date.')
    toDate.reportValidity()
    return false
  }

  return true
}

async function sendBookingRequest(payload: BookingRequest): Promise<void> {
  const response = await fetch('http://localhost:5166/api/v1/booking-requests', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(`Booking request failed with status ${response.status}.`)
  }
}

function setSubmitting(
  submitButton: HTMLButtonElement,
  isSubmitting: boolean,
  label: string | null,
): void {
  submitButton.disabled = isSubmitting
  submitButton.textContent = isSubmitting ? 'Sending...' : label
}

async function handleBookingSubmit(
  form: HTMLFormElement,
  status: HTMLElement,
  event: SubmitEvent,
): Promise<void> {
  event.preventDefault()

  const controls = getBookingFormControls(form)
  if (!controls) {
    setBookingStatus(
      status,
      'The booking form is incomplete. Please reload and try again.',
      'error',
    )
    console.error('Booking submission could not start because a required form control is missing.')
    return
  }

  if (!validateBookingDates(controls.fromDate, controls.toDate)) {
    return
  }

  const payload = createBookingRequest({
    fullName: controls.fullName.value,
    phoneNumber: controls.phoneNumber.value,
    currentLocation: controls.currentLocation.value,
    destination: controls.destination.value,
    fromDate: controls.fromDate.value,
    toDate: controls.toDate.value,
    numberOfMembers: controls.numberOfMembers.value,
    specialRequests: controls.specialRequests.value,
  })
  const buttonLabel = controls.submitButton.textContent
  setSubmitting(controls.submitButton, true, buttonLabel)
  status.textContent = ''
  status.classList.remove('is-error', 'is-success')

  try {
    await sendBookingRequest(payload)
    setBookingStatus(
      status,
      'Your booking request was sent successfully. We’ll be in touch soon.',
      'success',
    )
    form.reset()
  } catch (error) {
    console.error('Booking request could not be submitted.', error)
    setBookingStatus(
      status,
      'We couldn’t send your request. Please check your connection and try again.',
      'error',
    )
  } finally {
    setSubmitting(controls.submitButton, false, buttonLabel)
  }
}

function initializeBookingForm(): void {
  if (!bookingForm || !bookingStatus) {
    return
  }

  const destination = bookingForm.querySelector<HTMLSelectElement>('#destination')
  const destinationLinks = document.querySelectorAll<HTMLAnchorElement>(
    'a[data-booking-destination]',
  )

  if (destination) {
    destinationLinks.forEach((link) => {
      link.addEventListener('click', () => {
        const selectedDestination = link.dataset.bookingDestination
        const matchingOption = Array.from(destination.options).find(
          (option) => option.value === selectedDestination,
        )

        if (matchingOption) {
          destination.value = matchingOption.value
        }
      })
    })
  }

  bookingForm.addEventListener('submit', (event: SubmitEvent) => {
    void handleBookingSubmit(bookingForm, bookingStatus, event)
  })
}

initializeBookingForm()
