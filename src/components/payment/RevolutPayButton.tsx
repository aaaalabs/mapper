import { useEffect, useRef } from 'react';
import { initializeRevolutPay, createRevolutOrder, updateOrderStatus } from '@/services/paymentService';
import { useSession } from '@/hooks/useSession';
import { useToast } from 'src/hooks/useToast';
import type { CreatePaymentOrderDTO } from '@/types/payment';

interface RevolutPayButtonProps {
  amount: number;
  currency: string;
  metadata?: Record<string, any>;
  onSuccess?: () => void;
  onError?: (error: any) => void;
  onCancel?: () => void;
}

export const RevolutPayButton = ({
  amount,
  currency,
  metadata,
  onSuccess,
  onError,
  onCancel,
}: RevolutPayButtonProps) => {
  const buttonRef = useRef<HTMLDivElement>(null);
  const { addToast } = useToast();
  const { session, loading } = useSession();

  useEffect(() => {
    const setupPayment = async () => {
      try {
        const revolutPay = await initializeRevolutPay();
        
        if (!buttonRef.current) return;

        let orderRef: string | null = null;

        const orderData: CreatePaymentOrderDTO = {
          amount,
          currency,
          session_id: session?.id || undefined,
          metadata: {
            ...metadata,
            session_metadata: session?.metadata || {}
          }
        };

        const paymentOptions = {
          currency,
          totalAmount: Math.round(amount * 100), // Convert to cents
          createOrder: async () => {
            try {
              const { publicId, orderRef: ref } = await createRevolutOrder(orderData);
              orderRef = ref;
              return { publicId };
            } catch (error) {
              console.error('Error creating payment order:', error);
              addToast({
                title: 'Payment Error',
                description: error instanceof Error ? error.message : 'Failed to create payment order. Please try again.',
                variant: 'destructive',
              });
              if (onError) onError(error);
              throw error;
            }
          },
          redirectUrls: {
            success: `${window.location.origin}/payment/success`,
            failure: `${window.location.origin}/payment/failure`,
            cancel: `${window.location.origin}/payment/cancel`,
          },
        };

        revolutPay.mount(buttonRef.current, paymentOptions);

        revolutPay.on('payment', async (event) => {
          if (!orderRef) {
            console.error('No order reference found');
            return;
          }

          try {
            switch (event.type) {
              case 'success':
                await updateOrderStatus(orderRef, 'completed');
                addToast({
                  title: 'Payment Successful',
                  description: 'Your payment has been processed successfully.',
                  variant: 'default',
                });
                if (onSuccess) onSuccess();
                break;
              case 'cancel':
                await updateOrderStatus(orderRef, 'cancelled');
                addToast({
                  title: 'Payment Cancelled',
                  description: 'You have cancelled the payment.',
                  variant: 'default',
                });
                if (onCancel) onCancel();
                break;
              case 'error':
                await updateOrderStatus(orderRef, 'failed');
                addToast({
                  title: 'Payment Failed',
                  description: event.error?.message || 'Payment processing failed. Please try again.',
                  variant: 'destructive',
                });
                if (onError) onError(event.error);
                break;
            }
          } catch (error) {
            console.error('Error processing payment event:', error);
            addToast({
              title: 'Payment Status Update Failed',
              description: 'Failed to update payment status. Please contact support.',
              variant: 'destructive',
            });
          }
        });
      } catch (error) {
        console.error('Failed to initialize Revolut Pay:', error);
        addToast({
          title: 'Payment Error',
          description: 'Failed to initialize payment system. Please try again.',
          variant: 'destructive',
        });
      }
    };

    setupPayment();
  }, [session, loading, amount, currency, metadata, onSuccess, onError, onCancel, addToast]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return <div ref={buttonRef} id="revolut-pay-button" />;
};
