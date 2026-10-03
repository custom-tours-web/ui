import type { BookingRequest } from "./booking-request";

interface BookingFormControls {
  fullName: HTMLInputElement;
  phoneNumber: HTMLInputElement;
  currentLocation: HTMLInputElement;
  destination: HTMLSelectElement;
  fromDate: HTMLInputElement;
  toDate: HTMLInputElement;
  numberOfMembers: HTMLInputElement;
  specialRequests: HTMLTextAreaElement;
  submitButton: HTMLButtonElement;
}

const bookingForm = document.querySelector<HTMLFormElement>(".booking-form");
const bookingStatus = document.querySelector<HTMLElement>(".booking-status");

function getBookingFormControls(form: HTMLFormElement): BookingFormControls | null {
  const fullName = form.querySelector<HTMLInputElement>("#full-name");
  const phoneNumber = form.querySelector<HTMLInputElement>("#phone-number");
  const currentLocation = form.querySelector<HTMLInputElement>("#location");
  const destination = form.querySelector<HTMLSelectElement>("#destination");
  const fromDate = form.querySelector<HTMLInputElement>("#from-date");
  const toDate = form.querySelector<HTMLInputElement>("#to-date");
  const numberOfMembers = form.querySelector<HTMLInputElement>("#travelers");
  const specialRequests = form.querySelector<HTMLTextAreaElement>("#special-requests");
  const submitButton = form.querySelector<HTMLButtonElement>(".submit-button");

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
    return null;
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
  };
}

function setBookingStatus(
  status: HTMLElement,
  message: string,
  state: "error" | "success",
): void {
  status.textContent = message;
  status.classList.remove("is-error", "is-success");
  status.classList.add(`is-${state}`);
}

function getLocalDateValue(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function validateBookingDates(fromDate: HTMLInputElement, toDate: HTMLInputElement): boolean {
  fromDate.setCustomValidity("");
  toDate.setCustomValidity("");

  if (fromDate.value > getLocalDateValue(new Date())) {
    fromDate.setCustomValidity("From Date cannot be after today.");
    fromDate.reportValidity();
    return false;
  }

  if (toDate.value < fromDate.value) {
    toDate.setCustomValidity("To Date cannot be before From Date.");
    toDate.reportValidity();
    return false;
  }

  return true;
}

function createBookingRequest(controls: BookingFormControls): BookingRequest {
  return {
    fullName: controls.fullName.value.trim(),
    phoneNumber: controls.phoneNumber.value.trim(),
    currentLocation: controls.currentLocation.value.trim(),
    destination: controls.destination.value,
    fromDate: controls.fromDate.value,
    toDate: controls.toDate.value,
    numberOfMembers: Number(controls.numberOfMembers.value),
    specialRequests: controls.specialRequests.value.trim(),
  };
}

async function sendBookingRequest(payload: BookingRequest): Promise<void> {
  const response = await fetch("http://localhost:5166/api/v1/booking-requests", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Booking request failed with status ${response.status}.`);
  }
}

function setSubmitting(
  submitButton: HTMLButtonElement,
  isSubmitting: boolean,
  label: string | null,
): void {
  submitButton.disabled = isSubmitting;
  submitButton.textContent = isSubmitting ? "Sending..." : label;
}

async function handleBookingSubmit(
  form: HTMLFormElement,
  status: HTMLElement,
  event: SubmitEvent,
): Promise<void> {
  event.preventDefault();

  const controls = getBookingFormControls(form);
  if (!controls) {
    setBookingStatus(
      status,
      "The booking form is incomplete. Please reload and try again.",
      "error",
    );
    console.error("Booking submission could not start because a required form control is missing.");
    return;
  }

  if (!validateBookingDates(controls.fromDate, controls.toDate)) {
    return;
  }

  const payload = createBookingRequest(controls);
  const buttonLabel = controls.submitButton.textContent;
  setSubmitting(controls.submitButton, true, buttonLabel);
  status.textContent = "";
  status.classList.remove("is-error", "is-success");

  try {
    await sendBookingRequest(payload);
    setBookingStatus(
      status,
      "Your booking request was sent successfully. We’ll be in touch soon.",
      "success",
    );
    form.reset();
  } catch (error) {
    console.error("Booking request could not be submitted.", error);
    setBookingStatus(
      status,
      "We couldn’t send your request. Please check your connection and try again.",
      "error",
    );
  } finally {
    setSubmitting(controls.submitButton, false, buttonLabel);
  }
}

function initializeBookingForm(): void {
  if (!bookingForm || !bookingStatus) {
    return;
  }

  bookingForm.addEventListener("submit", (event: SubmitEvent) => {
    void handleBookingSubmit(bookingForm, bookingStatus, event);
  });
}

initializeBookingForm();
