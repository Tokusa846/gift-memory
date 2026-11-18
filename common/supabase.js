import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// 開発用Supabase
const devConfig = {
  url: "https://qacqrcpkirbqbwrdyicj.supabase.co",
  key: "sb_publishable_1PaIF7J12ngL4JnRnWpU1g_d62nRmx3",
};

// 本番用Supabase
const prodConfig = {
  url: "https://oimqblqfnxrtqybqllwv.supabase.co",
  key: "sb_publishable_JPnh3uVEEIpRbGxiLxxxLA_OKnxhzFM"
};

// ローカル環境かどうかを判定
const isLocal = ["localhost", "127.0.0.1"].includes(
  window.location.hostname
);

// 接続先を選択
const config = isLocal ? devConfig : prodConfig;

export const supabase = createClient(config.url, config.key);