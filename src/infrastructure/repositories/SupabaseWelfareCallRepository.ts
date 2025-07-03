
import { supabase } from '@/integrations/supabase/client';
import { WelfareCall } from '@/domain/entities/WelfareCall';
import { WelfareCallRepository } from '@/domain/repositories/WelfareCallRepository';

export class SupabaseWelfareCallRepository implements WelfareCallRepository {
  async create(welfareCall: Omit<WelfareCall, 'id' | 'createdAt' | 'updatedAt'>): Promise<WelfareCall> {
    const { data, error } = await supabase
      .from('welfare_calls')
      .insert({
        user_id: welfareCall.userId,
        service_user_id: welfareCall.serviceUserId,
        message: welfareCall.message,
        phone_number: welfareCall.phoneNumber,
        service_user_name: welfareCall.serviceUserName,
        status: welfareCall.status,
        call_id: welfareCall.callId,
        call_response: welfareCall.callResponse,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      userId: data.user_id,
      serviceUserId: data.service_user_id,
      message: data.message,
      phoneNumber: data.phone_number,
      serviceUserName: data.service_user_name,
      status: data.status,
      callId: data.call_id,
      callResponse: data.call_response,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  async findByUserId(userId: string): Promise<WelfareCall[]> {
    const { data, error } = await supabase
      .from('welfare_calls')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(item => ({
      id: item.id,
      userId: item.user_id,
      serviceUserId: item.service_user_id,
      message: item.message,
      phoneNumber: item.phone_number,
      serviceUserName: item.service_user_name,
      status: item.status,
      callId: item.call_id,
      callResponse: item.call_response,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }));
  }

  async findById(id: string): Promise<WelfareCall | null> {
    const { data, error } = await supabase
      .from('welfare_calls')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;

    return {
      id: data.id,
      userId: data.user_id,
      serviceUserId: data.service_user_id,
      message: data.message,
      phoneNumber: data.phone_number,
      serviceUserName: data.service_user_name,
      status: data.status,
      callId: data.call_id,
      callResponse: data.call_response,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  async update(id: string, welfareCall: Partial<WelfareCall>): Promise<WelfareCall> {
    const { data, error } = await supabase
      .from('welfare_calls')
      .update({
        status: welfareCall.status,
        call_id: welfareCall.callId,
        call_response: welfareCall.callResponse,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      userId: data.user_id,
      serviceUserId: data.service_user_id,
      message: data.message,
      phoneNumber: data.phone_number,
      serviceUserName: data.service_user_name,
      status: data.status,
      callId: data.call_id,
      callResponse: data.call_response,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }
}
