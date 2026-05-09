import { supabase } from '@/lib/supabase';
import { Payment, PaymentMethod, PaymentStatus, TransactionStatus } from '@/types';

export const paymentService = {
  async createPayment(paymentData: {
    userId: string;
    vehicleId: string;
    amount: number;
    paymentMethod: PaymentMethod;
    transactionRef?: string;
  }): Promise<Payment> {
    try {
      const { data, error } = await supabase
        .from('payments')
        .insert([{
          user_id: paymentData.userId,
          vehicle_id: paymentData.vehicleId,
          amount: paymentData.amount,
          payment_method: paymentData.paymentMethod,
          transaction_ref: paymentData.transactionRef,
          status: 'pending'
        }])
        .select();

      if (error) throw error;
      
      // Update vehicle payment status to pending
      await supabase
        .from('vehicles')
        .update({ payment_status: 'pending' })
        .eq('id', paymentData.vehicleId);

      return {
        id: data[0].id,
        userId: data[0].user_id,
        vehicleId: data[0].vehicle_id,
        amount: data[0].amount,
        paymentMethod: data[0].payment_method,
        transactionRef: data[0].transaction_ref,
        status: data[0].status as TransactionStatus,
        createdAt: data[0].created_at
      };
    } catch (error) {
      console.error('Error creating payment:', error);
      throw error;
    }
  },

  async updatePaymentStatus(paymentId: string, status: TransactionStatus): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('payments')
        .update({ status })
        .eq('id', paymentId)
        .select();

      if (error) throw error;

      // If payment is completed, update vehicle status
      if (status === 'completed' && data && data.length > 0) {
        await supabase
          .from('vehicles')
          .update({ payment_status: 'paid', status: 'active' })
          .eq('id', data[0].vehicle_id);
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
      throw error;
    }
  },

  async createStripeSession(data: {
    vehicleId: string;
    amount: number;
    listingType: string;
    successUrl: string;
    cancelUrl: string;
    idToken: string;
  }): Promise<{ id: string; url: string }> {
    try {
      const response = await fetch('/api/payments/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${data.idToken}`
        },
        body: JSON.stringify({
          vehicleId: data.vehicleId,
          amount: data.amount,
          listingType: data.listingType,
          successUrl: data.successUrl,
          cancelUrl: data.cancelUrl
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create payment session');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating Stripe session:', error);
      throw error;
    }
  },

  async verifyStripeSession(sessionId: string, vehicleId: string, idToken: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/payments/verify-session?sessionId=${sessionId}&vehicleId=${vehicleId}`, {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });

      if (!response.ok) return false;
      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('Error verifying Stripe session:', error);
      return false;
    }
  },

  async fetchAllPayments(): Promise<Payment[]> {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(p => ({
        id: p.id,
        userId: p.user_id,
        vehicleId: p.vehicle_id,
        amount: p.amount,
        paymentMethod: p.payment_method,
        transactionRef: p.transaction_ref,
        status: p.status as TransactionStatus,
        createdAt: p.created_at
      }));
    } catch (error) {
      console.error('Error fetching all payments:', error);
      throw error;
    }
  }
};
