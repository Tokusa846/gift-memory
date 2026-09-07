import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = "https://oimqblqfnxrtqybqllwv.supabase.co";
const supabaseKey = "sb_publishable_JPnh3uVEEIpRbGxiLxxxLA_OKnxhzFM";

export const supabase = createClient(supabaseUrl, supabaseKey);