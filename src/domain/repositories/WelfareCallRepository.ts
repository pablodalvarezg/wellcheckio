
import { WelfareCall } from '../entities/WelfareCall';

export interface WelfareCallRepository {
  create(welfareCall: Omit<WelfareCall, 'id' | 'createdAt' | 'updatedAt'>): Promise<WelfareCall>;
  findByUserId(userId: string): Promise<WelfareCall[]>;
  findById(id: string): Promise<WelfareCall | null>;
  update(id: string, welfareCall: Partial<WelfareCall>): Promise<WelfareCall>;
}
