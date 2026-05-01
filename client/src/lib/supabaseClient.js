import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://igyhsnfdidrgcggjzivd.supabase.co'
const supabaseAnonKey = 'sb_publishable_QWd8DgaLa2WfvTum2h2Mdw_W41XSbEW'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)