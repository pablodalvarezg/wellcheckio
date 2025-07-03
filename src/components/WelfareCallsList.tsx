
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { WelfareCall } from '@/domain/entities/WelfareCall';
import { SupabaseWelfareCallRepository } from '@/infrastructure/repositories/SupabaseWelfareCallRepository';
import { GetWelfareCallsUseCase } from '@/application/usecases/GetWelfareCallsUseCase';
import { formatDistanceToNow } from 'date-fns';

export const WelfareCallsList = () => {
  const { user } = useAuth();
  const [calls, setCalls] = useState<WelfareCall[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const welfareCallRepository = new SupabaseWelfareCallRepository();
  const getWelfareCallsUseCase = new GetWelfareCallsUseCase(welfareCallRepository);

  useEffect(() => {
    loadCalls();
  }, [user]);

  const loadCalls = async () => {
    if (!user) return;

    try {
      const callsData = await getWelfareCallsUseCase.execute(user.id);
      setCalls(callsData);
    } catch (error) {
      console.error('Error loading calls:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (isLoading) {
    return <div className="text-center py-4">Loading calls...</div>;
  }

  if (calls.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No welfare calls found. Create your first call above.
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-96 overflow-y-auto">
      {calls.map((call) => (
        <Card key={call.id} className="p-3">
          <CardContent className="p-0">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="font-semibold text-sm">{call.serviceUserName}</h4>
                <p className="text-xs text-gray-600">{call.phoneNumber}</p>
              </div>
              <Badge className={getStatusColor(call.status)}>
                {call.status}
              </Badge>
            </div>
            <p className="text-xs text-gray-700 mb-2 line-clamp-2">
              {call.message}
            </p>
            <p className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(call.createdAt), { addSuffix: true })}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
