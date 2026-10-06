import { describe, expect, it } from "vitest";
import { createBookingRequest, isBookingDateRangeValid } from "../src/ts/booking-utils";

describe("booking date validation", () => {
  it("accepts dates in chronological order, including the same day", () => {
    expect(isBookingDateRangeValid("2026-10-05", "2026-10-06")).toBe(true);
    expect(isBookingDateRangeValid("2026-10-05", "2026-10-05")).toBe(true);
  });

  it("rejects an end date before the start date", () => {
    expect(isBookingDateRangeValid("2026-10-06", "2026-10-05")).toBe(false);
  });
});

describe("booking request creation", () => {
  it("trims text fields and converts the traveler count to a number", () => {
    expect(
      createBookingRequest({
        fullName: "  Naren  ",
        phoneNumber: "  +91 12345 67890 ",
        currentLocation: " Madurai ",
        destination: "ooty",
        fromDate: "2026-10-05",
        toDate: "2026-10-07",
        numberOfMembers: "3",
        specialRequests: "  Window seat  ",
      }),
    ).toEqual({
      fullName: "Naren",
      phoneNumber: "+91 12345 67890",
      currentLocation: "Madurai",
      destination: "ooty",
      fromDate: "2026-10-05",
      toDate: "2026-10-07",
      numberOfMembers: 3,
      specialRequests: "Window seat",
    });
  });
});
