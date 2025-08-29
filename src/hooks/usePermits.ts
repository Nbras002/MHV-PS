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
      const response = await permitsAPI.getAll();
      setPermits(response.data.permits);
    } catch (error) {
      console.error('Failed to fetch permits:', error);
    } finally {
      setLoading(false);
    }
  };

  const addPermit = async (permitData: Omit<Permit, 'id' | 'createdAt' | 'createdBy' | 'canReopen'>) => {
    try {
      const response = await permitsAPI.create(permitData);
      const newPermit = response.data.permit;
      setPermits(prev => [newPermit, ...prev]);
      return newPermit;
    } catch (error) {
      console.error('Add permit error:', error);
      throw error;
    }
  };

  const updatePermit = async (permitId: string, updates: Partial<Permit>) => {
    try {
      const response = await permitsAPI.update(permitId, updates);
      const updatedPermit = response.data.permit;
      setPermits(prev => prev.map(permit => 
        permit.id === permitId ? updatedPermit : permit
      ));
      return updatedPermit;
    } catch (error) {
      console.error('Update permit error:', error);
      throw error;
    }
  };

  const deletePermit = async (permitId: string) => {
    try {
      await permitsAPI.delete(permitId);
      setPermits(prev => prev.filter(permit => permit.id !== permitId));
    } catch (error) {
      console.error('Delete permit error:', error);
      throw error;
    }
  };

  const closePermit = async (permitId: string) => {
    try {
      const response = await permitsAPI.close(permitId);
      const updatedPermit = response.data.permit;
      setPermits(prev => prev.map(permit => 
        permit.id === permitId ? updatedPermit : permit
      ));
      return updatedPermit;
    } catch (error) {
      console.error('Close permit error:', error);
      throw error;
    }
  };

  const reopenPermit = async (permitId: string) => {
    try {
      const response = await permitsAPI.reopen(permitId);
      const updatedPermit = response.data.permit;
      setPermits(prev => prev.map(permit => 
        permit.id === permitId ? updatedPermit : permit
      ));
      return true;
    } catch (error) {
      console.error('Reopen permit error:', error);
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