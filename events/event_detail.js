/* ========================================
   IMPORT
   Supabase接続と画面遷移の共通関数
======================================== */

import { supabase } from "../common/supabase.js";
import {
  getReturnUrl,
  buildUrlWithReturnTo
} from "../common/navigation.js";


/* ========================================
   STATE / CONSTANTS
   URLパラメータ・表示対象イベント・イベント種別
======================================== */

const params = new URLSearchParams(window.location.search);
const eventId = params.get("event_id");
const returnTo = getReturnUrl() || new URL("../index.html", window.location.href).href;
let currentEvent = null;

// イベント種別に応じた表示名とアイコン
const TYPES = {
  birthday: { label: "誕生日", icon: "fa-solid fa-cake-candles" },
  anniversary: { label: "記念日", icon: "fa-solid fa-heart" },
  celebration: { label: "お祝い", icon: "fa-solid fa-champagne-glasses" },
  gift: { label: "プレゼント予定", icon: "fa-solid fa-gift" }, // 過去データ用
  other: { label: "その他", icon: "fa-regular fa-calendar" }
};


/* ========================================
   TEXT HELPER
   指定した要素のテキストを設定する
======================================== */

function setText(id, value) {
  const el = document.getElementById(id);

  if (el) {
    el.textContent = value;
  }
}


/* ========================================
   FORMAT DATE
   YYYY-MM-DD形式の日付を日本語表記に変換する
======================================== */

function formatDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) {
    return "未登録";
  }

  const [year, month, day] = value.split("-").map(Number);
  return `${year}年${month}月${day}日`;
}


/* ========================================
   FORMAT PERSON NAME
   人物名に敬称がない場合は「さん」を付ける
======================================== */

function formatPersonName(value) {
  const name = String(value ?? "").trim();

  if (!name) {
    return "未登録";
  }

  return /(?:さん|様|さま|くん|君|ちゃん)$/.test(name)
    ? name
    : `${name}さん`;
}


/* ========================================
   SHOW ERROR
   読み込み画面・詳細画面を隠してエラーを表示する
======================================== */

function showError(message) {
  document.getElementById("eventDetailsLoading").classList.add("hidden");
  document.getElementById("eventDetailsContent").classList.add("hidden");

  const error = document.getElementById("eventDetailsError");
  error.querySelector("p").textContent = message;
  error.classList.remove("hidden");
}


/* ========================================
   LOAD EVENT
   イベント情報と関連人物名を取得する
======================================== */

async function loadEvent() {
  // イベント本体を取得
  const { data, error } = await supabase
    .from("events")
    .select("id,event_type,title,event_date,person_id,related_person_name,is_yearly,memo")
    .eq("id", eventId)
    .maybeSingle();

  if (error || !data) {
    console.error("イベント取得失敗:", error);
    showError("イベント情報を取得できませんでした。");
    return;
  }

  currentEvent = data;

  // 人物IDがある場合は登録済み人物から名前を取得する
  if (data.person_id) {
    const { data: person, error: personError } = await supabase
      .from("people")
      .select("name")
      .eq("id", data.person_id)
      .maybeSingle();

    if (personError) {
      console.warn("関連人物を取得できませんでした:", personError);
    }

    currentEvent.personName = person?.name || "登録済み人物（情報なし）";
  } else {
    // 人物IDがない場合は自由入力の人物名を使用する
    currentEvent.personName = data.related_person_name || "";
  }

  renderEvent();
}


/* ========================================
   RENDER EVENT
   取得したイベント情報を詳細画面に反映する
======================================== */

