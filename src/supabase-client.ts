import { createClient } from '@supabase/supabase-js';
import { environment } from './environments/environment';

// Substitua pelas suas credenciais do Supabase
const SUPABASE_URL = environment.SUPABASE_URL;
const SUPABASE_KEY = environment.SUPABASE_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
