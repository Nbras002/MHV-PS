import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('🔧 Frontend Supabase Configuration:');
console.log('- URL:', supabaseUrl ? 'Configured' : 'Missing');
console.log('- Anon Key:', supabaseAnonKey ? 'Configured' : 'Missing');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Required: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY');
  console.error('Current values:', { supabaseUrl, supabaseAnonKey });
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder-key'
);

// Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          username: string;
          password: string;
          email: string;
          first_name: string;
          last_name: string;
          region: string[];
          role: string;
          permissions: any;
          created_at: string;
          last_login: string | null;
        };
        Insert: {
          id?: string;
          username: string;
          password: string;
          email: string;
          first_name: string;
          last_name: string;
          region?: string[];
          role?: string;
          permissions?: any;
          created_at?: string;
          last_login?: string | null;
        };
        Update: {
          id?: string;
          username?: string;
          password?: string;
          email?: string;
          first_name?: string;
          last_name?: string;
          region?: string[];
          role?: string;
          permissions?: any;
          created_at?: string;
          last_login?: string | null;
        };
      };
      permits: {
        Row: {
          id: string;
          permit_number: string;
          date: string;
          region: string;
          location: string;
          carrier_name: string;
          carrier_id: string;
          request_type: string;
          vehicle_plate: string;
          materials: any[];
          closed_by: string | null;
          closed_at: string | null;
          closed_by_name: string | null;
          can_reopen: boolean;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          permit_number: string;
          date: string;
          region: string;
          location: string;
          carrier_name: string;
          carrier_id: string;
          request_type: string;
          vehicle_plate: string;
          materials?: any[];
          closed_by?: string | null;
          closed_at?: string | null;
          closed_by_name?: string | null;
          can_reopen?: boolean;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          permit_number?: string;
          date?: string;
          region?: string;
          location?: string;
          carrier_name?: string;
          carrier_id?: string;
          request_type?: string;
          vehicle_plate?: string;
          materials?: any[];
          closed_by?: string | null;
          closed_at?: string | null;
          closed_by_name?: string | null;
          can_reopen?: boolean;
          created_by?: string;
          created_at?: string;
        };
      };
      activity_logs: {
        Row: {
          id: string;
          user_id: string;
          user_name: string;
          action: string;
          details: string;
          timestamp: string;
          ip: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          user_name: string;
          action: string;
          details: string;
          timestamp?: string;
          ip?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          user_name?: string;
          action?: string;
          details?: string;
          timestamp?: string;
          ip?: string | null;
        };
      };
      role_permissions: {
        Row: {
          id: string;
          role: string;
          permissions: any;
          updated_at: string;
        };
        Insert: {
          id?: string;
          role: string;
          permissions: any;
          updated_at?: string;
        };
        Update: {
          id?: string;
          role?: string;
          permissions?: any;
          updated_at?: string;
        };
      };
    };
  };
}