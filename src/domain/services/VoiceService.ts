
export interface VoiceCallRequest {
  phoneNumber: string;
  message: string;
  serviceUserName: string;
}

export interface VoiceCallResponse {
  callId: string;
  status: string;
  message?: string;
}

export interface VoiceService {
  initiateCall(request: VoiceCallRequest): Promise<VoiceCallResponse>;
  getCallStatus(callId: string): Promise<{ status: string; response?: any }>;
}
