import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { usePermits } from '../hooks/usePermits';
import { useActivityLog } from '../hooks/useActivityLog';
import { Permit, REGIONS, REQUEST_TYPES, DEFAULT_ROLE_PERMISSIONS } from '../types';
import { exportPermitsToExcel } from '../utils/excel';
import { validatePermitNumber, formatVehiclePlate } from '../utils/validation';
import QRScanner from '../components/QRScanner';
import { useModalScrollLock } from '../hooks/useModalScrollLock';
import VehiclePlateInput from '../components/VehiclePlateInput';
import ConfirmDialog from '../components/Common/ConfirmDialog';
import AlertDialog from '../components/Common/AlertDialog';
import { useAlert } from '../hooks/useAlert';
import { useConfirm } from '../hooks/useConfirm';
import { 
  Search, 
  QrCode, 
  Filter, 
  Plus, 
  Download, 
  Eye, 
  Edit, 
  Trash2, 
  X,
  Save,
  Calendar,
  MapPin,
  User,
  CreditCard,
  Package,
  Truck,
  RefreshCw
} from 'lucide-react';

const HomePage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { language } = useLanguage();
  const { permits, loading, addPermit, updatePermit, deletePermit, closePermit, reopenPermit, generatePermitNumber, refetch } = usePermits();
  const { logActivity } = useActivityLog();
  
  const { alert, showSuccess, showError, hideAlert } = useAlert();
  const { confirm, showConfirm, hideConfirm } = useConfirm();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRegion, setFilterRegion] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPermit, setEditingPermit] = useState<Permit | null>(null);
  const [viewingPermit, setViewingPermit] = useState<Permit | null>(null);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Lock scroll when any modal is open
  useModalScrollLock(showAddForm || !!viewingPermit || showQRScanner);
  
  const [newPermit, setNewPermit] = useState({
    permitNumber: '',
    date: new Date().toISOString().split('T')[0],
    region: user?.region[0] || 'headquarters',
    location: '',
    carrierName: '',
    carrierId: '',
    requestType: 'material_entrance' as const,
    vehiclePlate: '',
    materials: [{ id: '1', description: '', serialNumber: '' }]
  });

  const canCreate = ['admin', 'manager'].includes(user?.role || '');
  const canEdit = ['admin', 'manager'].includes(user?.role || '');
  const canDelete = user?.role === 'admin';
  const canClose = ['admin', 'manager', 'security_officer'].includes(user?.role || '');
  const canExport = ['admin', 'manager'].includes(user?.role || '');

  // Auto-disable vehicle plate for material-only requests and materials for heavy vehicle entrance/exit
  useEffect(() => {
    if (newPermit.requestType === 'material_entrance' || newPermit.requestType === 'material_exit') {
      setNewPermit(prev => ({ ...prev, vehiclePlate: 'N/A' }));
    } else if (newPermit.vehiclePlate === 'N/A') {
      setNewPermit(prev => ({ ...prev, vehiclePlate: '' }));
    }
    
    // Disable materials for heavy vehicle entrance/exit
    if (newPermit.requestType === 'heavy_vehicle_entrance_exit') {
      setNewPermit(prev => ({ 
        ...prev, 
        materials: [{ id: '1', description: 'N/A', serialNumber: 'N/A' }]
      }));
    } else if (newPermit.materials.length === 1 && newPermit.materials[0].description === 'N/A' && newPermit.materials[0].serialNumber === 'N/A') {
      setNewPermit(prev => ({ 
        ...prev, 
        materials: [{ id: '1', description: '', serialNumber: '' }]
      }));
    }
  }, [newPermit.requestType]);

  const filteredPermits = permits.filter(permit => {
    const matchesSearch = !searchTerm || 
      permit.permitNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      permit.carrierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      permit.carrierId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      permit.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRegion = !filterRegion || permit.region === filterRegion;
    const matchesDate = !filterDate || permit.date.startsWith(filterDate);
    
    return matchesSearch && matchesRegion && matchesDate;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🔄 Form submission started with data:', newPermit);
    
    // Validate required fields based on request type
    const requiresVehiclePlate = [
      'heavy_vehicle_entrance_exit',
      'heavy_vehicle_entrance', 
      'heavy_vehicle_exit'
    ].includes(newPermit.requestType);
    
    if (requiresVehiclePlate) {
      if (!newPermit.vehiclePlate || newPermit.vehiclePlate === 'N/A' || newPermit.vehiclePlate.trim() === '') {
        console.log('❌ Vehicle plate validation failed');
        showError(t('common.error'), t('permits.vehiclePlateRequired'));
        return;
      }
    }
    
    // Validate materials for non-heavy vehicle entrance/exit requests
    if (newPermit.requestType !== 'heavy_vehicle_entrance_exit') {
      const hasValidMaterials = newPermit.materials.some(material => 
        material.description.trim() && material.serialNumber.trim() &&
        material.description !== 'N/A' && material.serialNumber !== 'N/A'
      );
      if (!hasValidMaterials) {
        console.log('❌ Materials validation failed');
        showError(t('common.error'), t('permits.materialsRequired'));
        return;
      }
    }
    
    // Validate permit number format
    if (!validatePermitNumber(newPermit.permitNumber)) {
      console.log('❌ Permit number validation failed');
      showError(t('common.error'), t('permits.invalidPermitNumber'));
      return;
    }
    
    console.log('✅ All validations passed, submitting...');
    setSubmitting(true);
    
    try {
      console.log('🔄 Submitting permit data:', newPermit);
      if (editingPermit) {
        console.log('🔄 Updating existing permit:', editingPermit.id);
        await updatePermit(editingPermit.id, newPermit);
        await logActivity('update_permit', `Updated permit ${newPermit.permitNumber}`);
      } else {
        console.log('🔄 Creating new permit');
        await addPermit(newPermit);
        await logActivity('create_permit', `Created permit ${newPermit.permitNumber}`);
      }
      
      console.log('✅ Permit operation completed successfully');
      resetForm();
      showSuccess(
        t('common.success'), 
        editingPermit ? t('permits.updateSuccess') : t('permits.createSuccess')
      );
    } catch (error: any) {
      console.error('Submit error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: error.config,
        stack: error.stack
      });
      const errorMessage = error.response?.data?.error || error.message || 'An error occurred';
      showError(t('common.error'), errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setShowAddForm(false);
    setEditingPermit(null);
    setNewPermit({
      permitNumber: '',
      date: new Date().toISOString().split('T')[0],
      region: user?.region[0] || 'headquarters',
      location: '',
      carrierName: '',
      carrierId: '',
      requestType: 'material_entrance',
      vehiclePlate: '',
      materials: [{ id: '1', description: '', serialNumber: '' }]
    });
  };

  const handleEdit = (permit: Permit) => {
    setNewPermit({
      permitNumber: permit.permitNumber,
      date: permit.date,
      region: permit.region,
      location: permit.location,
      carrierName: permit.carrierName,
      carrierId: permit.carrierId,
      requestType: permit.requestType,
      vehiclePlate: permit.vehiclePlate,
      materials: permit.materials
    });
    setEditingPermit(permit);
    setShowAddForm(true);
  };

  const handleDelete = async (permitId: string) => {
    const confirmed = await showConfirm(
      t('permits.delete'),
      t('permits.deleteConfirm'),
      () => {},
      { type: 'danger', confirmText: t('permits.delete'), cancelText: t('permits.cancel') }
    );
    
    if (confirmed) {
      try {
        console.log('🔄 Deleting permit:', permitId);
        await deletePermit(permitId);
        await logActivity('delete_permit', `Deleted permit`);
        console.log('✅ Permit deleted successfully');
        showSuccess(t('common.success'), t('permits.deleteSuccess'));
      } catch (error: any) {
        console.error('❌ Delete permit error:', error);
        showError(t('common.error'), error.response?.data?.error || t('common.error'));
      }
    }
  };

  const handleClose = async (permit: Permit) => {
    const confirmed = await showConfirm(
      t('permits.closePermit'),
      t('permits.closeConfirm'),
      () => {},
      { type: 'warning', confirmText: t('permits.closePermit'), cancelText: t('permits.cancel') }
    );
    
    if (confirmed) {
      try {
        console.log('🔄 Closing permit:', permit.id);
        await closePermit(permit.id);
        await logActivity('close_permit', `Closed permit ${permit.permitNumber}`);
        console.log('✅ Permit closed successfully');
        showSuccess(t('common.success'), t('permits.closeSuccess'));
      } catch (error: any) {
        console.error('❌ Close permit error:', error);
        showError(t('common.error'), error.response?.data?.error || t('common.error'));
      }
    }
  };

  const handleReopen = async (permit: Permit) => {
    const confirmed = await showConfirm(
      t('permits.reopenPermit'),
      t('permits.reopenConfirm'),
      () => {},
      { type: 'info', confirmText: t('permits.reopenPermit'), cancelText: t('permits.cancel') }
    );
    
    if (confirmed) {
      try {
        console.log('🔄 Reopening permit:', permit.id);
        const success = await reopenPermit(permit.id);
        if (success) {
          await logActivity('reopen_permit', `Reopened permit ${permit.permitNumber}`);
          console.log('✅ Permit reopened successfully');
          showSuccess(t('common.success'), t('permits.reopenSuccess'));
        }
      } catch (error: any) {
        console.error('❌ Reopen permit error:', error);
        showError(t('common.error'), error.response?.data?.error || t('common.error'));
      }
    }
  };

  const handleExport = () => {
    exportPermitsToExcel(filteredPermits);
    logActivity('export_permits', `Exported ${filteredPermits.length} permits`);
    showSuccess(t('common.success'), t('permits.exportSuccess'));
  };

  const handleQRScan = (result: string) => {
    // Extract permit number from QR code result
    if (validatePermitNumber(result)) {
      setSearchTerm(result);
    } else {
      showError(t('common.error'), t('common.invalidQRFormat'));
    }
  };

  const handleView = (permit: Permit) => {
    setViewingPermit(permit);
  };

  const addMaterial = () => {
    if (newPermit.materials.length >= 50) {
      showWarning(t('permits.materialLimitReached'), t('permits.materialLimitReached'));
      return;
    }
    
    setNewPermit({
      ...newPermit,
      materials: [...newPermit.materials, { id: Date.now().toString(), description: '', serialNumber: '' }]
    });
  };

  const removeMaterial = (id: string) => {
    if (newPermit.materials.length > 1) {
      setNewPermit({
        ...newPermit,
        materials: newPermit.materials.filter(material => material.id !== id)
      });
    }
  };

  const updateMaterial = (id: string, field: 'description' | 'serialNumber', value: string) => {
    setNewPermit({
      ...newPermit,
      materials: newPermit.materials.map(material =>
        material.id === id ? { ...material, [field]: value } : material
      )
    });
  };

  const getDisplayVehiclePlate = (plate: string) => {
    if (plate === 'N/A') return 'N/A';
    return formatVehiclePlate(plate, language === 'ar');
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{t('permits.title')}</h1>
          <p className="text-sm sm:text-base text-gray-600">{t('permits.subtitle')}</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 mt-6 lg:mt-0">
          <button
            onClick={refetch}
            className="flex items-center justify-center space-x-2 bg-gray-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm sm:text-base"
          >
            <RefreshCw className="w-4 h-4" />
            <span>{t('common.refresh')}</span>
          </button>
          
          {canExport && (
            <button
              onClick={handleExport}
              className="flex items-center justify-center space-x-2 bg-green-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base"
            >
              <Download className="w-4 h-4" />
              <span>{t('permits.export')}</span>
            </button>
          )}
          
          {canCreate && (
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center justify-center space-x-2 bg-purple-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm sm:text-base"
            >
              <Plus className="w-4 h-4" />
              <span>{t('permits.addPermit')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder={t('permits.search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
            />
          </div>
          
          <div className="relative">
            <button
              onClick={() => setShowQRScanner(true)}
              className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              <QrCode className="w-4 h-4" />
              <span>{t('permits.scanQR')}</span>
            </button>
          </div>
          
          <div className="relative">
            <Filter className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
            <select
              value={filterRegion}
              onChange={(e) => setFilterRegion(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
            >
              <option value="">{t('permits.filterRegion')}</option>
              {(user?.region || []).map(region => (
                <option key={region} value={region}>
                  {t(`regions.${region}`)}
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
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
            />
          </div>
          
          <button
            onClick={() => {
              setSearchTerm('');
              setFilterRegion('');
              setFilterDate('');
            }}
            className="flex items-center justify-center space-x-2 bg-gray-100 text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-200 transition-colors text-sm"
          >
            <X className="w-4 h-4" />
            <span>{t('common.clearAll')}</span>
          </button>
        </div>
      </div>

      {/* Permits Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto table-container">
          <table className="w-full responsive-table min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('permits.permitNumber')}
                </th>
                <th className="px-3 sm:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('permits.date')}
                </th>
                <th className="px-3 sm:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                  {t('permits.region')}
                </th>
                <th className="px-3 sm:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('permits.carrierName')}
                </th>
                <th className="px-3 sm:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                  {t('permits.requestType')}
                </th>
                <th className="px-3 sm:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('permits.status')}
                </th>
                <th className="px-3 sm:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('permits.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPermits.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    {t('permits.noPermits')}
                  </td>
                </tr>
              ) : (
                filteredPermits.map((permit) => (
                  <tr key={permit.id} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900 text-center">
                      {permit.permitNumber}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 text-center">
                      {new Date(permit.date).toLocaleDateString('en-GB')}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 text-center hidden sm:table-cell">
                      {t(`regions.${permit.region}`)}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 text-center">
                      {permit.carrierName}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 text-center hidden md:table-cell">
                      {t(`requestTypes.${permit.requestType}`)}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-center">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        permit.closedAt 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {permit.closedAt ? t('permits.closed') : t('permits.active')}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                      <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                        <button
                          onClick={() => handleView(permit)}
                          className="text-gray-600 hover:text-gray-700 p-1"
                          title={t('permits.view')}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        {canEdit && !permit.closedAt && (
                          <button
                            onClick={() => handleEdit(permit)}
                            className="text-indigo-600 hover:text-indigo-700 p-1"
                            title={t('permits.edit')}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        
                        {canClose && (
                          <>
                            {permit.closedAt ? (
                              (() => {
                                const userPermissions = user?.permissions || DEFAULT_ROLE_PERMISSIONS[user?.role || 'observer'];
                                const canReopenAny = userPermissions.canReopenAnyPermit;
                                const isClosedByUser = permit.closedBy === user?.id;
                                const closedTime = permit.closedAt ? new Date(permit.closedAt) : null;
                                const hoursPassed = closedTime ? (new Date().getTime() - closedTime.getTime()) / (1000 * 60 * 60) : 0;
                                const withinTimeLimit = hoursPassed <= 1;
                                
                                const canReopen = canReopenAny || (isClosedByUser && withinTimeLimit);
                                
                                return canReopen ? (
                                  <button
                                    onClick={() => handleReopen(permit)}
                                    className="text-green-600 hover:text-green-700 p-1"
                                    title={t('permits.reopenPermit')}
                                  >
                                    <Package className="w-4 h-4" />
                                  </button>
                                ) : null;
                              })()
                            ) : (
                              <button
                                onClick={() => handleClose(permit)}
                                className="text-orange-600 hover:text-orange-700 p-1"
                                title={t('permits.closePermit')}
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </>
                        )}
                        
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(permit.id)}
                            className="text-red-600 hover:text-red-700 p-1"
                            title={t('permits.delete')}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Permit Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-screen overflow-y-auto mx-2">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingPermit ? t('permits.edit') : t('permits.addPermit')}
                </h2>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600"
                  disabled={submitting}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('permits.permitNumber')}
                    </label>
                    <input
                      type="text"
                      value={newPermit.permitNumber}
                      onChange={(e) => setNewPermit({ ...newPermit, permitNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="MHV0000001"
                      required
                      disabled={submitting}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {t('permits.permitNumberFormat')}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('permits.date')}
                    </label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                      <input
                        type="date"
                        value={newPermit.date}
                        onChange={(e) => setNewPermit({ ...newPermit, date: e.target.value })}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        required
                        disabled={submitting}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('permits.region')}
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                      <select
                        value={newPermit.region}
                        onChange={(e) => setNewPermit({ ...newPermit, region: e.target.value })}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        required
                        disabled={submitting}
                      >
                        {REGIONS.filter(region => user?.region.includes(region)).map(region => (
                          <option key={region} value={region}>
                            {t(`regions.${region}`)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('permits.location')}
                    </label>
                    <input
                      type="text"
                      value={newPermit.location}
                      onChange={(e) => setNewPermit({ ...newPermit, location: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                      disabled={submitting}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('permits.carrierName')}
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        value={newPermit.carrierName}
                        onChange={(e) => setNewPermit({ ...newPermit, carrierName: e.target.value })}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        required
                        disabled={submitting}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('permits.carrierId')}
                    </label>
                    <div className="relative">
                      <CreditCard className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        value={newPermit.carrierId}
                        onChange={(e) => setNewPermit({ ...newPermit, carrierId: e.target.value })}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        required
                        disabled={submitting}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('permits.requestType')}
                    </label>
                    <select
                      value={newPermit.requestType}
                      onChange={(e) => setNewPermit({ ...newPermit, requestType: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                      disabled={submitting}
                    >
                      {REQUEST_TYPES.map(type => (
                        <option key={type} value={type}>
                          {t(`requestTypes.${type}`)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('permits.vehiclePlate')}
                    </label>
                    <VehiclePlateInput
                      value={newPermit.vehiclePlate}
                      onChange={(value) => setNewPermit({ ...newPermit, vehiclePlate: value })}
                      disabled={submitting || newPermit.requestType === 'material_entrance' || newPermit.requestType === 'material_exit'}
                      required={true}
                      isRequired={newPermit.requestType !== 'material_entrance' && newPermit.requestType !== 'material_exit'}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {language === 'ar' ? 'صيغة: أرقام + حروف (مثال: ح ن ط 1234)' : 'Format: digits + letters (e.g., 1234 T N J)'}
                    </p>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-4">
                    <label className="block text-sm font-medium text-gray-700">
                      {t('permits.materials')}
                    </label>
                    {newPermit.requestType !== 'heavy_vehicle_entrance_exit' && (
                      <button
                        type="button"
                        onClick={addMaterial}
                        className={`flex items-center space-x-2 text-sm ${
                          newPermit.materials.length >= 50 
                            ? 'text-gray-400 cursor-not-allowed' 
                            : 'text-purple-600 hover:text-purple-700'
                        }`}
                        disabled={submitting || newPermit.materials.length >= 50}
                      >
                        <Plus className="w-4 h-4" />
                        <span>
                          {t('permits.addMaterial')} ({newPermit.materials.length}/50)
                        </span>
                      </button>
                    )}
                  </div>

                  <div className="space-y-3">
                    {newPermit.materials.map((material, index) => (
                      <div key={material.id} className="flex gap-3 items-start">
                        <div className="flex-1">
                          <input
                            type="text"
                            placeholder={t('permits.materialDescription')}
                            value={material.description}
                            onChange={(e) => updateMaterial(material.id, 'description', e.target.value)}
                            className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                              newPermit.requestType === 'heavy_vehicle_entrance_exit' ? 'bg-gray-100 text-gray-500' : ''
                            }`}
                            required
                            disabled={submitting || newPermit.requestType === 'heavy_vehicle_entrance_exit'}
                          />
                        </div>
                        <div className="flex-1">
                          <input
                            type="text"
                            placeholder={t('permits.serialNumber')}
                            value={material.serialNumber}
                            onChange={(e) => updateMaterial(material.id, 'serialNumber', e.target.value)}
                            className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                              newPermit.requestType === 'heavy_vehicle_entrance_exit' ? 'bg-gray-100 text-gray-500' : ''
                            }`}
                            required
                            disabled={submitting || newPermit.requestType === 'heavy_vehicle_entrance_exit'}
                          />
                        </div>
                        {newPermit.materials.length > 1 && newPermit.requestType !== 'heavy_vehicle_entrance_exit' && (
                          <button
                            type="button"
                            onClick={() => removeMaterial(material.id)}
                            className="text-red-600 hover:text-red-700 p-2"
                            disabled={submitting}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-6">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    disabled={submitting}
                  >
                    {t('permits.cancel')}
                  </button>
                  <button
                    type="submit"
                    className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>{submitting ? t('common.loading') : t('permits.save')}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Permit Modal */}
      {viewingPermit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto mx-2">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  {t('permits.view')} - {viewingPermit.permitNumber}
                </h2>
                <button
                  onClick={() => {
                    setViewingPermit(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    {t('permits.permitNumber')}
                  </label>
                  <p className="text-sm text-gray-900">{viewingPermit.permitNumber}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    {t('permits.date')}
                  </label>
                  <p className="text-sm text-gray-900">{new Date(viewingPermit.date).toLocaleDateString('en-GB')}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    {t('permits.region')}
                  </label>
                  <p className="text-sm text-gray-900">{t(`regions.${viewingPermit.region}`)}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    {t('permits.location')}
                  </label>
                  <p className="text-sm text-gray-900">{viewingPermit.location}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    {t('permits.carrierName')}
                  </label>
                  <p className="text-sm text-gray-900">{viewingPermit.carrierName}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    {t('permits.carrierId')}
                  </label>
                  <p className="text-sm text-gray-900">{viewingPermit.carrierId}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    {t('permits.requestType')}
                  </label>
                  <p className="text-sm text-gray-900">{t(`requestTypes.${viewingPermit.requestType}`)}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    {t('permits.vehiclePlate')}
                  </label>
                  <p className="text-sm text-gray-900 font-mono">{getDisplayVehiclePlate(viewingPermit.vehiclePlate)}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    {t('permits.status')}
                  </label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    viewingPermit.closedAt 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {viewingPermit.closedAt ? t('permits.closed') : t('permits.active')}
                  </span>
                </div>

                {viewingPermit.closedAt && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">
                        {t('permits.closedBy')}
                      </label>
                      <p className="text-sm text-gray-900">{viewingPermit.closedByName}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">
                        {t('permits.closedAt')}
                      </label>
                      <p className="text-sm text-gray-900">{new Date(viewingPermit.closedAt).toLocaleDateString('en-GB')} {new Date(viewingPermit.closedAt).toLocaleTimeString('en-GB', { hour12: false })}</p>
                    </div>
                  </>
                )}
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-500 mb-3">
                  {t('permits.materials')}
                </label>
                <div className="space-y-2">
                  {viewingPermit.materials.map((material, index) => (
                    <div key={material.id} className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-900 font-medium">{material.description}</p>
                      <p className="text-xs text-gray-600">S/N: {material.serialNumber}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR Scanner */}
      <QRScanner
        isOpen={showQRScanner}
        onScan={handleQRScan}
        onClose={() => setShowQRScanner(false)}
      />
      
      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirm.isOpen}
        title={confirm.title}
        message={confirm.message}
        confirmText={confirm.confirmText}
        cancelText={confirm.cancelText}
        type={confirm.type}
        onConfirm={confirm.onConfirm}
        onCancel={confirm.onCancel}
      />
      
      {/* Alert Dialog */}
      <AlertDialog
        isOpen={alert.isOpen}
        title={alert.title}
        message={alert.message}
        type={alert.type}
        onClose={hideAlert}
        autoClose={alert.type === 'success'}
      />
    </div>
  );
};

export default HomePage;