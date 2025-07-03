
import { ServiceUserRepository } from '@/domain/repositories/ServiceUserRepository';

export class CreateServiceUserUseCase {
  constructor(private serviceUserRepository: ServiceUserRepository) {}

  async execute(params: {
    userId: string;
    name: string;
    phoneNumber: string;
  }) {
    return await this.serviceUserRepository.create(params);
  }
}
