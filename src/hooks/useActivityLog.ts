import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityLog } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { activityAPI } from '../services/api';

export const useActivityLog = () => {
  const { t } = useTranslation();
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
    // This function is kept for compatibility
    console.log('Activity logged:', action, details);
    return details;
  };

  const translateActivityDetails = (action: string, details: string) => {
    // Extract specific information from details
    const permitNumberMatch = details.match(/permit\s+([A-Z0-9]+)/i);
    const userNameMatch = details.match(/user\s+([^\s]+)/i);
    
    switch (action) {
      case 'create_permit':
        if (permitNumberMatch) {
          return t('activityLog.detailsTranslated.create_permit', { permitNumber: permitNumberMatch[1] });
        }
        return t('activityLog.details.create_permit');
      
      case 'update_permit':
        if (permitNumberMatch) {
          return t('activityLog.detailsTranslated.update_permit', { permitNumber: permitNumberMatch[1] });
        }
        return t('activityLog.details.update_permit');
      
      case 'delete_permit':
        if (permitNumberMatch) {
          return t('activityLog.detailsTranslated.delete_permit', { permitNumber: permitNumberMatch[1] });
        }
        return t('activityLog.details.delete_permit');
      
      case 'close_permit':
        if (permitNumberMatch) {
          return t('activityLog.detailsTranslated.close_permit', { permitNumber: permitNumberMatch[1] });
        }
        return t('activityLog.details.close_permit');
      
      case 'reopen_permit':
        if (permitNumberMatch) {
          return t('activityLog.detailsTranslated.reopen_permit', { permitNumber: permitNumberMatch[1] });
        }
        return t('activityLog.details.reopen_permit');
      
      case 'create_user':
        if (userNameMatch) {
          return t('activityLog.detailsTranslated.create_user', { username: userNameMatch[1] });
        }
        return t('activityLog.details.create_user');
      
      case 'update_user':
        if (userNameMatch) {
          return t('activityLog.detailsTranslated.update_user', { username: userNameMatch[1] });
        }
        return t('activityLog.details.update_user');
      
      case 'delete_user':
        if (userNameMatch) {
          return t('activityLog.detailsTranslated.delete_user', { username: userNameMatch[1] });
        }
        return t('activityLog.details.delete_user');
      
      default:
        return details;
    }
  };

  return { 
    activities, 
    loading,
    logActivity, 
    fetchActivities,
    refetch: fetchActivities
  };
};