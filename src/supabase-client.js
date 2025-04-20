const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://kkymclhbftvzcifshyai.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtreW1jbGhiZnR2emNpZnNoeWFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzIzODA4MzgsImV4cCI6MjA0Nzk1NjgzOH0.auWWiZlPUc-EVj4pAVg7FJXOUCAlTyFcAWcPMdzCkrs';
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = { supabase };