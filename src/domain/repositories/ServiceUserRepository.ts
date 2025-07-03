
import { ServiceUser } from '../entities/ServiceUser';

export interface ServiceUserRepository {
  create(serviceUser: Omit<ServiceUser, 'id' | 'createdAt' | 'updatedAt'>): Promise<ServiceUser>;
  findByUserId(userId: string): Promise<ServiceUser[]>;
  findById(id: string): Promise<ServiceUser | null>;
  update(id: string, serviceUser: Partial<ServiceUser>): Promise<ServiceUser>;
  delete(id: string): Promise<void>;
}
