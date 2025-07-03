
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
  const [message, setMessage] = useState('Hola, esta es una llamada de verificación de bienestar. Por favor presiona 1 si te encuentras bien, o permanece en la línea si necesitas asistencia.');

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
        title: "Llamada Iniciada",
        description: "La llamada de bienestar ha sido iniciada correctamente.",
      });

      setSelectedUserId('');
      setMessage('Hola, esta es una llamada de verificación de bienestar. Por favor presiona 1 si te encuentras bien, o permanece en la línea si necesitas asistencia.');
    } catch (error) {
      console.error('Error creating welfare call:', error);
      toast({
        title: "Error",
        description: "No se pudo iniciar la llamada de bienestar. Por favor verifica la configuración de Vapi.",
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
          No se encontraron usuarios de servicio. Por favor añade un usuario de servicio primero.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="service-user">Usuario de Servicio</Label>
        <Select value={selectedUserId} onValueChange={setSelectedUserId} required>
          <SelectTrigger>
            <SelectValue placeholder="Selecciona un usuario de servicio" />
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
        <Label htmlFor="message">Mensaje de Verificación de Bienestar</Label>
        <Textarea
          id="message"
          placeholder="Ingresa el mensaje para la llamada de bienestar"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          required
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Iniciando Llamada...' : 'Crear Llamada de Bienestar'}
      </Button>
    </form>
  );
};
