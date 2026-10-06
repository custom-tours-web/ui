// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

function addBookingForm(omitSelector?: string): void {
  document.body.innerHTML = `
    <a href="#booking" data-booking-destination="ooty">Ooty</a>
    <form class="booking-form">
      <input id="full-name" value="Naren">
      <input id="phone-number" value="+91 12345 67890">
      <input id="location" value="Madurai">
      <select id="destination">
        <option value="">Select Destination</option>
        <option value="ooty">Ooty</option>
      </select>
      <input id="from-date" type="date" value="2026-10-05">
      <input id="to-date" type="date" value="2026-10-07">
      <input id="travelers" value="2">
      <textarea id="special-requests">  No stairs  </textarea>
      <button class="submit-button" type="submit">Book</button>
    </form>
    <p class="booking-status"></p>
  `;
  document.querySelector(omitSelector ?? "[data-test-no-control]")?.remove();
}

async function submitBookingForm(): Promise<void> {
  const form = document.querySelector<HTMLFormElement>(".booking-form");
  if (!form) {
    throw new Error("Test booking form was not created.");
  }

  form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  expect(fetch).toHaveBeenCalled();
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
}

describe("booking form", () => {
  beforeEach(() => {
    vi.resetModules();
    addBookingForm();
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("selects the destination associated with a destination link", async () => {
    await import("../src/ts/booking");

    document.querySelector<HTMLAnchorElement>("[data-booking-destination]")?.click();

    expect(document.querySelector<HTMLSelectElement>("#destination")?.value).toBe("ooty");
  });

  it("does not submit when the end date is before the start date", async () => {
    await import("../src/ts/booking");
    const fromDate = document.querySelector<HTMLInputElement>("#from-date");
    const toDate = document.querySelector<HTMLInputElement>("#to-date");
    if (!fromDate || !toDate) {
      throw new Error("Test date fields were not created.");
    }
    fromDate.value = "2026-10-07";
    toDate.value = "2026-10-05";
    const reportValidity = vi.spyOn(toDate, "reportValidity").mockReturnValue(false);

    const submitEvent = new Event("submit", { bubbles: true, cancelable: true });
    document.querySelector<HTMLFormElement>(".booking-form")?.dispatchEvent(submitEvent);

    expect(toDate.validationMessage).toBe("To Date cannot be before From Date.");
    expect(reportValidity).toHaveBeenCalledOnce();
    expect(submitEvent.defaultPrevented).toBe(true);
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each([
    "#full-name",
    "#phone-number",
    "#location",
    "#destination",
    "#from-date",
    "#to-date",
    "#travelers",
    "#special-requests",
    ".submit-button",
  ])("reports an incomplete form when %s is missing", async (selector) => {
    addBookingForm(selector);
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    await import("../src/ts/booking");

    document.querySelector<HTMLFormElement>(".booking-form")?.dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true }),
    );

    expect(consoleError).toHaveBeenCalledWith(
      "Booking submission could not start because a required form control is missing.",
    );
    expect(document.querySelector(".booking-status")?.textContent).toContain(
      "The booking form is incomplete.",
    );
    expect(document.querySelector(".booking-status")?.classList.contains("is-error")).toBe(true);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("does not bind destination links when the destination selector is missing", async () => {
    addBookingForm("#destination");
    await import("../src/ts/booking");
    const windowError = vi.fn((event: Event) => event.preventDefault());
    window.addEventListener("error", windowError);

    document.querySelector<HTMLAnchorElement>("[data-booking-destination]")?.click();

    expect(windowError).not.toHaveBeenCalled();
    window.removeEventListener("error", windowError);
  });

  it.each(["form", "status", "both"])(
    "does nothing when the %s booking element is missing",
    async (missingElement) => {
      if (missingElement === "form") {
        document.body.innerHTML = `<p class="booking-status"></p>`;
      } else if (missingElement === "status") {
        document.body.innerHTML = `<form class="booking-form"></form>`;
      } else {
        document.body.innerHTML = "";
      }

      await expect(import("../src/ts/booking")).resolves.toBeDefined();
      expect(fetch).not.toHaveBeenCalled();
    },
  );

  it("posts the booking and announces success", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 200 }));
    await import("../src/ts/booking");
    const destination = document.querySelector<HTMLSelectElement>("#destination");
    if (!destination) {
      throw new Error("Test destination field was not created.");
    }
    destination.value = "ooty";

    await submitBookingForm();

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:5166/api/v1/booking-requests",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: "Naren",
          phoneNumber: "+91 12345 67890",
          currentLocation: "Madurai",
          destination: "ooty",
          fromDate: "2026-10-05",
          toDate: "2026-10-07",
          numberOfMembers: 2,
          specialRequests: "No stairs",
        }),
      }),
    );
    expect(document.querySelector(".booking-status")?.textContent).toContain(
      "Your booking request was sent successfully.",
    );
    expect(document.querySelector(".booking-status")?.classList.contains("is-success")).toBe(true);
  });

  it("shows an error when the booking API rejects the request", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 503 }));
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    await import("../src/ts/booking");

    await submitBookingForm();

    expect(document.querySelector(".booking-status")?.textContent).toContain(
      "We couldn’t send your request.",
    );
    expect(document.querySelector(".booking-status")?.classList.contains("is-error")).toBe(true);
    expect(consoleError).toHaveBeenCalledWith(
      "Booking request could not be submitted.",
      expect.objectContaining({ message: "Booking request failed with status 503." }),
    );
  });

  it("clears prior date validation and shows submitting state while the request is pending", async () => {
    let resolveFetch: ((response: Response) => void) | undefined;
    vi.mocked(fetch).mockImplementation(
      () =>
        new Promise<Response>((resolve) => {
          resolveFetch = resolve;
        }),
    );
    await import("../src/ts/booking");

    const fromDate = document.querySelector<HTMLInputElement>("#from-date");
    const toDate = document.querySelector<HTMLInputElement>("#to-date");
    const submitButton = document.querySelector<HTMLButtonElement>(".submit-button");
    if (!fromDate || !toDate || !submitButton) {
      throw new Error("Test booking controls were not created.");
    }
    const status = document.querySelector<HTMLElement>(".booking-status");
    if (!status) {
      throw new Error("Test booking status region was not created.");
    }
    fromDate.setCustomValidity("Old start date error");
    toDate.setCustomValidity("Old end date error");
    status.textContent = "Previous message";

    document.querySelector<HTMLFormElement>(".booking-form")?.dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true }),
    );

    expect(fromDate.validationMessage).toBe("");
    expect(toDate.validationMessage).toBe("");
    expect(status.textContent).toBe("");
    expect(submitButton.disabled).toBe(true);
    expect(submitButton.textContent).toBe("Sending...");

    resolveFetch?.(new Response(null, { status: 200 }));
    await vi.waitFor(() => {
      expect(submitButton.disabled).toBe(false);
    });
    expect(submitButton.textContent).toBe("Book");
  });

  it("does not change destination when a destination link has no matching option", async () => {
    document
      .querySelector<HTMLAnchorElement>("[data-booking-destination]")
      ?.setAttribute("data-booking-destination", "unlisted");
    await import("../src/ts/booking");

    document.querySelector<HTMLAnchorElement>("[data-booking-destination]")?.click();

    expect(document.querySelector<HTMLSelectElement>("#destination")?.value).toBe("");
  });
});
