import { Database } from './supabase';

export type Session = Database['public']['Tables']['map_sessions']['Row'];

export type PaymentOrder = Database['public']['Tables']['map_payment_orders']['Row'];

export interface CreatePaymentOrderDTO {
  amount: number;
  currency: string;
  metadata?: Record<string, any>;
  session_id?: string;
}
