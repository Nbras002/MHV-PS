import express from 'express';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import { supabase } from '../config/database.js';
import { requireRole, requirePermission } from '../middleware/auth.js';

const router = express.Router();

// Get all users (admin only)
router.get('/', requirePermission('canManageUsers'), async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, username, email, first_name, last_name, region, role, created_at, last_login')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch users' });
    }

    // Convert database format to frontend format
    const formattedUsers = users.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      region: user.region,
      role: user.role,
      permissions: user.permissions,
      createdAt: user.created_at,
      lastLogin: user.last_login
    }));

    res.json({ users: formattedUsers });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Create user (admin only)
router.post('/', [
  requirePermission('canManageUsers'),
  body('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('firstName').trim().isLength({ min: 1 }).withMessage('First name is required'),
  body('lastName').trim().isLength({ min: 1 }).withMessage('Last name is required'),
  body('role').isIn(['admin', 'manager', 'security_officer', 'observer']).withMessage('Valid role is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password, email, firstName, lastName, region, role } = req.body;

    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .or(`username.eq.${username},email.eq.${email}`)
      .single();

    if (existingUser) {
      return res.status(409).json({ error: 'Username or email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        username,
        password: hashedPassword,
        email,
        first_name: firstName,
        last_name: lastName,
        region: region || ['headquarters'],
        role: role || 'observer'
      })
      .select('id, username, email, first_name, last_name, region, role, created_at, last_login')
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to create user' });
    }

    // Log activity
    await supabase
      .from('activity_logs')
      .insert({
        user_id: req.user.id,
        name: `${req.user.first_name} ${req.user.last_name}`,
        username: req.user.username,
        action: 'create_user',
        details: `Created user ${username}`,
        ip: req.clientIP || 'unknown',
        user_agent: req.userAgent || 'unknown'
      });

    // Convert database format to frontend format
    const formattedUser = {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      firstName: newUser.first_name,
      lastName: newUser.last_name,
      region: newUser.region,
      role: newUser.role,
      permissions: newUser.permissions,
      createdAt: newUser.created_at,
      lastLogin: newUser.last_login
    };

    res.status(201).json({ user: formattedUser });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Update user (admin only)
router.put('/:id', [
  requirePermission('canManageUsers'),
  body('username').optional().trim().isLength({ min: 3 }),
  body('password').optional().isLength({ min: 8 }),
  body('email').optional().isEmail(),
  body('firstName').optional().trim().isLength({ min: 1 }),
  body('lastName').optional().trim().isLength({ min: 1 }),
  body('role').optional().isIn(['admin', 'manager', 'security_officer', 'observer'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const updateData = { ...req.body };

    // Hash password if provided
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 12);
    }

    // Convert camelCase to snake_case for database
    if (updateData.firstName) {
      updateData.first_name = updateData.firstName;
      delete updateData.firstName;
    }
    if (updateData.lastName) {
      updateData.last_name = updateData.lastName;
      delete updateData.lastName;
    }

    const { data: user, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select('id, username, email, first_name, last_name, region, role, created_at, last_login')
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to update user' });
    }

    // Convert database format to frontend format
    const formattedUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      region: user.region,
      role: user.role,
      permissions: user.permissions,
      createdAt: user.created_at,
      lastLogin: user.last_login
    };

    // Log activity
    await supabase
      .from('activity_logs')
      .insert({
        user_id: req.user.id,
        name: `${req.user.first_name} ${req.user.last_name}`,
        username: req.user.username,
        action: 'update_user',
        details: `Updated user ${user.username}`,
        ip: req.clientIP || 'unknown',
        user_agent: req.userAgent || 'unknown'
      });

    res.json({ user: formattedUser });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user (admin only)
router.delete('/:id', requirePermission('canManageUsers'), async (req, res) => {
  try {
    const { id } = req.params;

    // Don't allow deleting self
    if (id === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    // Get user info before deletion
    const { data: userToDelete, error: fetchError } = await supabase
      .from('users')
      .select('username')
      .eq('id', id)
      .single();

    if (fetchError || !userToDelete) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(500).json({ error: 'Failed to delete user' });
    }

    // Log activity
    await supabase
      .from('activity_logs')
      .insert({
        user_id: req.user.id,
        name: `${req.user.first_name} ${req.user.last_name}`,
        username: req.user.username,
        action: 'delete_user',
        details: `Deleted user ${userToDelete.username}`,
        ip: req.clientIP || 'unknown',
        user_agent: req.userAgent || 'unknown'
      }
      )

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Get role permissions
router.get('/role-permissions', async (req, res) => {
  try {
    const { data: permissions, error } = await supabase
      .from('role_permissions')
      .select('*')
      .order('role');

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch role permissions' });
    }

    res.json({ permissions });
  } catch (error) {
    console.error('Get role permissions error:', error);
    res.status(500).json({ error: 'Failed to fetch role permissions' });
  }
});

// Update role permissions (admin only)
router.put('/role-permissions/:role', [
  requireRole(['admin']),
  body('permissions').isObject().withMessage('Permissions must be an object')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { role } = req.params;
    const { permissions } = req.body;

    const { data: rolePermissions, error } = await supabase
      .from('role_permissions')
      .upsert({
        role,
        permissions,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to update role permissions' });
    }

    res.json({ rolePermissions });
  } catch (error) {
    console.error('Update role permissions error:', error);
    res.status(500).json({ error: 'Failed to update role permissions' });
  }
});

export default router;