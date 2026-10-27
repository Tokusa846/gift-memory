import { supabase } from "../common/supabase.js";
import {
  getReturnUrl,
  buildUrlWithReturnTo
} from "../common/navigation.js";


const params = new URLSearchParams(window.location.search);
const eventId = params.get("event_id");
const returnTo = getReturnUrl() || new URL("../index.html", window.location.href).href;
let currentEvent = null;

const TYPES = {
  birthday: { label: "誕生日", icon: "fa-solid fa-cake-candles" },
  anniversary: { label: "記念日", icon: "fa-solid fa-heart" },
  celebration: { label: "お祝い", icon: "fa-solid fa-champagne-glasses" },
  gift: { label: "プレゼント予定", icon: "fa-solid fa-gift" }, // 過去データ用
  other: { label: "その他", icon: "fa-regular fa-calendar" }
};


function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function formatDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return "未登録";
  const [year, month, day] = value.split("-").map(Number);
  return `${year}年${month}月${day}日`;
}

function formatPersonName(value) {
  const name = String(value ?? "").trim();
  if (!name) return "未登録";
  return /(?:さん|様|さま|くん|君|ちゃん)$/.test(name) ? name : `${name}さん`;
}

function showError(message) {
  document.getElementById("eventDetailsLoading").classList.add("hidden");
  document.getElementById("eventDetailsContent").classList.add("hidden");
  const error = document.getElementById("eventDetailsError");
  error.querySelector("p").textContent = message;
  error.classList.remove("hidden");
}

async function loadEvent() {
  const { data, error } = await supabase.from("events")
    .select("id,event_type,title,event_date,person_id,related_person_name,is_yearly,memo")
    .eq("id", eventId).maybeSingle();
  if (error || !data) {
    console.error("イベント取得失敗:", error);
    showError("イベント情報を取得できませんでした。");
    return;
  }
  currentEvent = data;
  if (data.person_id) {
    const { data: person, error: personError } = await supabase.from("people")
      .select("name").eq("id", data.person_id).maybeSingle();
    if (personError) console.warn("関連人物を取得できませんでした:", personError);
    currentEvent.personName = person?.name || "登録済み人物（情報なし）";
  } else {
    currentEvent.personName = data.related_person_name || "";
  }
  renderEvent();
}

function renderEvent() {
  const event = currentEvent;
  const type = TYPES[event.event_type] || TYPES.other;
  const summary = document.getElementById("eventDetailsSummary");
  summary.classList.remove("birthday", "anniversary", "celebration", "gift", "other");
  summary.classList.add(TYPES[event.event_type] ? event.event_type : "other");
  document.getElementById("eventDetailsTypeIcon").className = type.icon;
  setText("eventDetailsType", type.label);
  setText("eventDetailsTitle", event.title || "イベント名未登録");
  setText("eventDetailsDate", formatDate(event.event_date));
  setText("eventDetailsPerson", formatPersonName(event.personName));
  setText("eventDetailsRepeat", event.is_yearly ? "毎年" : "なし");
  setText("eventDetailsMemo", event.memo || "メモは登録されていません");
  document.getElementById("eventDetailsLoading").classList.add("hidden");
  document.getElementById("eventDetailsError").classList.add("hidden");
  document.getElementById("eventDetailsContent").classList.remove("hidden");
}


function detailUrl() {
  const url = `event_detail.html?event_id=${encodeURIComponent(eventId)}&refresh=${Date.now()}`;

  return buildUrlWithReturnTo(url, returnTo);
}

function setupMenu() {
  const toggle = document.getElementById("eventDetailsActionsToggle");
  const menu = document.getElementById("eventDetailsActionsMenu");
  function close() { menu.classList.add("hidden"); toggle.setAttribute("aria-expanded", "false"); }
  toggle.addEventListener("click", e => {
    e.stopPropagation();
    const open = menu.classList.contains("hidden");
    menu.classList.toggle("hidden", !open);
    toggle.setAttribute("aria-expanded", String(open));
  });
  document.addEventListener("click", e => { if (!e.target.closest(".event-details-actions")) close(); });
  document.getElementById("eventDetailsEditButton").addEventListener("click", () => {
  if (!currentEvent) return;

  window.location.href = buildUrlWithReturnTo(
    `event.html?event_id=${encodeURIComponent(eventId)}`,
    detailUrl()
  );
});

  document.getElementById("eventDetailsDeleteButton").addEventListener("click", async e => {
    if (!currentEvent) return;
    close();
    if (!window.confirm(`「${currentEvent.title || "このイベント"}」を削除しますか？\nこの操作は取り消せません。`)) return;
    const button = e.currentTarget;
    button.disabled = true;
    button.textContent = "削除中...";
    const { data, error } = await supabase.from("events").delete().eq("id", currentEvent.id).select("id").maybeSingle();
    if (error || !data) {
      console.error("イベント削除失敗:", error);
      window.alert("イベントを削除できませんでした。");
      button.disabled = false;
      button.innerHTML = '<i class="fa-regular fa-trash-can"></i><span>削除</span>';
      return;
    }
    window.alert("イベントを削除しました。");
    window.location.href = returnTo;
  });
}

async function initialize() {
  document.getElementById("eventDetailsBackButton").href = returnTo;
  document.getElementById("eventDetailsErrorBack").href = returnTo;
  setupMenu();
  if (!eventId) { showError("イベントが指定されていません。"); return; }
  await loadEvent();
}

document.addEventListener("DOMContentLoaded", initialize);
window.addEventListener("pageshow", async event => {
  if (event.persisted && eventId) await loadEvent();
});
