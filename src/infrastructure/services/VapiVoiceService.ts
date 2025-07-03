
import { VoiceService, VoiceCallRequest, VoiceCallResponse } from '@/domain/services/VoiceService';

export class VapiVoiceService implements VoiceService {
  private apiKey: string;
  private baseUrl = 'https://api.vapi.ai';
  private assistantId: string;

  constructor(apiKey: string, assistantId: string) {
    this.apiKey = apiKey;
    this.assistantId = assistantId;
  }

  async initiateCall(request: VoiceCallRequest): Promise<VoiceCallResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/call`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assistantId: this.assistantId,
          customer: {
            number: request.phoneNumber,
            name: request.serviceUserName,
          },
          assistantOverrides: {
            firstMessage: `Hello ${request.serviceUserName}, ${request.message}`,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Vapi API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        callId: data.id,
        status: data.status || 'initiated',
        message: 'Call initiated successfully',
      };
    } catch (error) {
      console.error('Error initiating Vapi call:', error);
      throw new Error('Failed to initiate voice call');
    }
  }

  async getCallStatus(callId: string): Promise<{ status: string; response?: any }> {
    try {
      const response = await fetch(`${this.baseUrl}/call/${callId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Vapi API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        status: data.status,
        response: data,
      };
    } catch (error) {
      console.error('Error getting call status:', error);
      return { status: 'unknown' };
    }
  }
}
