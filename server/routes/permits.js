import express from 'express';
import { body, validationResult } from 'express-validator';
import { supabase } from '../config/database.js';
import { requirePermission } from '../middleware/auth.js';

const router = express.Router();

// Get all permits
router.get('/', requirePermission('canViewPermits'), async (req, res) => {
  try {
    const { region, date, search } = req.query;
    
    let query = supabase
      .from('permits')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply filters based on user role and region
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      query = query.in('region', req.user.region);
    }

    if (region) {
      query = query.eq('region', region);
    }

    if (date) {
      query = query.eq('date', date);
    }

    if (search) {
      query = query.or(`permit_number.ilike.%${search}%,carrier_name.ilike.%${search}%,carrier_id.ilike.%${search}%,location.ilike.%${search}%`);
    }

    const { data: permits, error } = await query;

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch permits' });
    }

    // Convert database format to frontend format
    const formattedPermits = permits.map(permit => ({
      id: permit.id,
      permitNumber: permit.permit_number,
      date: permit.date,
      region: permit.region,
      location: permit.location,
      carrierName: permit.carrier_name,
      carrierId: permit.carrier_id,
      requestType: permit.request_type,
      vehiclePlate: permit.vehicle_plate,
      materials: permit.materials,
      closedBy: permit.closed_by,
      closedAt: permit.closed_at,
      closedByName: permit.closed_by_name,
      canReopen: permit.can_reopen,
      createdBy: permit.created_by,
      createdAt: permit.created_at
    }));

    res.json({ permits: formattedPermits });
  } catch (error) {
    console.error('Get permits error:', error);
    res.status(500).json({ error: 'Failed to fetch permits' });
  }
});

// Get permit by ID
router.get('/:id', requirePermission('canViewPermits'), async (req, res) => {
  try {
    const { id } = req.params;

    const { data: permit, error } = await supabase
      .from('permits')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !permit) {
      return res.status(404).json({ error: 'Permit not found' });
    }

    // Check if user can view this permit based on region
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      if (!req.user.region.includes(permit.region)) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    // Convert database format to frontend format
    const formattedPermit = {
      id: permit.id,
      permitNumber: permit.permit_number,
      date: permit.date,
      region: permit.region,
      location: permit.location,
      carrierName: permit.carrier_name,
      carrierId: permit.carrier_id,
      requestType: permit.request_type,
      vehiclePlate: permit.vehicle_plate,
      materials: permit.materials,
      closedBy: permit.closed_by,
      closedAt: permit.closed_at,
      closedByName: permit.closed_by_name,
      canReopen: permit.can_reopen,
      createdBy: permit.created_by,
      createdAt: permit.created_at
    };

    res.json({ permit: formattedPermit });
  } catch (error) {
    console.error('Get permit error:', error);
    res.status(500).json({ error: 'Failed to fetch permit' });
  }
});

// Create permit
router.post('/', [
  requirePermission('canCreatePermits'),
  body('permitNumber').trim().isLength({ min: 1 }).withMessage('Permit number is required'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('region').trim().isLength({ min: 1 }).withMessage('Region is required'),
  body('location').trim().isLength({ min: 1 }).withMessage('Location is required'),
  body('carrierName').trim().isLength({ min: 1 }).withMessage('Carrier name is required'),
  body('carrierId').trim().isLength({ min: 1 }).withMessage('Carrier ID is required'),
  body('requestType').trim().isLength({ min: 1 }).withMessage('Request type is required'),
  body('vehiclePlate').trim().isLength({ min: 1 }).withMessage('Vehicle plate is required'),
  body('materials').isArray({ min: 1 }).withMessage('At least one material is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const permitData = {
      permit_number: req.body.permitNumber,
      date: req.body.date,
      region: req.body.region,
      location: req.body.location,
      carrier_name: req.body.carrierName,
      carrier_id: req.body.carrierId,
      request_type: req.body.requestType,
      vehicle_plate: req.body.vehiclePlate,
      materials: req.body.materials,
      created_by: req.user.id,
      can_reopen: true
    };

    // Check if user can create permits in this region
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      if (!req.user.region.includes(permitData.region)) {
        return res.status(403).json({ error: 'Cannot create permits in this region' });
      }
    }

    const { data: permit, error } = await supabase
      .from('permits')
      .insert(permitData)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({ error: 'Permit number already exists' });
      }
      return res.status(500).json({ error: 'Failed to create permit' });
    }

    // Convert database format to frontend format
    const formattedPermit = {
      id: permit.id,
      permitNumber: permit.permit_number,
      date: permit.date,
      region: permit.region,
      location: permit.location,
      carrierName: permit.carrier_name,
      carrierId: permit.carrier_id,
      requestType: permit.request_type,
      vehiclePlate: permit.vehicle_plate,
      materials: permit.materials,
      closedBy: permit.closed_by,
      closedAt: permit.closed_at,
      closedByName: permit.closed_by_name,
      canReopen: permit.can_reopen,
      createdBy: permit.created_by,
      createdAt: permit.created_at
    };

    // Log activity
    await supabase
      .from('activity_logs')
      .insert({
        user_id: req.user.id,
        name: `${req.user.first_name} ${req.user.last_name}`,
        username: req.user.username,
        action: 'create_permit',
        details: `Created permit ${permit.permit_number}`,
        ip: req.clientIP || 'unknown',
        user_agent: req.userAgent || 'unknown'
      });

    res.status(201).json({ permit: formattedPermit });
  } catch (error) {
    console.error('Create permit error:', error);
    res.status(500).json({ error: 'Failed to create permit' });
  }
});

