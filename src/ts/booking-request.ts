export interface BookingRequest {
  fullName: string;
  phoneNumber: string;
  currentLocation: string;
  destination: string;
  fromDate: string;
  toDate: string;
  numberOfMembers: number;
  specialRequests: string;
}
