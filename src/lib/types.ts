// ============================================================
// Tipos centrales para Santiago te Premia
// ============================================================

// --- Enums ---

export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  BUSINESS = 'BUSINESS',
  HOTEL = 'HOTEL',
}

export type BusinessStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING';

export type PromotionStatus = 'ACTIVE' | 'INACTIVE' | 'EXPIRED';

export type CampaignStatus = 'DRAFT' | 'SENT' | 'SCHEDULED';

export type VoucherStatus = 'GENERATED' | 'REDEEMED' | 'EXPIRED';

// --- Modelos principales ---

export interface User {
  id: string;
  email: string;
  password?: string;
  name: string;
  role: Role;
  business_id?: string | null;
  hotel_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  created_at: string;
}

export interface Business {
  id: string;
  name: string;
  category: string;
  category_id?: string;
  address: string;
  description?: string;
  phone?: string;
  email?: string;
  logo_url?: string;
  status: BusinessStatus;
  created_at: string;
  updated_at: string;
  // Relaciones
  promotions?: Promotion[];
  users?: User[];
  category_info?: Category;
}

export interface Promotion {
  id: string;
  business_id: string;
  title: string;
  description: string;
  discount_type?: string;
  discount_value?: number;
  max_uses?: number;
  current_uses: number;
  active: boolean;
  status: PromotionStatus;
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
  // Relaciones
  business?: Business;
}

export interface PointOfInterest {
  id: string;
  name: string;
  type: string; // 'HOTEL' | 'ATRACCION' | 'OFICINA_TURISMO'
  address: string;
  qr_identifier: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Tourist {
  id: string;
  phone: string;
  name?: string;
  last_name?: string;
  birth_date?: string;
  country?: string;
  province?: string;
  city?: string;
  email?: string;
  pin_secret: string;
  poi_id?: string;
  hotel_id?: string;
  registration_step?: string;
  created_at: string;
  updated_at: string;
  // Relaciones
  point_of_interest?: PointOfInterest;
}

export interface Redemption {
  id: string;
  tourist_id: string;
  promotion_id: string;
  business_id: string;
  pin_used: string;
  validated_by_user_id?: string;
  created_at: string;
  // Relaciones
  tourist?: Tourist;
  promotion?: Promotion;
  business?: Business;
}

export interface Campaign {
  id: string;
  title: string;
  message: string;
  target_audience?: string;
  status: CampaignStatus;
  sent_at?: string;
  scheduled_at?: string;
  recipients_count?: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface SystemSettings {
  id: string;
  pin_expiration_seconds: number;
  welcome_message: string;
  max_promotions_per_business: number;
  maintenance_mode: boolean;
  updated_at: string;
}

// --- Respuestas de API ---

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  per_page: number;
}

export interface LoginResponse {
  token: string;
  user: Omit<User, 'password'>;
  business?: Business;
}

export interface PinResponse {
  pin: string;
  expires_in_seconds: number;
}

export interface DashboardStats {
  total_tourists: number;
  tourists_today: number;
  total_businesses: number;
  active_businesses: number;
  total_redemptions: number;
  redemptions_today: number;
  active_promotions: number;
  total_campaigns: number;
  top_businesses: Array<{ id: string; name: string; redemption_count: number }>;
  top_promotions: Array<{ id: string; title: string; usage_count: number; business_name: string }>;
  registrations_by_poi: Array<{ poi_id: string; poi_name: string; count: number }>;
}

export interface BusinessStats {
  total_redemptions: number;
  redemptions_today: number;
  active_promotions: number;
  unique_tourists: number;
  redemptions_by_day: Array<{ date: string; count: number }>;
  top_promotions: Array<{ id: string; title: string; usage_count: number }>;
}