// Update permit
router.put('/:id', [
  requirePermission('canEditPermits'),
  body('permitNumber').optional().trim().isLength({ min: 1 }),
  body('date').optional().isISO8601(),
  body('region').optional().trim().isLength({ min: 1 }),
  body('location').optional().trim().isLength({ min: 1 }),
  body('carrierName').optional().trim().isLength({ min: 1 }),
  body('carrierId').optional().trim().isLength({ min: 1 }),
  body('requestType').optional().trim().isLength({ min: 1 }),
  body('vehiclePlate').optional().trim().isLength({ min: 1 }),
  body('materials').optional().isArray({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;

    // Check if permit exists and user can edit it
    const { data: existingPermit, error: fetchError } = await supabase
      .from('permits')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingPermit) {
      return res.status(404).json({ error: 'Permit not found' });
    }

    // Check region access
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      if (!req.user.region.includes(existingPermit.region)) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    // Don't allow editing closed permits
    if (existingPermit.closed_at) {
      return res.status(400).json({ error: 'Cannot edit closed permit' });
    }

    // Convert camelCase to snake_case for database
    const updateData = {};
    if (req.body.permitNumber) updateData.permit_number = req.body.permitNumber;
    if (req.body.date) updateData.date = req.body.date;
    if (req.body.region) updateData.region = req.body.region;
    if (req.body.location) updateData.location = req.body.location;
    if (req.body.carrierName) updateData.carrier_name = req.body.carrierName;
    if (req.body.carrierId) updateData.carrier_id = req.body.carrierId;
    if (req.body.requestType) updateData.request_type = req.body.requestType;
    if (req.body.vehiclePlate) updateData.vehicle_plate = req.body.vehiclePlate;
    if (req.body.materials) updateData.materials = req.body.materials;

    const { data: permit, error } = await supabase
      .from('permits')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to update permit' });
    }

    // Convert database format to frontend format
    const formattedPermit = {
      id: permit.id,
      permitNumber: permit.permit_number,
      date: permit.date,
      region: permit.region,
      location: permit.location,
      carrierName: permit.carrier_name,
      carrierId: permit.carrier_id,
      requestType: permit.request_type,
      vehiclePlate: permit.vehicle_plate,
      materials: permit.materials,
      closedBy: permit.closed_by,
      closedAt: permit.closed_at,
      closedByName: permit.closed_by_name,
      canReopen: permit.can_reopen,
      createdBy: permit.created_by,
      createdAt: permit.created_at
    };

    // Log activity
    await supabase
      .from('activity_logs')
      .insert({
        user_id: req.user.id,
        name: `${req.user.first_name} ${req.user.last_name}`,
        username: req.user.username,
        action: 'update_permit',
        details: `Updated permit ${permit.permit_number}`,
        ip: req.clientIP || 'unknown',
        user_agent: req.userAgent || 'unknown'
      });

    res.json({ permit: formattedPermit });
  } catch (error) {
    console.error('Update permit error:', error);
    res.status(500).json({ error: 'Failed to update permit' });
  }
});

