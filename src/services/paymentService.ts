import axios from 'axios';
import RevolutCheckout from '@revolut/checkout';
import { supabase } from '../lib/supabaseClient';
import { v4 as uuidv4 } from 'uuid';
import type { CreatePaymentOrderDTO, PaymentOrder } from '../types/payment';

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
    mode: 'sandbox' // Change to 'prod' for production
  });
  return revolutPay;
};

// Create or get anonymous session
const getOrCreateAnonymousSession = async () => {
  // Try to get existing session from localStorage
  const storedSessionId = localStorage.getItem('anonymous_session_id');
  
  if (storedSessionId) {
    const { data: session } = await supabase
      .from('map_sessions')
      .select('*')
      .eq('id', storedSessionId)
      .single();
    
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
    
  if (error) throw new Error('Failed to create anonymous session');
  
  // Store session ID in localStorage
  localStorage.setItem('anonymous_session_id', newSession.id);
  return newSession.id;
};

// Create payment order in both Supabase and Revolut
export const createRevolutOrder = async (orderData: CreatePaymentOrderDTO): Promise<{ publicId: string; orderRef: string }> => {
  try {
    // Ensure we have a session ID
    const sessionId = await getOrCreateAnonymousSession();

    // Generate a unique merchant order reference
    const merchantOrderRef = `order_${uuidv4()}`;

    console.log('Creating Revolut order with data:', {
      amount: Math.round(orderData.amount * 100),
      currency: orderData.currency,
      merchant_order_ext_ref: merchantOrderRef
    });

    // Create order in Revolut
    const revolutResponse = await revolutApi.post('/orders', {
      amount: Math.round(orderData.amount * 100),
      currency: orderData.currency,
      merchant_order_ext_ref: merchantOrderRef,
      description: 'Data extraction session'
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
        user_id: orderData.user_id || null,
        metadata: orderData.metadata || null
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create payment order: ${error.message}`);
    }

    return {
      publicId: revolutResponse.data.public_id,
      orderRef: merchantOrderRef
    };
  } catch (error) {
    console.error('Error creating payment order:', error);
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
    console.error('Error updating order status:', error);
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
    console.error('Error fetching order:', error);
    throw error;
  }
};
