import express from 'express';
import { supabase } from '../config/database.js';
import { requirePermission } from '../middleware/auth.js';

const router = express.Router();

// Get statistics
router.get('/', requirePermission('canViewStatistics'), async (req, res) => {
  try {
    // Get total permits
    const { count: totalPermits, error: totalError } = await supabase
      .from('permits')
      .select('*', { count: 'exact', head: true });

    if (totalError) {
      return res.status(500).json({ error: 'Failed to fetch total permits' });
    }

    // Get active permits
    const { count: activePermits, error: activeError } = await supabase
      .from('permits')
      .select('*', { count: 'exact', head: true })
      .is('closed_at', null);

    if (activeError) {
      return res.status(500).json({ error: 'Failed to fetch active permits' });
    }

    // Get closed permits
    const { count: closedPermits, error: closedError } = await supabase
      .from('permits')
      .select('*', { count: 'exact', head: true })
      .not('closed_at', 'is', null);

    if (closedError) {
      return res.status(500).json({ error: 'Failed to fetch closed permits' });
    }

    // Get total users
    const { count: totalUsers, error: usersError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (usersError) {
      return res.status(500).json({ error: 'Failed to fetch total users' });
    }

    // Get permits by region
    const { data: permitsByRegion, error: regionError } = await supabase
      .from('permits')
      .select('region')
      .order('region');

    if (regionError) {
      return res.status(500).json({ error: 'Failed to fetch permits by region' });
    }

    const regionCounts = permitsByRegion.reduce((acc, permit) => {
      acc[permit.region] = (acc[permit.region] || 0) + 1;
      return acc;
    }, {});

    // Get permits by type
    const { data: permitsByType, error: typeError } = await supabase
      .from('permits')
      .select('request_type')
      .order('request_type');

    if (typeError) {
      return res.status(500).json({ error: 'Failed to fetch permits by type' });
    }

    const typeCounts = permitsByType.reduce((acc, permit) => {
      acc[permit.request_type] = (acc[permit.request_type] || 0) + 1;
      return acc;
    }, {});

    // Get permits trend (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: permitsTrend, error: trendError } = await supabase
      .from('permits')
      .select('date')
      .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
      .order('date');

    if (trendError) {
      return res.status(500).json({ error: 'Failed to fetch permits trend' });
    }

    const trendCounts = permitsTrend.reduce((acc, permit) => {
      acc[permit.date] = (acc[permit.date] || 0) + 1;
      return acc;
    }, {});

    // Get top carriers
    const { data: topCarriers, error: carriersError } = await supabase
      .from('permits')
      .select('carrier_name')
      .order('carrier_name');

    if (carriersError) {
      return res.status(500).json({ error: 'Failed to fetch top carriers' });
    }

    const carrierCounts = topCarriers.reduce((acc, permit) => {
      acc[permit.carrier_name] = (acc[permit.carrier_name] || 0) + 1;
      return acc;
    }, {});

    const topCarriersArray = Object.entries(carrierCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    // Get top closers
    const { data: topClosers, error: closersError } = await supabase
      .from('permits')
      .select('closed_by_name')
      .not('closed_by_name', 'is', null);

    if (closersError) {
      return res.status(500).json({ error: 'Failed to fetch top closers' });
    }

    const closerCounts = topClosers.reduce((acc, permit) => {
      if (permit.closed_by_name) {
        acc[permit.closed_by_name] = (acc[permit.closed_by_name] || 0) + 1;
      }
      return acc;
    }, {});

    const topClosersArray = Object.entries(closerCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    // Get top creators
    const { data: topCreators, error: creatorsError } = await supabase
      .from('permits')
      .select(`
        created_by,
        users!permits_created_by_fkey (
          first_name,
          last_name
        )
      `);

    if (creatorsError) {
      return res.status(500).json({ error: 'Failed to fetch top creators' });
    }

    const creatorCounts = topCreators.reduce((acc, permit) => {
      if (permit.users) {
        const creatorName = `${permit.users.first_name} ${permit.users.last_name}`;
        acc[creatorName] = (acc[creatorName] || 0) + 1;
      }
      return acc;
    }, {});

    const topCreatorsArray = Object.entries(creatorCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    res.json({
      totalPermits: totalPermits || 0,
      activePermits: activePermits || 0,
      closedPermits: closedPermits || 0,
      totalUsers: totalUsers || 0,
      permitsByRegion: regionCounts,
      permitsByType: typeCounts,
      permitsTrend: trendCounts,
      topCarriers: topCarriersArray,
      topClosers: topClosersArray,
      topCreators: topCreatorsArray
    });
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

export default router;