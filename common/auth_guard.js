
import { supabase } from "./supabase.js";

let redirecting = false;

function redirectToLogin() {
  if (redirecting) return;
  redirecting = true;

  document.documentElement.style.visibility = "hidden";
  window.location.replace("/auth/login.html");
}

// ログイン状態の変化を監視
supabase.auth.onAuthStateChange((event) => {
  if (event === "SIGNED_OUT") {
    redirectToLogin();
  }
});

// ページを開いたときの認証確認
async function checkAuthentication() {
  try {
    const {
      data: { user },
      error
    } = await supabase.auth.getUser();

    if (error || !user) {
      redirectToLogin();
      return;
    }

    // 認証確認が終わったら画面を表示
    if (!redirecting) {
      document.documentElement.style.visibility = "visible";
    }
  } catch (error) {
    console.error("認証確認エラー:", error);
    redirectToLogin();
  }
}

checkAuthentication();
