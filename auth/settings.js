import { supabase } from "../common/supabase.js";

const emailElement = document.getElementById("accountEmail");
const messageElement = document.getElementById("settingsMessage");
const logoutButton = document.getElementById("logoutButton");

async function initializeSettings() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      window.location.replace("./login.html");
      return;
    }
    emailElement.textContent = user.email ?? "メールアドレス未登録";
    logoutButton.disabled = false;
  } catch (error) {
    console.error("アカウント確認エラー:", error);
    emailElement.textContent = "確認できませんでした";
    messageElement.textContent = "通信エラーが発生しました。ページを再読み込みしてください。";
  }
}

logoutButton.addEventListener("click", async () => {
  if (logoutButton.disabled) return;
  logoutButton.disabled = true;
  logoutButton.textContent = "ログアウト中...";
  messageElement.textContent = "";
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    window.location.replace("./login.html");
  } catch (error) {
    console.error("ログアウトエラー:", error);
    messageElement.textContent = "ログアウトできませんでした。もう一度お試しください。";
    logoutButton.disabled = false;
    logoutButton.textContent = "ログアウト";
  }
});

initializeSettings();
