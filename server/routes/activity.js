import express from 'express';
import { supabase } from '../config/database.js';
import { requirePermission } from '../middleware/auth.js';

const router = express.Router();

// Get activity logs
router.get('/', requirePermission('canViewActivityLog'), async (req, res) => {
  try {
    const { search, action, date, limit = 100, offset = 0 } = req.query;

    let query = supabase
      .from('activity_logs')
      .select(`
        id,
        user_id,
        name,
        username,
        action,
        details,
        timestamp,
        ip,
        user_agent
      `)
      .order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.or(`name.ilike.%${search}%,username.ilike.%${search}%,details.ilike.%${search}%`);
    }

    if (action) {
      query = query.eq('action', action);
    }

    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      
      query = query
        .gte('timestamp', startDate.toISOString())
        .lt('timestamp', endDate.toISOString());
    }

    const { data: activities, error } = await query;

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch activity logs' });
    }

    // Format activities for frontend
    const formattedActivities = activities.map(activity => ({
      id: activity.id,
      userId: activity.user_id,
      name: activity.name,
      username: activity.username,
      action: activity.action,
      details: activity.details,
      timestamp: activity.timestamp,
      ip: activity.ip,
      userAgent: activity.user_agent
    }));

    // Get total count for pagination
    let countQuery = supabase
      .from('activity_logs')
      .select('*', { count: 'exact', head: true });

    if (search) {
      countQuery = countQuery.or(`name.ilike.%${search}%,username.ilike.%${search}%,details.ilike.%${search}%`);
    }

    if (action) {
      countQuery = countQuery.eq('action', action);
    }

    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      
      countQuery = countQuery
        .gte('timestamp', startDate.toISOString())
        .lt('timestamp', endDate.toISOString());
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      return res.status(500).json({ error: 'Failed to count activity logs' });
    }

    res.json({ 
      activities: formattedActivities,
      total: count,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Get activity logs error:', error);
    res.status(500).json({ error: 'Failed to fetch activity logs' });
  }
});

// Get unique actions for filtering
router.get('/actions', requirePermission('canViewActivityLog'), async (req, res) => {
  try {
    const { data: actions, error } = await supabase
      .from('activity_logs')
      .select('action')
      .order('action');

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch actions' });
    }

    const uniqueActions = [...new Set(actions.map(a => a.action))];

    res.json({ actions: uniqueActions });
  } catch (error) {
    console.error('Get actions error:', error);
    res.status(500).json({ error: 'Failed to fetch actions' });
  }
});

export default router;