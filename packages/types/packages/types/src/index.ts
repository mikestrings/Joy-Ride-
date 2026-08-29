// ============================================
// JOY RIDE — SHARED TYPES
// ============================================

// --------------------
// USER ROLES
// --------------------

export type UserRole =
  | "rider"
  | "driver"
  | "admin";

export type AdminRole =
  | "super_admin"
  | "operations"
  | "finance"
  | "support";

// --------------------
// RIDE
// --------------------

export type RideStatus =
  | "requested"
  | "matched"
  | "accepted"
  | "arriving"
  | "in_progress"
  | "completed"
  | "cancelled";

export type RideDirection =
  | "outbound"
  | "return";

export type VehicleType =
  | "okada";

// --------------------
// JOY RIDE ROUTES
// --------------------

export type Hub =
  | "mayfair"
  | "lagere"
  | "asherifa";

export const ROUTES = [
  "mayfair",
  "lagere",
  "asherifa"
] as const;

// --------------------
// PRICING
// --------------------

export const FARES = {
  standardRide: 600,
  pairedRidePerRider: 300,
  driverPayout: 500,
  platformMargin: 100
} as const;

// --------------------
// SUBSCRIPTIONS
// --------------------

export type SubscriptionKind =
  | "weekly"
  | "monthly";

export type SubscriptionMode =
  | "one_way"
  | "to_and_fro";

export const SUBSCRIPTION_PRICES = {
  weekly: {
    oneWay: 2500,
    toAndFro: 5000
  },

  monthly: {
    oneWay: 10000,
    toAndFro: 20000
  }
} as const;

export const SUBSCRIPTION_RIDES = {
  oneWay: 1,
  toAndFro: 2
} as const;

// Monday → Friday
export const SUBSCRIPTION_OPERATING_DAYS = [
  1,
  2,
  3,
  4,
  5
] as const;

// --------------------
// OPERATING HOURS
// --------------------

export const OPERATING_HOURS = {
  opening: "06:00",
  closing: "22:00"
} as const;

// --------------------
// WATCH & RIDE
// --------------------

export const REWARD_RULES = {
  pointsPerAd: 1,

  dailyAdLimit: 500,

  pointsForRideCredit: 10,

  rideCreditAmount: 50,

  pointsForFreeRide: 100,

  pointsForFoodReward: 500
} as const;

// --------------------
// FOOD REWARDS
// --------------------

export type RewardItem =
  | "rice"
  | "beans"
  | "garri"
  | "indomie"
  | "cooking_oil";

export const FOOD_REWARDS = {
  rice: {
    name: "Rice",
    quantity: "1 Congo"
  },

  beans: {
    name: "Beans",
    quantity: "1 Congo"
  },

  garri: {
    name: "Garri",
    quantity: "2 Congos"
  },

  indomie: {
    name: "Indomie",
    quantity: "Quarter"
  },

  cooking_oil: {
    name: "Cooking Oil",
    quantity: "1 bottle",
    options: [
      "vegetable oil",
      "palm oil"
    ]
  }
} as const;

// --------------------
// DRIVER VERIFICATION
// --------------------

export type DriverVerificationDocument =
  | "passport_photo"
  | "nin"
  | "phone_number"
  | "driver_photo"
  | "motorcycle_photo";

// --------------------
// PAYMENT
// --------------------

export type PaymentProvider =
  | "paystack";

export type PaymentStatus =
  | "pending"
  | "success"
  | "failed"
  | "refunded";

// --------------------
// USER
// --------------------

export interface User {
  id: string;
  fullName: string;
  phone?: string;
  role: UserRole;
  suspended: boolean;
}

// --------------------
// DRIVER
// --------------------

export interface Driver {
  id: string;
  userId: string;
  phone: string;

  status:
    | "pending"
    | "approved"
    | "rejected"
    | "suspended";

  passportPhotoPath?: string;
  nin?: string;
  driverPhotoPath?: string;
  motorcyclePhotoPath?: string;

  isOnline: boolean;

  currentLatitude?: number;
  currentLongitude?: number;
}

// --------------------
// RIDE
// --------------------

export interface Ride {
  id: string;

  riderId: string;

  driverId?: string;

  hub: Hub;

  direction: RideDirection;

  status: RideStatus;

  fare: number;

  driverPayout: number;

  pickupLatitude?: number;
  pickupLongitude?: number;

  destinationLatitude?: number;
  destinationLongitude?: number;

  requestedAt: string;
  acceptedAt?: string;
  startedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
}

// --------------------
// SUBSCRIPTION
// --------------------

export interface SubscriptionPlan {
  id: string;

  kind: SubscriptionKind;

  mode: SubscriptionMode;

  price: number;

  ridesPerDay: 1 | 2;
}

export interface Subscription {
  id: string;

  userId: string;

  planId: string;

  startsOn: string;

  endsOn: string;

  status:
    | "pending"
    | "active"
    | "expired"
    | "cancelled";
}

// --------------------
// WALLET
// --------------------

export interface Wallet {
  userId: string;

  rideCredit: number;

  rewardPoints: number;
}

// --------------------
// FOOD REWARD
// --------------------

export interface FoodReward {
  item: RewardItem;

  name: string;

  quantity: string;
}

// --------------------
// NOTIFICATIONS
// --------------------

export interface Notification {
  id: string;

  userId: string;

  title: string;

  body: string;

  readAt?: string;

  createdAt: string;
  }
