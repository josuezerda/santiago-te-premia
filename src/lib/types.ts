// ============================================================
// Tipos centrales para Santiago te Premia
// Alineados con el esquema real de Supabase
// ============================================================

// --- Enums ---

export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  BUSINESS = 'BUSINESS',
}

export type BusinessStatus = 'ACTIVE' | 'PAUSED' | 'SUSPENDED';

export type PoiType = 'HOTEL' | 'TOURIST_SPOT' | 'COMMERCE' | 'OTHER';

export type PromotionType = 'PERCENTAGE' | 'TWO_FOR_ONE' | 'GIFT' | 'SPECIAL' | 'EXCLUSIVE' | 'BY_DATE' | 'BY_CATEGORY';

export type PromotionStatus = 'ACTIVE' | 'INACTIVE' | 'EXPIRED';

export type RedemptionStatus = 'COMPLETED' | 'CANCELLED';

export type CampaignSegment = 'ALL_TOURISTS' | 'BY_HOTEL' | 'BY_CATEGORY' | 'BY_BUSINESS' | 'CUSTOM';

export type CampaignStatus = 'DRAFT' | 'SENDING' | 'SENT' | 'FAILED';

export type VoucherStatus = 'GENERATED' | 'REDEEMED' | 'EXPIRED';

// --- Modelos principales ---

export interface User {
  id: string;
  email: string;
  password_hash?: string;
  name: string;
  role: Role;
  business_id?: string | null;
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
  trade_name?: string;
  cuit?: string;
  category_id?: string;
  logo_url?: string;
  photos?: string[];
  address: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  whatsapp?: string;
  instagram?: string;
  website?: string;
  schedule?: Record<string, unknown>;
  description?: string;
  benefit_percentage?: number;
  benefit_conditions?: string;
  status: BusinessStatus;
  can_send_campaigns?: boolean;
  can_edit_offers?: boolean;
  created_at: string;
  updated_at: string;
  // Relaciones (joins de Supabase)
  categories?: { name: string } | { name: string }[];
  promotions?: Promotion[];
  users?: User[];
}

export interface Promotion {
  id: string;
  business_id: string;
  title: string;
  description: string;
  type: PromotionType;
  discount_value: number;
  conditions?: string;
  max_uses?: number | null;
  current_uses: number;
  start_date?: string;
  end_date?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Campo derivado para compatibilidad con frontend
  status?: PromotionStatus;
  // Relaciones
  business?: Business;
  businesses?: { name: string };
}

export interface PointOfInterest {
  id: string;
  name: string;
  type: PoiType;
  address: string;
  qr_identifier: string;
  description?: string;
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
  poi_id?: string;
  pin_secret: string;
  is_subscribed?: boolean;
  created_at: string;
  updated_at: string;
  // Relaciones
  points_of_interest?: { name: string };
}

export interface Redemption {
  id: string;
  tourist_id: string;
  promotion_id: string;
  business_id: string;
  pin_used: string;
  validated_by_user_id: string;
  status: RedemptionStatus;
  created_at: string;
  // Relaciones
  tourists?: { name: string; last_name: string; phone?: string; country?: string };
  promotions?: { title: string };
  businesses?: { name: string };
  users?: { name: string };
}

export interface Campaign {
  id: string;
  title: string;
  template_name?: string;
  template_params?: Record<string, unknown>;
  segment: CampaignSegment;
  segment_filter?: Record<string, unknown>;
  status: CampaignStatus;
  sent_count: number;
  delivered_count: number;
  read_count: number;
  created_by_user_id?: string;
  business_id?: string | null;
  created_at: string;
  sent_at?: string | null;
}

export interface Reservation {
  id: string;
  tourist_id: string;
  promotion_id: string;
  business_id: string;
  status: 'ACTIVE' | 'COMPLETED' | 'EXPIRED';
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface SystemSettings {
  id: string;
  whatsapp_api_token: string;
  whatsapp_verify_token: string;
  whatsapp_phone_number_id: string;
  whatsapp_business_account_id: string;
  webhook_url: string;
  pin_expiration_seconds: number;
  welcome_message: string;
  main_menu_config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface BusinessValidator {
  id: string;
  business_id: string;
  phone: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

export interface ConversationState {
  id: string;
  phone: string;
  state: string;
  data: Record<string, unknown>;
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
  user: Omit<User, 'password_hash'>;
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
