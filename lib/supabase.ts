
import { createClient } from '@supabase/supabase-js';

// Safe environment variable accessor that works in both Node (Vercel/Express) and browser
const getEnv = (key: string): string => {
    let val: string | undefined = '';

    // 1. Try process.env (Standard Node/Vercel/Express environment)
    try {
        if (typeof process !== 'undefined' && process.env) {
            val = process.env[key] || process.env[key.replace('VITE_', '')] || process.env[`REACT_APP_${key.replace('VITE_', '')}`];
        }
    } catch (e) { /* ignore */ }

    if (val) return val;

    return '';
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL') || 'https://ajkycqazreebczqjsfpv.supabase.co';
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqa3ljcWF6cmVlYmN6cWpzZnB2Iiwicm9sZSI6ImFnb24iLCJpYXQiOjE3Njg0OTM5MjMsImV4cCI6MjA4NDA2OTkyM30.VscG53hy5tT5_oT297RECiVzaCcCw51AYWQeme_PDRo';

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("⚠️ Supabase credentials missing. Please check your .env file.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

