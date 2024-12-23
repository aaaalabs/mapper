import axios from 'axios';
import RevolutCheckout from '@revolut/checkout';
import { supabase } from '../lib/supabase';
import { trackEvent, trackError, ERROR_SEVERITY, ERROR_CATEGORY } from './analytics';
import { ANALYTICS_EVENTS } from './analytics';
import { v4 as uuidv4 } from 'uuid';
import type { CreatePaymentOrderDTO, PaymentOrder, PaymentConfig } from '../types/payment';
import type { Database } from '../types/supabase';

// API client configuration
const revolutApi = axios.create({
  baseURL: '/api/revolut',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor for debugging
revolutApi.interceptors.request.use(
  config => {
    console.log('Making request to:', config.url, {
      method: config.method,
      headers: config.headers,
      data: config.data
    });
    return config;
  },
  error => {
    console.error('Request setup error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for better error handling
revolutApi.interceptors.response.use(
  response => {
    console.log('Successful response:', {
      status: response.status,
      data: response.data
    });
    return response;
  },
  (error: any) => {
    if (error.response) {
      console.error('Revolut API Error:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers,
        config: error.config
      });
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Error setting up request:', error.message);
    }
    return Promise.reject(error);
  }
);

// Initialize Revolut Pay widget
export const initializeRevolutPay = async () => {
  const { revolutPay } = await RevolutCheckout.payments({
    publicToken: import.meta.env.VITE_REVOLUT_SANDBOX_PK,
    mode: 'sandbox', // Change to 'prod' for production
    locale: 'en' // Adding required locale parameter
  });
  return revolutPay;
};

// Create or get anonymous session
const getOrCreateAnonymousSession = async () => {
  // Try to get existing session from localStorage
  const storedSessionId = localStorage.getItem('anonymous_session_id');
  
  if (storedSessionId) {
    const { data: session, error } = await supabase
      .from('map_sessions')
      .select('*')
      .eq('id', storedSessionId)
      .single();
    
    if (error) {
      throw new Error('Failed to fetch session');
    }

    if (session && session.status === 'active') {
      return session.id;
    }
  }
  
  // Create new session if none exists
  const { data: newSession, error } = await supabase
    .from('map_sessions')
    .insert({
      status: 'active',
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    })
    .select()
    .single();
    
  if (error) {
    throw new Error('Failed to create anonymous session');
  }
  
  // Store session ID in localStorage
  localStorage.setItem('anonymous_session_id', newSession.id);
  return newSession.id;
};

// Create payment order in both Supabase and Revolut
export const createRevolutOrder = async (orderData: CreatePaymentOrderDTO): Promise<{ publicId: string; orderRef: string; order: PaymentOrder }> => {
  try {
    // Ensure we have a session ID
    const sessionId = await getOrCreateAnonymousSession();

    // Generate a unique merchant order reference
    const merchantOrderRef = `order_${uuidv4()}`;

    // Convert amount to cents
    const amountInCents = Math.round(orderData.amount * 100);

    console.log('Creating Revolut order with data:', {
      amount: amountInCents,
      currency: orderData.currency,
      merchant_order_ext_ref: merchantOrderRef,
      customer_email: orderData.metadata?.customerEmail,
      customer_name: orderData.metadata?.customerName
    });

    // Create order in Revolut
    const revolutResponse = await revolutApi.post('/orders', {
      amount: amountInCents,
      currency: orderData.currency,
      merchant_order_ext_ref: merchantOrderRef,
      description: 'Data extraction session',
      customer_email: orderData.metadata?.customerEmail,
      customer_name: orderData.metadata?.customerName
    });

    console.log('Revolut order created:', revolutResponse.data);

    // Create order in Supabase with session ID
    const { data: order, error } = await supabase
      .from('map_payment_orders')
      .insert({
        revolut_order_id: revolutResponse.data.id,
        merchant_order_ref: merchantOrderRef,
        amount: orderData.amount,
        currency: orderData.currency,
        status: 'pending',
        session_id: sessionId, // Always include session ID
        metadata: orderData.metadata || {} // Change null to empty object to match type
      })
      .select()
      .single();

    if (error) {
      throw new Error('Failed to create order in Supabase');
    }

    await trackEvent({
      event_name: ANALYTICS_EVENTS.ORDER.CREATED,
      event_data: { amount: orderData.amount, orderId: order.id }
    });

    return {
      publicId: revolutResponse.data.public_id,
      orderRef: merchantOrderRef,
      order
    };
  } catch (error) {
    await trackError(error instanceof Error ? error : new Error('Failed to create payment order'), {
      category: ERROR_CATEGORY.PAYMENT,
      severity: ERROR_SEVERITY.HIGH,
      metadata: { amount: orderData.amount }
    });
    throw error;
  }
};

// Update order status
export const updateOrderStatus = async (merchantOrderRef: string, status: PaymentOrder['status']) => {
  try {
    const { error } = await supabase
      .from('map_payment_orders')
      .update({ status })
      .eq('merchant_order_ref', merchantOrderRef);

    if (error) {
      throw new Error(`Failed to update order status: ${error.message}`);
    }
  } catch (error) {
    await trackError(error instanceof Error ? error : new Error('Failed to update order status'), {
      category: ERROR_CATEGORY.PAYMENT,
      severity: ERROR_SEVERITY.HIGH,
      metadata: { merchantOrderRef, status }
    });
    throw error;
  }
};

// Get order by merchant reference
export const getOrderByRef = async (merchantOrderRef: string): Promise<PaymentOrder | null> => {
  try {
    const { data, error } = await supabase
      .from('map_payment_orders')
      .select('*')
      .eq('merchant_order_ref', merchantOrderRef)
      .single();

    if (error) {
      throw new Error(`Failed to fetch order: ${error.message}`);
    }

    return data;
  } catch (error) {
    await trackError(error instanceof Error ? error : new Error('Failed to fetch order'), {
      category: ERROR_CATEGORY.PAYMENT,
      severity: ERROR_SEVERITY.MEDIUM,
      metadata: { merchantOrderRef }
    });
    throw error;
  }
};

type PaymentOrderUpdate = Database['public']['Tables']['map_payment_orders']['Update'];

const getPaymentConfig = async (): Promise<PaymentConfig> => {
  const { data, error } = await supabase
    .from('map_admin_settings')
    .select('settings')
    .single();

  if (error) {
    throw new Error('Failed to fetch payment configuration');
  }

  const settings = data?.settings || { paymentEnvironment: 'sandbox', enablePaymentLogging: true };
  
  const apiKey = settings.paymentEnvironment === 'sandbox' 
    ? process.env.NEXT_PUBLIC_REVOLUT_SANDBOX_KEY 
    : process.env.NEXT_PUBLIC_REVOLUT_PRODUCTION_KEY;

  if (!apiKey) {
    throw new Error(`Missing ${settings.paymentEnvironment} API key`);
  }

  return {
    apiKey,
    enableLogging: settings.enablePaymentLogging ?? true
  };
};

export async function processPayment(amount: number, currency: string) {
  try {
    await trackEvent({
      event_name: ANALYTICS_EVENTS.ORDER.CREATED,
      event_data: { amount, currency }
    });

    // Payment processing logic here

    await trackEvent({
      event_name: ANALYTICS_EVENTS.ORDER.COMPLETED,
      event_data: { amount, currency }
    });
  } catch (error) {
    await trackEvent({
      event_name: ANALYTICS_EVENTS.ORDER.FAILED,
      event_data: { 
        amount, 
        currency, 
        error: error instanceof Error ? error.message : String(error) 
      }
    });

    await trackError(error instanceof Error ? error : new Error('Payment processing failed'), {
      category: ERROR_CATEGORY.PAYMENT,
      severity: ERROR_SEVERITY.HIGH,
      metadata: { amount, currency }
    });
    throw error;
  }
}

export const createPaymentOrder = async (amount: number): Promise<string> => {
  try {
    await getPaymentConfig();
    
    await trackEvent({
      event_name: ANALYTICS_EVENTS.ORDER.INITIATED,
      event_data: { amount }
    });

    // Generate a unique merchant order reference
    const merchantOrderRef = `order_${uuidv4()}`;

    // Convert amount to cents
    const amountInCents = Math.round(amount * 100);

    // Create order in Revolut
    const revolutResponse = await revolutApi.post('/orders', {
      amount: amountInCents,
      currency: 'EUR', // Default currency for now
      merchant_order_ext_ref: merchantOrderRef,
      description: 'Data extraction session'
    });

    console.log('Revolut order created:', revolutResponse.data);

    // Create order in Supabase
    const { data: order, error } = await supabase
      .from('map_payment_orders')
      .insert({
        revolut_order_id: revolutResponse.data.id,
        merchant_order_ref: merchantOrderRef,
        amount,
        currency: 'EUR', // Default currency for now
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      throw new Error('Failed to create order in Supabase');
    }

    await trackEvent({
      event_name: ANALYTICS_EVENTS.ORDER.CREATED,
      event_data: { amount, orderId: order.id }
    });

    return revolutResponse.data.public_id;
  } catch (error) {
    await trackError(error instanceof Error ? error : new Error('Failed to create payment order'), {
      category: ERROR_CATEGORY.PAYMENT,
      severity: ERROR_SEVERITY.HIGH,
      metadata: { amount }
    });
    throw error;
  }
};

const updatePaymentOrder = async (orderId: string, status: PaymentOrder['status'], metadata: Record<string, any>): Promise<PaymentOrder> => {
  try {
    const updateData: PaymentOrderUpdate = {
      status,
      metadata,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('map_payment_orders')
      .update(updateData)
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    await trackError(error instanceof Error ? error : new Error('Failed to update payment order'), {
      category: ERROR_CATEGORY.PAYMENT,
      severity: ERROR_SEVERITY.HIGH,
      metadata: {
        orderId,
        status,
        metadata: JSON.stringify(metadata)
      }
    });
    throw error;
  }
};

const getPaymentOrder = async (orderId: string): Promise<PaymentOrder | null> => {
  try {
    const { data, error } = await supabase
      .from('map_payment_orders')
      .select()
      .eq('id', orderId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data;
  } catch (error) {
    await trackError(error instanceof Error ? error : new Error('Failed to get payment order'), {
      category: ERROR_CATEGORY.PAYMENT,
      severity: ERROR_SEVERITY.MEDIUM,
      metadata: { orderId }
    });
    throw error;
  }
};

export const paymentService = {
  createPaymentOrder,
  updatePaymentOrder,
  getPaymentOrder
};
