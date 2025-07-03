
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ServiceUser } from '@/domain/entities/ServiceUser';
import { SupabaseServiceUserRepository } from '@/infrastructure/repositories/SupabaseServiceUserRepository';
import { SupabaseWelfareCallRepository } from '@/infrastructure/repositories/SupabaseWelfareCallRepository';
import { VapiVoiceService } from '@/infrastructure/services/VapiVoiceService';
import { CreateWelfareCallUseCase } from '@/application/usecases/CreateWelfareCallUseCase';
import { GetServiceUsersUseCase } from '@/application/usecases/GetServiceUsersUseCase';

export const CreateWelfareCallForm = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [serviceUsers, setServiceUsers] = useState<ServiceUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [message, setMessage] = useState('Hi there, this is a welfare check-in call. Please press 1 if you are doing well, or stay on the line if you need assistance.');

  // Dependencies
  const serviceUserRepository = new SupabaseServiceUserRepository();
  const welfareCallRepository = new SupabaseWelfareCallRepository();
  const voiceService = new VapiVoiceService('', ''); // Will be configured with actual credentials
  
  const createWelfareCallUseCase = new CreateWelfareCallUseCase(
    welfareCallRepository,
    serviceUserRepository,
    voiceService
  );
  
  const getServiceUsersUseCase = new GetServiceUsersUseCase(serviceUserRepository);

  useEffect(() => {
    loadServiceUsers();
  }, [user]);

  const loadServiceUsers = async () => {
    if (!user) return;
    
    try {
      const users = await getServiceUsersUseCase.execute(user.id);
      setServiceUsers(users);
    } catch (error) {
      console.error('Error loading service users:', error);
      toast({
        title: "Error",
        description: "Failed to load service users",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedUserId || !message) return;

    setIsLoading(true);

    try {
      await createWelfareCallUseCase.execute({
        userId: user.id,
        serviceUserId: selectedUserId,
        message: message.trim(),
      });

      toast({
        title: "Call Initiated",
        description: "The welfare call has been successfully initiated.",
      });

      setSelectedUserId('');
      setMessage('Hi there, this is a welfare check-in call. Please press 1 if you are doing well, or stay on the line if you need assistance.');
    } catch (error) {
      console.error('Error creating welfare call:', error);
      toast({
        title: "Error",
        description: "Failed to initiate the welfare call. Please check your Vapi configuration.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (serviceUsers.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 mb-4">
          No service users found. Please add a service user first.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="service-user">Service User</Label>
        <Select value={selectedUserId} onValueChange={setSelectedUserId} required>
          <SelectTrigger>
            <SelectValue placeholder="Select a service user" />
          </SelectTrigger>
          <SelectContent>
            {serviceUsers.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {user.name} - {user.phoneNumber}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">Welfare Check Message</Label>
        <Textarea
          id="message"
          placeholder="Enter the message for the welfare call"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          required
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Initiating Call...' : 'Create Welfare Call'}
      </Button>
    </form>
  );
};
