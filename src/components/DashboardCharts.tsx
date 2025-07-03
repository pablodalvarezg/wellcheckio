import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfDay, endOfDay } from 'date-fns';

interface CallStats {
  initialized: number;
  failed: number;
}

const COLORS = {
  initialized: '#22c55e',
  failed: '#ef4444'
};

export const DashboardCharts = () => {
  const { user } = useAuth();
  const [todayStats, setTodayStats] = useState<CallStats>({ initialized: 0, failed: 0 });
  const [overallStats, setOverallStats] = useState<CallStats>({ initialized: 0, failed: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadCallStats();
    }
  }, [user]);

  const loadCallStats = async () => {
    if (!user) return;

    try {
      const today = new Date();
      const startOfToday = startOfDay(today);
      const endOfToday = endOfDay(today);

      // Get today's calls
      const { data: todayCalls, error: todayError } = await supabase
        .from('welfare_calls')
        .select('status')
        .eq('user_id', user.id)
        .gte('created_at', startOfToday.toISOString())
        .lte('created_at', endOfToday.toISOString());

      if (todayError) throw todayError;

      // Get all calls
      const { data: allCalls, error: allError } = await supabase
        .from('welfare_calls')
        .select('status')
        .eq('user_id', user.id);

      if (allError) throw allError;

      // Calculate today's stats
      const todayStatsData = todayCalls.reduce((acc, call) => {
        const status = call.status as keyof CallStats;
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, { initialized: 0, failed: 0 } as CallStats);

      // Calculate overall stats
      const overallStatsData = allCalls.reduce((acc, call) => {
        const status = call.status as keyof CallStats;
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, { initialized: 0, failed: 0 } as CallStats);

      setTodayStats(todayStatsData);
      setOverallStats(overallStatsData);
    } catch (error) {
      console.error('Error loading call stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const barChartData = [
    { name: 'Initialized', value: todayStats.initialized, fill: COLORS.initialized },
    { name: 'Failed', value: todayStats.failed, fill: COLORS.failed },
  ];

  const pieChartData = [
    { name: 'Initialized', value: overallStats.initialized, fill: COLORS.initialized },
    { name: 'Failed', value: overallStats.failed, fill: COLORS.failed },
  ].filter(item => item.value > 0);

  const chartConfig = {
    initialized: { label: "Initialized", color: COLORS.initialized },
    failed: { label: "Failed", color: COLORS.failed },
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse h-64 bg-gray-200 rounded"></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse h-64 bg-gray-200 rounded"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Today's Calls</CardTitle>
          <CardDescription>
            Call distribution for {format(new Date(), 'MMMM d, yyyy')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData}>
                <XAxis dataKey="name" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" radius={4} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Overall Call Status</CardTitle>
          <CardDescription>
            Distribution of all welfare calls
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
};
