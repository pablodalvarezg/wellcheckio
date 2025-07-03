
export interface WelfareCall {
  id: string;
  userId: string;
  serviceUserId: string;
  message: string;
  phoneNumber: string;
  serviceUserName: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  callId?: string;
  callResponse?: any;
  createdAt: string;
  updatedAt: string;
}
