export type UserRole = "rider" | "driver" | "admin";

export type VehicleType = "okada";

export interface Rider {
  id: string;
  full_name: string;
  phone: string;
  role: UserRole;
}

export interface Driver {
  id: string;
  full_name: string;
  phone: string;
  vehicle_type: VehicleType;
  role: UserRole;
}
