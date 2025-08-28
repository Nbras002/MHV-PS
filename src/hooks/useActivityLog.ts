import { useState, useEffect } from 'react';
import { ActivityLog } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { activityAPI } from '../services/api';

export const useActivityLog = () => {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchActivities = async (params?: any) => {
    if (!user || !['admin', 'manager', 'security_officer'].includes(user.role)) {
      return;
    }

    try {
      setLoading(true);
      const response = await activityAPI.getAll(params);
      setActivities(response.data.activities);
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && ['admin', 'manager', 'security_officer'].includes(user.role)) {
      fetchActivities();
    }
  }, [user]);

  const logActivity = async (action: string, details: string) => {
    // Activity logging is handled automatically by the backend
    // This function is kept for compatibility but doesn't need to do anything
    // as the backend middleware logs activities automatically
  };

  return { 
    activities, 
    loading,
    logActivity, 
    fetchActivities,
    refetch: fetchActivities
  };
};