const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = environment.SUPABASE_URL;
const supabaseKey = environment.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = { supabase };