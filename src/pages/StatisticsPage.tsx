import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { statisticsAPI } from '../services/api';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { FileText, CheckCircle, XCircle, TrendingUp, RefreshCw } from 'lucide-react';

const COLORS = ['#4F008C', '#FF375e', '#FFFDD40', '#FF6a39', '#00C48C', '#1BCED8', '#A54EE1', '#8E9AA0'];

const StatisticsPage: React.FC = () => {
  const { t } = useTranslation();
  const [statistics, setStatistics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const response = await statisticsAPI.get();
      setStatistics(response.data);
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
    } finally {
      setLoading(false);
    }
  };

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

  if (!statistics) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <p className="text-gray-600">{t('statistics.noData')}</p>
          <button
            onClick={fetchStatistics}
            className="mt-4 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            {t('common.refresh')}
          </button>
        </div>
      </div>
    );
  }

  const regionChartData = Object.entries(statistics.permitsByRegion || {}).map(([region, count]) => ({
    region: t(`regions.${region}`),
    count
  }));

  const typeChartData = Object.entries(statistics.permitsByType || {}).map(([type, count]) => ({
    type: t(`requestTypes.${type}`),
    count
  }));

  const trendChartData = Object.entries(statistics.permitsTrend || {}).map(([date, count]) => ({
    date,
    count
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('statistics.title')}</h1>
          <p className="text-gray-600">{t('statistics.subtitle')}</p>
        </div>
        <button
          onClick={fetchStatistics}
          className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span>{t('common.refresh')}</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <FileText className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">{t('statistics.totalPermits')}</p>
              <p className="text-2xl font-bold text-gray-900">{statistics.totalPermits || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">{t('statistics.activePermits')}</p>
              <p className="text-2xl font-bold text-gray-900">{statistics.activePermits || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100 text-red-600">
              <XCircle className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">{t('statistics.closedPermits')}</p>
              <p className="text-2xl font-bold text-gray-900">{statistics.closedPermits || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">{t('statistics.totalUsers')}</p>
              <p className="text-2xl font-bold text-gray-900">{statistics.totalUsers || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Permits by Region */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('statistics.permitsByRegion')}</h3>
          <div className="h-80">
            {regionChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={regionChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="region" 
                    angle={-45} 
                    textAnchor="end" 
                    height={100}
                    fontSize={12}
                  />
                  <YAxis />
                  <Tooltip formatter={(value) => [value, t('statistics.count')]} />
                  <Bar dataKey="count" fill="#4F008C" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                {t('statistics.noData')}
              </div>
            )}
          </div>
        </div>

        {/* Permits by Type */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('statistics.permitsByType')}</h3>
          <div className="h-80">
            {typeChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={typeChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ type, percent, count }) => `${type}: ${count} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {typeChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [value, t('statistics.count')]} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                {t('statistics.noData')}
              </div>
            )}
          </div>
        </div>

        {/* Permits Trend */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('statistics.permitsTrend')}</h3>
          <div className="h-80">
            {trendChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-GB')}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString('en-GB')}
                    formatter={(value) => [value, t('statistics.count')]}
                  />
                  <Line type="monotone" dataKey="count" stroke="#4F008C" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                {t('statistics.noData')}
              </div>
            )}
          </div>
        </div>

        {/* Top Carriers */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('statistics.topCarriers')}</h3>
          <div className="h-80">
            {statistics.topCarriers && statistics.topCarriers.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statistics.topCarriers} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    width={150}
                    fontSize={12}
                  />
                  <Tooltip formatter={(value) => [value, t('statistics.count')]} />
                  <Bar dataKey="count" fill="#00C48C" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                {t('statistics.noData')}
              </div>
            )}
          </div>
        </div>

        {/* Top Closers */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('statistics.topClosers')}</h3>
          <div className="h-80">
            {statistics.topClosers && statistics.topClosers.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statistics.topClosers} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    width={150}
                    fontSize={12}
                  />
                  <Tooltip formatter={(value) => [value, t('statistics.count')]} />
                  <Bar dataKey="count" fill="#FF375e" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                {t('statistics.noData')}
              </div>
            )}
          </div>
        </div>

        {/* Top Creators */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('statistics.topCreators')}</h3>
          <div className="h-80">
            {statistics.topCreators && statistics.topCreators.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statistics.topCreators} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    width={150}
                    fontSize={12}
                  />
                  <Tooltip formatter={(value) => [value, t('statistics.count')]} />
                  <Bar dataKey="count" fill="#A54EE1" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                {t('statistics.noData')}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatisticsPage;