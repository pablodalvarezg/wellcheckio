
import { ServiceUserRepository } from '@/domain/repositories/ServiceUserRepository';

export class GetServiceUsersUseCase {
  constructor(private serviceUserRepository: ServiceUserRepository) {}

  async execute(userId: string) {
    return await this.serviceUserRepository.findByUserId(userId);
  }
}
