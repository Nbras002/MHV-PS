import { useState, useEffect } from 'react';
import { Permit } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { permitsAPI } from '../services/api';

export const usePermits = () => {
  const [permits, setPermits] = useState<Permit[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchPermits();
    }
  }, [user]);

  const fetchPermits = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching permits...');
      const response = await permitsAPI.getAll();
      console.log('✅ Permits fetched successfully:', response.data.permits?.length || 0, 'permits');
      setPermits(response.data.permits);
    } catch (error) {
      console.error('❌ Failed to fetch permits:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url
      });
    } finally {
      setLoading(false);
    }
  };

  const addPermit = async (permitData: Omit<Permit, 'id' | 'createdAt' | 'createdBy' | 'canReopen'>) => {
    try {
      console.log('🔄 Adding permit with data:', permitData);
      const response = await permitsAPI.create(permitData);
      const newPermit = response.data.permit;
      console.log('✅ Permit created successfully:', newPermit);
      // Fetch all permits to ensure we have the latest data with proper formatting
      await fetchPermits();
      return newPermit;
    } catch (error) {
      console.error('❌ Add permit error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url
      });
      throw error;
    }
  };

  const updatePermit = async (permitId: string, updates: Partial<Permit>) => {
    try {
      console.log('🔄 Updating permit:', permitId, 'with data:', updates);
      const response = await permitsAPI.update(permitId, updates);
      const updatedPermit = response.data.permit;
      console.log('✅ Permit updated successfully:', updatedPermit);
      // Fetch all permits to ensure we have the latest data with proper formatting
      await fetchPermits();
      return updatedPermit;
    } catch (error) {
      console.error('❌ Update permit error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url
      });
      throw error;
    }
  };

  const deletePermit = async (permitId: string) => {
    try {
      console.log('🔄 Deleting permit:', permitId);
      await permitsAPI.delete(permitId);
      console.log('✅ Permit deleted successfully');
      setPermits(prev => prev.filter(permit => permit.id !== permitId));
    } catch (error) {
      console.error('❌ Delete permit error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url
      });
      throw error;
    }
  };

  const closePermit = async (permitId: string) => {
    try {
      console.log('🔄 Closing permit:', permitId);
      const response = await permitsAPI.close(permitId);
      const updatedPermit = response.data.permit;
      console.log('✅ Permit closed successfully:', updatedPermit);
      // Fetch all permits to ensure we have the latest data with proper formatting
      await fetchPermits();
      return updatedPermit;
    } catch (error) {
      console.error('❌ Close permit error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url
      });
      throw error;
    }
  };

  const reopenPermit = async (permitId: string) => {
    try {
      console.log('🔄 Reopening permit:', permitId);
      const response = await permitsAPI.reopen(permitId);
      const updatedPermit = response.data.permit;
      console.log('✅ Permit reopened successfully:', updatedPermit);
      // Fetch all permits to ensure we have the latest data with proper formatting
      await fetchPermits();
      return true;
    } catch (error) {
      console.error('❌ Reopen permit error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url
      });
      return false;
    }
  };

  const generatePermitNumber = () => {
    const year = new Date().getFullYear();
    const count = permits.length + 1;
    return `MHV${year}${count.toString().padStart(6, '0')}`;
  };

  return {
    permits,
    loading,
    addPermit,
    updatePermit,
    deletePermit,
    closePermit,
    reopenPermit,
    generatePermitNumber,
    refetch: fetchPermits
  };
};