function renderEvent() {
  const event = currentEvent;
  const type = TYPES[event.event_type] || TYPES.other;
  const summary = document.getElementById("eventDetailsSummary");

  // イベント種別に応じた見た目とアイコン
  summary.classList.remove("birthday", "anniversary", "celebration", "gift", "other");
  summary.classList.add(TYPES[event.event_type] ? event.event_type : "other");
  document.getElementById("eventDetailsTypeIcon").className = type.icon;

  // イベントの基本情報
  setText("eventDetailsType", type.label);
  setText("eventDetailsTitle", event.title || "イベント名未登録");
  setText("eventDetailsDate", formatDate(event.event_date));
  setText("eventDetailsPerson", formatPersonName(event.personName));
  setText("eventDetailsRepeat", event.is_yearly ? "毎年" : "なし");
  setText("eventDetailsMemo", event.memo || "メモは登録されていません");

  // 読み込み表示を終了して詳細画面を表示する
  document.getElementById("eventDetailsLoading").classList.add("hidden");
  document.getElementById("eventDetailsError").classList.add("hidden");
  document.getElementById("eventDetailsContent").classList.remove("hidden");
}


/* ========================================
   DETAIL URL
   編集後に戻るためのイベント詳細URLを作成する
======================================== */

function detailUrl() {
  const url = `event_detail.html?event_id=${encodeURIComponent(eventId)}&refresh=${Date.now()}`;

  return buildUrlWithReturnTo(url, returnTo);
}


/* ========================================
   SETUP MENU
   メニュー開閉・イベント編集・削除の操作を設定する
======================================== */

function setupMenu() {
  const toggle = document.getElementById("eventDetailsActionsToggle");
  const menu = document.getElementById("eventDetailsActionsMenu");

  // 操作メニューを閉じる
  function close() {
    menu.classList.add("hidden");
    toggle.setAttribute("aria-expanded", "false");
  }

  // メニューボタンを押したときの開閉
  toggle.addEventListener("click", e => {
    e.stopPropagation();

    const open = menu.classList.contains("hidden");
    menu.classList.toggle("hidden", !open);
    toggle.setAttribute("aria-expanded", String(open));
  });

  // メニューの外側を押したら閉じる
  document.addEventListener("click", e => {
    if (!e.target.closest(".event-details-actions")) {
      close();
    }
  });

  // 編集画面へ移動し、編集後の戻り先をイベント詳細画面にする
  document.getElementById("eventDetailsEditButton").addEventListener("click", () => {
    if (!currentEvent) {
      return;
    }

    window.location.href = buildUrlWithReturnTo(
      `event.html?event_id=${encodeURIComponent(eventId)}`,
      detailUrl()
    );
  });

  // 削除の確認・実行・削除後の画面遷移
  document.getElementById("eventDetailsDeleteButton").addEventListener("click", async e => {
    if (!currentEvent) {
      return;
    }

    close();

    if (!window.confirm(`「${currentEvent.title || "このイベント"}」を削除しますか？\nこの操作は取り消せません。`)) {
      return;
    }

    const button = e.currentTarget;
    button.disabled = true;
    button.textContent = "削除中...";

    const { data, error } = await supabase
      .from("events")
      .delete()
      .eq("id", currentEvent.id)
      .select("id")
      .maybeSingle();

    // 削除失敗時はメッセージを出し、ボタンを元に戻す
    if (error || !data) {
      console.error("イベント削除失敗:", error);
      window.alert("イベントを削除できませんでした。");
      button.disabled = false;
      button.innerHTML = '<i class="fa-regular fa-trash-can"></i><span>削除</span>';
      return;
    }

    // 削除成功後は遷移元の画面に戻る
    window.alert("イベントを削除しました。");
    window.location.href = returnTo;
  });
}


/* ========================================
   INITIALIZE
   戻るリンク・操作メニューを設定し、イベントを読み込む
======================================== */

async function initialize() {
  document.getElementById("eventDetailsBackButton").href = returnTo;
  document.getElementById("eventDetailsErrorBack").href = returnTo;

  setupMenu();

  if (!eventId) {
    showError("イベントが指定されていません。");
    return;
  }

  await loadEvent();
}


/* ========================================
   EVENT LISTENERS
   初期表示とブラウザ復元時のデータ再取得
======================================== */

document.addEventListener("DOMContentLoaded", initialize);

window.addEventListener("pageshow", async event => {
  if (event.persisted && eventId) {
    await loadEvent();
  }
});
