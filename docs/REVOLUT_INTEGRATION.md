# Revolut Pay Integration Guide for Mapper

This document provides a comprehensive guide for the Revolut Pay integration in the Mapper application, enabling secure payment processing for data extraction sessions.

## Configuration

### Environment Variables

```env
# Revolut API Configuration
VITE_REVOLUT_API_URL=https://sandbox-merchant.revolut.com/api/1.0
VITE_REVOLUT_SANDBOX_API_KEY=your_revolut_sandbox_api_key
VITE_REVOLUT_SANDBOX_PK=your_revolut_sandbox_public_key
```

## Implementation Details

### 1. Payment Service (`src/services/paymentService.ts`)

The payment service handles all Revolut API interactions:

```typescript
import axios from 'axios';
import RevolutCheckout from '@revolut/checkout';

// API client configuration
const revolutApi = axios.create({
  baseURL: import.meta.env.VITE_REVOLUT_API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${import.meta.env.VITE_REVOLUT_SANDBOX_API_KEY}`
  }
});

// Order creation interface
interface CreateOrderRequest {
  amount: number;
  currency: string;
  merchant_order_ext_ref: string;
  description: string;
}

// Initialize Revolut Pay widget
export const initializeRevolutPay = async () => {
  const { revolutPay } = await RevolutCheckout.payments({
    publicToken: import.meta.env.VITE_REVOLUT_SANDBOX_PK,
    mode: 'sandbox' // Change to 'prod' for production
  });
  return revolutPay;
};

// Create payment order
export const createOrder = async (amount: number): Promise<string> => {
  const order = await revolutApi.post('/order', {
    amount: amount * 100, // Convert to cents
    currency: 'EUR',
    merchant_order_ext_ref: `session_${Date.now()}`,
    description: 'Data extraction session'
  });
  return order.data.token;
};
```

### 2. Payment Component Integration

Example implementation in your React component:

```typescript
import { useEffect, useRef } from 'react';
import { initializeRevolutPay, createOrder } from '../services/paymentService';

const PaymentComponent = () => {
  const buttonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const setupPayment = async () => {
      const revolutPay = await initializeRevolutPay();
      
      if (buttonRef.current) {
        revolutPay.mount(buttonRef.current, {
          currency: 'EUR',
          totalAmount: 990, // €9.90 in cents
          createOrder: async () => {
            const token = await createOrder(9.90);
            return { publicId: token };
          },
          redirectUrls: {
            success: `${window.location.origin}/success`,
            failure: `${window.location.origin}/failure`,
            cancel: `${window.location.origin}/cancel`
          }
        });

        revolutPay.on('payment', (event) => {
          switch (event.type) {
            case 'success':
              // Handle successful payment
              break;
            case 'error':
              console.error('Payment error:', event.error);
              break;
            case 'cancel':
              // Handle payment cancellation
              break;
          }
        });
      }
    };

    setupPayment();
  }, []);

  return <div ref={buttonRef} id="revolut-pay-button" />;
};
```

## Database Schema

The payment orders are tracked in the `map_payment_orders` table:

```sql
create table map_payment_orders (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  revolut_order_id text not null,
  merchant_order_ref text not null unique,
  amount numeric not null,
  currency text not null,
  status text not null default 'pending',
  session_id uuid references map_sessions(id),
  user_id uuid references auth.users(id),
  metadata jsonb
);
```

### Component Usage

Example of using the RevolutPayButton component:

```typescript
import { RevolutPayButton } from '@/components/payment/RevolutPayButton';

const PaymentPage = () => {
  const orderData = {
    amount: 9.90,
    currency: 'EUR',
    session_id: 'current-session-id', // Optional
    user_id: 'current-user-id',       // Optional
    metadata: {                       // Optional
      product: 'data_extraction',
      plan: 'basic'
    }
  };

  return (
    <RevolutPayButton
      orderData={orderData}
      onSuccess={() => {
        // Handle successful payment
        console.log('Payment successful');
      }}
      onError={(error) => {
        // Handle payment error
        console.error('Payment failed:', error);
      }}
      onCancel={() => {
        // Handle payment cancellation
        console.log('Payment cancelled');
      }}
    />
  );
};
```

### Order Tracking

The integration now includes comprehensive order tracking:

1. When a payment is initiated:
   - Creates an order record in Supabase with status 'pending'
   - Generates a unique merchant reference ID
   - Creates the order in Revolut's system

2. Payment status updates:
   - Success: Updates status to 'completed'
   - Failure: Updates status to 'failed'
   - Cancellation: Updates status to 'cancelled'

3. Order retrieval:
   - Orders can be queried by merchant reference ID
   - Full payment history is available in Supabase
   - Status updates are tracked in real-time

### Security Considerations

1. Row Level Security (RLS) policies ensure:
   - Anonymous users can only create new orders
   - Users can only view their own orders
   - Orders are linked to sessions for tracking

2. Sensitive Data:
   - API keys are stored in environment variables
   - Payment details are never stored in Supabase
   - Order IDs are used for reference instead of sensitive data

## Testing

### Sandbox Testing

1. Use the sandbox environment for testing:
   - API URL: https://sandbox-merchant.revolut.com/api/1.0
   - Use sandbox API keys from your Revolut Business account

2. Test Card Numbers:
   ```
   Success: 4929420573595709
   Failure: 4929420573595717
   3D Secure: 4929420573595725
   ```

### Error Handling

The integration includes comprehensive error handling for:
- Network failures
- Invalid API responses
- Payment processing errors
- User cancellations

## Production Deployment

When deploying to production:

1. Update environment variables:
   - Switch to production API URL
   - Use production API keys
   - Set mode to 'prod' in RevolutCheckout initialization

2. Verify SSL certificates are properly configured

3. Implement proper monitoring and logging for payment events

## Troubleshooting

Common issues and solutions:

1. Connection Refused Error:
   - Verify API endpoints are accessible
   - Check API key permissions
   - Ensure proper CORS configuration

2. Payment Widget Not Loading:
   - Verify public key is correct
   - Check for JavaScript console errors
   - Ensure DOM element exists before mounting

3. Payment Processing Errors:
   - Log all API responses
   - Verify order creation parameters
   - Check payment amount formatting

## Support

For additional support:
- Revolut API Documentation: https://developer.revolut.com/docs/accept-payments
- Revolut Developer Dashboard: https://business.revolut.com/developer
- Support Email: merchant.support@revolut.com

## Version History

- v1.0.0 (2024-12-17): Initial integration with sandbox environment
- v1.1.0 (2024-12-18): Added Supabase integration and order tracking
