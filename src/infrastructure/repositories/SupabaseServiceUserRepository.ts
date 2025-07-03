
import { supabase } from '@/integrations/supabase/client';
import { ServiceUser } from '@/domain/entities/ServiceUser';
import { ServiceUserRepository } from '@/domain/repositories/ServiceUserRepository';

export class SupabaseServiceUserRepository implements ServiceUserRepository {
  async create(serviceUser: Omit<ServiceUser, 'id' | 'createdAt' | 'updatedAt'>): Promise<ServiceUser> {
    const { data, error } = await supabase
      .from('service_users')
      .insert({
        user_id: serviceUser.userId,
        name: serviceUser.name,
        phone_number: serviceUser.phoneNumber,
      })
      .select()
      .single();

    if (error) throw error;
    
    return {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      phoneNumber: data.phone_number,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  async findByUserId(userId: string): Promise<ServiceUser[]> {
    const { data, error } = await supabase
      .from('service_users')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;

    return data.map(item => ({
      id: item.id,
      userId: item.user_id,
      name: item.name,
      phoneNumber: item.phone_number,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }));
  }

  async findById(id: string): Promise<ServiceUser | null> {
    const { data, error } = await supabase
      .from('service_users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;

    return {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      phoneNumber: data.phone_number,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  async update(id: string, serviceUser: Partial<ServiceUser>): Promise<ServiceUser> {
    const { data, error } = await supabase
      .from('service_users')
      .update({
        name: serviceUser.name,
        phone_number: serviceUser.phoneNumber,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      phoneNumber: data.phone_number,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('service_users')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}
