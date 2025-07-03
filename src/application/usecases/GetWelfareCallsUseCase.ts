
import { WelfareCallRepository } from '@/domain/repositories/WelfareCallRepository';

export class GetWelfareCallsUseCase {
  constructor(private welfareCallRepository: WelfareCallRepository) {}

  async execute(userId: string) {
    return await this.welfareCallRepository.findByUserId(userId);
  }
}
