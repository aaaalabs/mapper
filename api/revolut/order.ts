import { Request, Response } from 'express';
import axios from 'axios';

const REVOLUT_API_KEY = process.env.REVOLUT_API_KEY;
const REVOLUT_API_URL = process.env.NODE_ENV === 'production'
  ? 'https://merchant.revolut.com/api/1.0'
  : 'https://sandbox-merchant.revolut.com/api/1.0';

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { amount, currency, customerEmail } = req.body;

    // Validate required fields
    if (!amount || !currency || !customerEmail) {
      return res.status(400).json({ 
        error: 'Missing required fields: amount, currency, and customerEmail are required' 
      });
    }

    // Create order in Revolut
    const response = await axios.post(
      `${REVOLUT_API_URL}/orders`,
      {
        amount,
        currency,
        capture_mode: 'AUTOMATIC',
        merchant_order_ext_ref: `order_${Date.now()}`,
        customer_email: customerEmail,
        description: 'Subscription payment',
        payment_methods: ['card']
      },
      {
        headers: {
          'Authorization': `Bearer ${REVOLUT_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Return the order details
    return res.status(200).json({
      public_id: response.data.public_id,
      order_id: response.data.id
    });
  } catch (error) {
    console.error('Error creating Revolut order:', error);
    
    if (axios.isAxiosError(error)) {
      return res.status(error.response?.status || 500).json({
        error: error.response?.data?.message || 'Failed to create payment order'
      });
    }

    return res.status(500).json({ 
      error: 'Internal server error while creating payment order' 
    });
  }
}
