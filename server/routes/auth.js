import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { supabase } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Add a test route to verify the auth routes are working
router.get('/test', (req, res) => {
  res.json({ 
    message: 'Auth routes are working',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    hasSupabaseUrl: !!process.env.SUPABASE_URL,
    hasSupabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    hasJwtSecret: !!process.env.JWT_SECRET
  });
});

// Login
router.post('/login', [
  body('username').trim().isLength({ min: 1 }).withMessage('Username is required'),
  body('password').isLength({ min: 1 }).withMessage('Password is required')
], async (req, res) => {
  try {
    console.log('🔐 Login attempt:', {
      username: req.body.username,
      hasPassword: !!req.body.password,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;

    console.log('🔍 Searching for user:', username);

    // Find user
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();

    console.log('👤 User query result:', {
      found: !!user,
      error: error?.message,
      userId: user?.id
    });

    if (error || !user) {
      console.log('❌ User not found or error:', error?.message);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('🔒 Checking password for user:', user.username);

    // Check password
    let isValidPassword = false;
    
    // Check if password is already hashed or plain text (for initial admin user)
    if (user.password.startsWith('$2')) {
      // Password is hashed, use bcrypt
      isValidPassword = await bcrypt.compare(password, user.password);
    } else {
      // Password is plain text (initial setup), compare directly and then hash it
      isValidPassword = password === user.password;
      if (isValidPassword) {
        // Hash the password for future use
        const hashedPassword = await bcrypt.hash(password, 12);
        await supabase
          .from('users')
          .update({ password: hashedPassword })
          .eq('id', user.id);
        console.log('🔐 Password hashed for user:', user.username);
      }
    }

    console.log('🔑 Password validation result:', isValidPassword);

    if (!isValidPassword) {
      console.log('❌ Invalid password for user:', user.username);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('✅ Login successful for user:', user.username);

    // Update last login
    const { error: updateError } = await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);

    if (updateError) {
      console.log('⚠️ Failed to update last login:', updateError.message);
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    console.log('🎫 JWT token generated for user:', user.username);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    console.log('📤 Sending login response for user:', user.username);

    res.json({
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Register
router.post('/register', [
  body('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('firstName').trim().isLength({ min: 1 }).withMessage('First name is required'),
  body('lastName').trim().isLength({ min: 1 }).withMessage('Last name is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password, email, firstName, lastName, region } = req.body;

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
        role: 'observer'
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: 'Registration failed' });
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = newUser;

    res.status(201).json({
      message: 'Registration successful',
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Reset password
router.post('/reset-password', [
  body('username').trim().isLength({ min: 1 }).withMessage('Username is required'),
  body('oldPassword').isLength({ min: 1 }).withMessage('Old password is required'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, oldPassword, newPassword } = req.body;

    // Find user
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check old password
    const isValidPassword = await bcrypt.compare(oldPassword, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    const { error: updateError } = await supabase
      .from('users')
      .update({ password: hashedPassword })
      .eq('id', user.id);

    if (updateError) {
      return res.status(500).json({ error: 'Password reset failed' });
    }

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ error: 'Password reset failed' });
  }
});

// Get current user
router.get('/me', authenticateToken, (req, res) => {
  const { password: _, ...userWithoutPassword } = req.user;
  res.json({ user: userWithoutPassword });
});

// Logout
router.post('/logout', authenticateToken, async (req, res) => {
  try {

    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

export default router;