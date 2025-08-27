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

  // Utility to convert camelCase keys to snake_case recursively
  const toSnakeCase = (obj: any): any => {
    if (Array.isArray(obj)) {
      return obj.map(toSnakeCase);
    } else if (obj !== null && typeof obj === 'object') {
      return Object.keys(obj).reduce((acc: { [key: string]: any }, key) => {
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        acc[snakeKey] = toSnakeCase(obj[key]);
        return acc;
      }, {});
    }
    return obj;
  };

  const addPermit = async (permitData: Omit<Permit, 'id' | 'createdAt' | 'createdBy' | 'canReopen'>) => {
    try {
      const snakePermitData = toSnakeCase(permitData);
      const response = await permitsAPI.create(snakePermitData);
      const newPermit = response.data.permit;
  setPermits((prev: Permit[]) => [newPermit, ...prev]);
      return newPermit;
    } catch (error: any) {
      // Log full error response for debugging
      if (error.response) {
        console.error('Add permit error:', error.response.data);
      } else {
        console.error('Add permit error:', error);
      }
      throw error;
    }
  };

  const updatePermit = async (permitId: string, updates: Partial<Permit>) => {
    try {
      const response = await permitsAPI.update(permitId, updates);
      const updatedPermit = response.data.permit;
      setPermits((prev: Permit[]) => prev.map((permit: Permit) => 
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
  setPermits((prev: Permit[]) => prev.filter((permit: Permit) => permit.id !== permitId));
    } catch (error) {
      console.error('Delete permit error:', error);
      throw error;
    }
  };

  const closePermit = async (permitId: string) => {
    try {
      const response = await permitsAPI.close(permitId);
      const updatedPermit = response.data.permit;
      setPermits((prev: Permit[]) => prev.map((permit: Permit) => 
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
      setPermits((prev: Permit[]) => prev.map((permit: Permit) => 
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