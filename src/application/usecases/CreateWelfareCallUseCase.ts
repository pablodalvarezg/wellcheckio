
import { WelfareCallRepository } from '@/domain/repositories/WelfareCallRepository';
import { ServiceUserRepository } from '@/domain/repositories/ServiceUserRepository';
import { VoiceService } from '@/domain/services/VoiceService';

export class CreateWelfareCallUseCase {
  constructor(
    private welfareCallRepository: WelfareCallRepository,
    private serviceUserRepository: ServiceUserRepository,
    private voiceService: VoiceService
  ) {}

  async execute(params: {
    userId: string;
    serviceUserId: string;
    message: string;
  }) {
    // Get service user details
    const serviceUser = await this.serviceUserRepository.findById(params.serviceUserId);
    if (!serviceUser) {
      throw new Error('Service user not found');
    }

    // Create welfare call record
    const welfareCall = await this.welfareCallRepository.create({
      userId: params.userId,
      serviceUserId: params.serviceUserId,
      message: params.message,
      phoneNumber: serviceUser.phoneNumber,
      serviceUserName: serviceUser.name,
      status: 'pending',
    });

    try {
      // Initiate voice call
      const voiceResponse = await this.voiceService.initiateCall({
        phoneNumber: serviceUser.phoneNumber,
        message: params.message,
        serviceUserName: serviceUser.name,
      });

      // Update welfare call with voice response
      const updatedCall = await this.welfareCallRepository.update(welfareCall.id, {
        status: 'in-progress',
        callId: voiceResponse.callId,
      });

      return updatedCall;
    } catch (error) {
      // Update welfare call status to failed
      await this.welfareCallRepository.update(welfareCall.id, {
        status: 'failed',
      });
      throw error;
    }
  }
}
