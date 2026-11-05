import { supabase } from "../common/supabase.js";

const form = document.getElementById("setupPasswordForm");
const button = document.getElementById("setupPasswordButton");
const message = document.getElementById("setupPasswordMessage");
let invitationVerified = false;

function showMessage(text) {
  if (message) message.textContent = text;
}

async function checkInvitation() {
  // URLのエラー情報を優先して表示する
  const hash = new URLSearchParams(window.location.hash.slice(1));
  const query = new URLSearchParams(window.location.search);
  const errorDescription = hash.get("error_description") || query.get("error_description");
  if (errorDescription) {
    showMessage("招待リンクが無効か期限切れです。管理者に再招待を依頼してください。");
    return;
  }

  try {
    // Supabase JS v2は招待URLの認証情報を読み取ってセッションを設定する
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    if (!data.session) {
      showMessage("招待情報を確認できませんでした。招待メールのリンクから開いてください。");
      return;
    }
    invitationVerified = true;
    button.disabled = false;
    showMessage("");
  } catch (error) {
    console.error("招待情報の確認エラー:", error);
    showMessage("招待情報の確認に失敗しました。リンクを開き直してください。");
  }
}

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!invitationVerified || button.disabled) return;

  const password = document.getElementById("newPassword")?.value || "";
  const confirmation = document.getElementById("confirmPassword")?.value || "";
  if (password.length < 8) {
    showMessage("パスワードは8文字以上で入力してください。");
    return;
  }
  if (password !== confirmation) {
    showMessage("確認用パスワードが一致しません。");
    return;
  }

  button.disabled = true;
  button.textContent = "設定中...";
  showMessage("");

  try {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
    showMessage("パスワードを設定しました。ログイン画面に移動します。");
    await supabase.auth.signOut();
    window.location.replace("./login.html");
  } catch (error) {
    console.error("パスワード設定エラー:", error);
    showMessage("パスワードを設定できませんでした。入力内容や招待リンクを確認してください。");
    button.disabled = false;
    button.textContent = "パスワードを設定する";
  }
});

checkInvitation();
