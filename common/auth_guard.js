
import { supabase } from "./supabase.js";

async function checkAuthentication() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      window.location.replace("/auth/login.html");
      return;
    }

    // 認証成功後に画面を表示
    document.documentElement.style.visibility = "visible";
  } catch (error) {
    console.error("認証確認エラー:", error);
    window.location.replace("/auth/login.html");
  }
}

checkAuthentication();
