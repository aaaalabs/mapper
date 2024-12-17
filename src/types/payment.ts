export interface Session {
  id: string;
  created_at: string;
  updated_at: string;
  user_id?: string;
  metadata?: Record<string, any>;
  status: 'active' | 'expired' | 'completed';
  expires_at?: string;
}

export interface PaymentOrder {
  id: string;
  created_at: string;
  updated_at: string;
  revolut_order_id: string;
  merchant_order_ref: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  session_id?: string;
  user_id?: string;
  metadata?: Record<string, any>;
}

export interface CreatePaymentOrderDTO {
  amount: number;
  currency: string;
  session_id?: string;
  user_id?: string;
  metadata?: Record<string, any>;
}
