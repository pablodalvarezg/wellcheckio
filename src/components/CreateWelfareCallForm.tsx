
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ServiceUser } from '@/domain/entities/ServiceUser';
import { supabase } from '@/integrations/supabase/client';

export const CreateWelfareCallForm = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [serviceUsers, setServiceUsers] = useState<ServiceUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [message, setMessage] = useState('Hello, this is a welfare check call. Please press 1 if you are doing well, or stay on the line if you need assistance.');

  useEffect(() => {
    loadServiceUsers();
  }, [user]);

  const loadServiceUsers = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('service_users')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const users = data.map(item => ({
        id: item.id,
        userId: item.user_id,
        name: item.name,
        phoneNumber: item.phone_number,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      }));

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
      // Get selected service user
      const selectedUser = serviceUsers.find(u => u.id === selectedUserId);
      if (!selectedUser) {
        throw new Error('Service user not found');
      }

      // Create welfare call record
      const { data: welfareCall, error: createError } = await supabase
        .from('welfare_calls')
        .insert({
          user_id: user.id,
          service_user_id: selectedUserId,
          message: message.trim(),
          phone_number: selectedUser.phoneNumber,
          service_user_name: selectedUser.name,
          status: 'pending',
        })
        .select()
        .single();

      if (createError) throw createError;

      // Call the edge function to initiate the call with Vapi
      const { data: callResponse, error: callError } = await supabase.functions.invoke('create-welfare-call', {
        body: {
          welfareCallId: welfareCall.id,
          phoneNumber: selectedUser.phoneNumber,
          serviceUserName: selectedUser.name,
          message: message.trim(),
        },
      });

      if (callError) {
        console.error('Error initiating call:', callError);
        // Update status to failed
        await supabase
          .from('welfare_calls')
          .update({ status: 'failed' })
          .eq('id', welfareCall.id);
        
        throw new Error('Failed to initiate call');
      }

      console.log('Call initiated successfully:', callResponse);

      toast({
        title: "Call Initiated",
        description: "The welfare call has been initiated successfully.",
      });

      setSelectedUserId('');
      setMessage('Hello, this is a welfare check call. Please press 1 if you are doing well, or stay on the line if you need assistance.');
    } catch (error) {
      console.error('Error creating welfare call:', error);
      toast({
        title: "Error",
        description: "Could not initiate welfare call. Please check Vapi configuration.",
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
