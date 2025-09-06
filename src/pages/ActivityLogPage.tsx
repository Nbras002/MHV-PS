import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useActivityLog } from '../hooks/useActivityLog';
import { activityAPI } from '../services/api';
import { format } from 'date-fns';
import { Search, Filter, Calendar, RefreshCw } from 'lucide-react';

const ActivityLogPage: React.FC = () => {
  const { t } = useTranslation();
  const { activities, loading, fetchActivities } = useActivityLog();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [uniqueActions, setUniqueActions] = useState<string[]>([]);

  useEffect(() => {
    fetchUniqueActions();
  }, []);

  const fetchUniqueActions = async () => {
    try {
      const response = await activityAPI.getActions();
      setUniqueActions(response.data.actions);
    } catch (error) {
      console.error('Failed to fetch actions:', error);
    }
  };

  const handleSearch = () => {
    const params: any = {};
    if (searchTerm) params.search = searchTerm;
    if (filterAction) params.action = filterAction;
    if (filterDate) params.date = filterDate;
    
    fetchActivities(params);
  };

  const handleClear = () => {
    setSearchTerm('');
    setFilterAction('');
    setFilterDate('');
    fetchActivities();
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleSearch();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, filterAction, filterDate]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
            <p className="text-gray-600">{t('common.loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('activityLog.title')}</h1>
          <p className="text-gray-600">{t('activityLog.subtitle')}</p>
        </div>
        <button
          onClick={() => fetchActivities()}
          className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span>{t('common.refresh')}</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder={t('activityLog.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          
          <div className="relative">
            <Filter className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">{t('activityLog.allActions')}</option>
              {uniqueActions.map(action => (
                <option key={action} value={action}>
                  {t(`activityLog.actions.${action}`)}
                </option>
              ))}
            </select>
          </div>
          
          <div className="relative">
            <Calendar className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          
          <button
            onClick={handleClear}
            className="flex items-center justify-center space-x-2 bg-gray-100 text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <span>{t('common.clearAll')}</span>
          </button>
        </div>
      </div>

      {/* Activity Log */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('activityLog.timestamp')}
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('activityLog.name')}
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('activityLog.username')}
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('activityLog.action')}
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ minWidth: '200px' }}>
                  {t('activityLog.detailsLabel')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {activities.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    {t('activityLog.noActivities')}
                  </td>
                </tr>
              ) : (
                activities.map((activity) => (
                  <tr key={activity.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                      {new Date(activity.timestamp).toLocaleDateString('en-GB')} {new Date(activity.timestamp).toLocaleTimeString('en-GB', { hour12: false })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-center">
                      {activity.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                      {activity.username || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        activity.action.includes('create') ? 'bg-green-100 text-green-800' :
                        activity.action.includes('update') ? 'bg-blue-100 text-blue-800' :
                        activity.action.includes('delete') ? 'bg-red-100 text-red-800' :
                        activity.action.includes('login') ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {t(`activityLog.actions.${activity.action}`)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 text-center">
                      {translateActivityDetails(activity.action, activity.details)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

    function translateActivityDetails(action: string, details: string) {
    // Extract specific information from details
    const permitNumberMatch = details.match(/permit\s+([A-Z0-9]+)/i);
    const userNameMatch = details.match(/user\s+([^\s]+)/i);
    const carrierMatch = details.match(/for\s+([^$]+)$/i);

    switch (action) {
      case 'create_permit':
        if (permitNumberMatch) {
          return t('activityLog.details.create_permit', { permitNumber: permitNumberMatch[1] });
        }
        return t('activityLog.details.create_permit');

      case 'update_permit':
        if (permitNumberMatch) {
          return t('activityLog.details.update_permit', { permitNumber: permitNumberMatch[1] });
        }
        return t('activityLog.details.update_permit');

      case 'delete_permit':
        if (permitNumberMatch) {
          const carrierName = carrierMatch ? carrierMatch[1].trim() : '';
          // إذا أردت إضافة ترجمة للناقل أضف مفتاح خاص في ملف الترجمة
          return t('activityLog.details.delete_permit', { permitNumber: permitNumberMatch[1], carrierName });
        }
        return t('activityLog.details.delete_permit');

      case 'close_permit':
        if (permitNumberMatch) {
          return t('activityLog.details.close_permit', { permitNumber: permitNumberMatch[1] });
        }
        return t('activityLog.details.close_permit');

      case 'reopen_permit':
        if (permitNumberMatch) {
          return t('activityLog.details.reopen_permit', { permitNumber: permitNumberMatch[1] });
        }
        return t('activityLog.details.reopen_permit');

      case 'create_user':
        if (userNameMatch) {
          return t('activityLog.details.create_user', { username: userNameMatch[1] });
        }
        return t('activityLog.details.create_user');

      case 'update_user':
        if (userNameMatch) {
          return t('activityLog.details.update_user', { username: userNameMatch[1] });
        }
        return t('activityLog.details.update_user');

      case 'delete_user':
        if (userNameMatch) {
          return t('activityLog.details.delete_user', { username: userNameMatch[1] });
        }
        return t('activityLog.details.delete_user');

      case 'export_permits':
        const countMatch = details.match(/(\d+)/);
        if (countMatch) {
          return t('activityLog.details.export_permits', { count: countMatch[1] });
        }
        return t('activityLog.details.export_permits');

      default:
        return details;
    }
  }
};

export default ActivityLogPage;