// Close permit
router.patch('/:id/close', requirePermission('canClosePermits'), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if permit exists
    const { data: existingPermit, error: fetchError } = await supabase
      .from('permits')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingPermit) {
      return res.status(404).json({ error: 'Permit not found' });
    }

    if (existingPermit.closed_at) {
      return res.status(400).json({ error: 'Permit is already closed' });
    }

    // Check region access
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      if (!req.user.region.includes(existingPermit.region)) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const { data: permit, error } = await supabase
      .from('permits')
      .update({
        closed_by: req.user.id,
        closed_by_name: `${req.user.first_name} ${req.user.last_name}`,
        closed_at: new Date().toISOString(),
        can_reopen: true
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to close permit' });
    }

    // Convert database format to frontend format
    const formattedPermit = {
      id: permit.id,
      permitNumber: permit.permit_number,
      date: permit.date,
      region: permit.region,
      location: permit.location,
      carrierName: permit.carrier_name,
      carrierId: permit.carrier_id,
      requestType: permit.request_type,
      vehiclePlate: permit.vehicle_plate,
      materials: permit.materials,
      closedBy: permit.closed_by,
      closedAt: permit.closed_at,
      closedByName: permit.closed_by_name,
      canReopen: permit.can_reopen,
      createdBy: permit.created_by,
      createdAt: permit.created_at
    };

    // Log activity
    await supabase
      .from('activity_logs')
      .insert({
        user_id: req.user.id,
        name: `${req.user.first_name} ${req.user.last_name}`,
        username: req.user.username,
        action: 'close_permit',
        details: `Closed permit ${permit.permit_number}`,
        ip: req.clientIP || 'unknown',
        user_agent: req.userAgent || 'unknown'
      });

    res.json({ permit: formattedPermit });
  } catch (error) {
    console.error('Close permit error:', error);
    res.status(500).json({ error: 'Failed to close permit' });
  }
});

// Reopen permit
router.patch('/:id/reopen', requirePermission('canReopenPermits'), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if permit exists
    const { data: existingPermit, error: fetchError } = await supabase
      .from('permits')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingPermit) {
      return res.status(404).json({ error: 'Permit not found' });
    }

    if (!existingPermit.closed_at) {
      return res.status(400).json({ error: 'Permit is not closed' });
    }

    // Check reopen permissions
    const canReopenAny = ['admin', 'manager'].includes(req.user.role);
    const isClosedByUser = existingPermit.closed_by === req.user.id;
    const closedTime = new Date(existingPermit.closed_at);
    const hoursPassed = (new Date().getTime() - closedTime.getTime()) / (1000 * 60 * 60);

    if (!canReopenAny && (!isClosedByUser || hoursPassed > 1)) {
      return res.status(403).json({ error: 'Cannot reopen this permit' });
    }

    const { data: permit, error } = await supabase
      .from('permits')
      .update({
        closed_by: null,
        closed_by_name: null,
        closed_at: null,
        can_reopen: true
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to reopen permit' });
    }

    // Convert database format to frontend format
    const formattedPermit = {
      id: permit.id,
      permitNumber: permit.permit_number,
      date: permit.date,
      region: permit.region,
      location: permit.location,
      carrierName: permit.carrier_name,
      carrierId: permit.carrier_id,
      requestType: permit.request_type,
      vehiclePlate: permit.vehicle_plate,
      materials: permit.materials,
      closedBy: permit.closed_by,
      closedAt: permit.closed_at,
      closedByName: permit.closed_by_name,
      canReopen: permit.can_reopen,
      createdBy: permit.created_by,
      createdAt: permit.created_at
    };

    // Log activity
    await supabase
      .from('activity_logs')
      .insert({
        user_id: req.user.id,
        name: `${req.user.first_name} ${req.user.last_name}`,
        username: req.user.username,
        action: 'reopen_permit',
        details: `Reopened permit ${permit.permit_number}`,
        ip: req.clientIP || 'unknown',
        user_agent: req.userAgent || 'unknown'
      });

    res.json({ permit: formattedPermit });
  } catch (error) {
    console.error('Reopen permit error:', error);
    res.status(500).json({ error: 'Failed to reopen permit' });
  }
});

// Delete permit
router.delete('/:id', requirePermission('canDeletePermits'), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if permit exists
    const { data: existingPermit, error: fetchError } = await supabase
      .from('permits')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingPermit) {
      return res.status(404).json({ error: 'Permit not found' });
    }

    const { error } = await supabase
      .from('permits')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(500).json({ error: 'Failed to delete permit' });
    }

    // Log activity
    await supabase
      .from('activity_logs')
      .insert({
        user_id: req.user.id,
        name: `${req.user.first_name} ${req.user.last_name}`,
        username: req.user.username,
        action: 'delete_permit',
        details: `Deleted permit ${existingPermit.permit_number} for ${existingPermit.carrier_name}`,
        ip: req.clientIP || 'unknown',
        user_agent: req.userAgent || 'unknown'
      }
      )

    res.json({ message: 'Permit deleted successfully' });
  } catch (error) {
    console.error('Delete permit error:', error);
    res.status(500).json({ error: 'Failed to delete permit' });
  }
});

export default router;