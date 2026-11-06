import { supabase } from "../common/supabase.js";

const form = 
  document.getElementById("loginForm");
const message = 
  document.getElementById("loginMessage");
const button = 
  document.getElementById("loginButton");


function setMessage(text) {
  if (message) message.textContent = 
    text;
}


async function redirectIfLoggedIn() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (!error && user) {
      window.location.replace("../index.html");
    }
  } catch (error) {
    console.error("ログイン状態の確認に失敗:", error);
  }
}

redirectIfLoggedIn();



form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!button || button.disabled) return;

  const email = 
    document.getElementById("loginEmail")?.value.trim();
  const password = 
    document.getElementById("loginPassword")?.value;
  if (!email || !password) return;

  button.disabled = true;
  button.textContent = "ログイン中...";
  setMessage("");

  try {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setMessage("ログインできませんでした。メールアドレスとパスワードを確認してください。");
      return;
    }
    window.location.replace("../index.html");
  } catch (error) {
    console.error("ログイン通信エラー:", error);
    setMessage("通信エラーが発生しました。時間をおいて再度お試しください。");
  } finally {
    button.disabled = false;
    button.textContent = "ログインする";
  }
});
