
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { ServiceUser } from '@/domain/entities/ServiceUser';
import { SupabaseServiceUserRepository } from '@/infrastructure/repositories/SupabaseServiceUserRepository';
import { GetServiceUsersUseCase } from '@/application/usecases/GetServiceUsersUseCase';
import { formatDistanceToNow } from 'date-fns';

export const ServiceUsersList = () => {
  const { user } = useAuth();
  const [serviceUsers, setServiceUsers] = useState<ServiceUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const serviceUserRepository = new SupabaseServiceUserRepository();
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
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="text-center py-4">Loading service users...</div>;
  }

  if (serviceUsers.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No service users found. Add your first service user above.
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-96 overflow-y-auto">
      {serviceUsers.map((serviceUser) => (
        <Card key={serviceUser.id} className="p-3">
          <CardContent className="p-0">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-semibold text-sm">{serviceUser.name}</h4>
                <p className="text-xs text-gray-600">{serviceUser.phoneNumber}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Added {formatDistanceToNow(new Date(serviceUser.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
