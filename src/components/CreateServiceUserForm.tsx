
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { SupabaseServiceUserRepository } from '@/infrastructure/repositories/SupabaseServiceUserRepository';
import { CreateServiceUserUseCase } from '@/application/usecases/CreateServiceUserUseCase';

export const CreateServiceUserForm = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const serviceUserRepository = new SupabaseServiceUserRepository();
  const createServiceUserUseCase = new CreateServiceUserUseCase(serviceUserRepository);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name || !phoneNumber) return;

    setIsLoading(true);

    try {
      await createServiceUserUseCase.execute({
        userId: user.id,
        name: name.trim(),
        phoneNumber: phoneNumber.trim(),
      });

      toast({
        title: "Service User Added",
        description: `${name} has been successfully added.`,
      });

      setName('');
      setPhoneNumber('');
    } catch (error) {
      console.error('Error creating service user:', error);
      toast({
        title: "Error",
        description: "Failed to add service user",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Full Name</Label>
        <Input
          id="name"
          type="text"
          placeholder="Enter full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number</Label>
        <Input
          id="phone"
          type="tel"
          placeholder="+1234567890"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          required
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Adding...' : 'Add Service User'}
      </Button>
    </form>
  );
};
