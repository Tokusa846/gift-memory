import { supabase } from "./supabase.js";


/* ========================================
   STATE
======================================== */

let currentPerson = null;

let giftLogs = [];


/* ========================================
   INITIALIZE
======================================== */

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    const personId =
      getPersonIdFromUrl();


    if (!personId) {

      showError();

      return;

    }


    await loadPerson(
      personId
    );


    if (!currentPerson) {

      showError();

      return;

    }


    await loadGiftLogs(
      personId
    );


    renderPersonDetail();

  }
);


/* ========================================
   GET PERSON ID
======================================== */

function getPersonIdFromUrl() {

  const params =
    new URLSearchParams(
      window.location.search
    );


  return params.get("id");

}


/* ========================================
   LOAD PERSON
======================================== */

async function loadPerson(
  personId
) {

  const { data, error } =
    await supabase
      .from("people")
      .select(`
        id,
        name,
        birthday,
        relationship,
        likes,
        dislikes,
        allergies,
        memo
      `)
      .eq(
        "id",
        personId
      )
      .single();


  if (error) {

    console.error(
      "人物情報の取得に失敗しました:",
      error
    );


    currentPerson = null;

    return;

  }


  currentPerson =
    data;

}


/* ========================================
   LOAD GIFTS
======================================== */

async function loadGiftLogs(
  personId
) {

  const { data, error } =
    await supabase
      .from("Gifts")
      .select(`
        id,
        person_id,
        direction,
        gift_date,
        occasion,
        item_name,
        price,
        memo
      `)
      .eq(
        "person_id",
        personId
      )
      .order(
        "gift_date",
        {
          ascending: false
        }
      );


  if (error) {

    console.error(
      "プレゼント履歴の取得に失敗しました:",
      error
    );


    giftLogs = [];

    return;

  }


  giftLogs =
    data ?? [];

}


/* ========================================
   RENDER
======================================== */

function renderPersonDetail() {

  /* =========================
     BASIC PROFILE
  ========================== */

  setText(
    "detailAvatar",
    getPersonInitial(
      currentPerson.name
    )
  );


  setText(
    "detailName",
    currentPerson.name
  );


  setText(
    "detailBirthday",
    currentPerson.birthday
      ? `誕生日 ${formatBirthday(
          currentPerson.birthday
        )}`
      : "誕生日 未登録"
  );


  setText(
    "detailRelationship",
    currentPerson.relationship ||
      "関係値 未登録"
  );


  /* =========================
     PERSONAL INFORMATION
  ========================== */

  setText(
    "detailLikes",
    currentPerson.likes ||
      "未登録"
  );


  setText(
    "detailDislikes",
    currentPerson.dislikes ||
      "未登録"
  );


  setText(
    "detailAllergies",
    currentPerson.allergies ||
      "未登録"
  );


  setText(
    "detailMemo",
    currentPerson.memo ||
      "メモはありません"
  );


  /* =========================
     GIFT COUNTS
  ========================== */

  const receivedCount =
    giftLogs.filter(
      gift =>
        gift.direction ===
        "received"
    ).length;


  const givenCount =
    giftLogs.filter(
      gift =>
        gift.direction ===
        "given"
    ).length;


  setText(
    "detailReceivedCount",
    receivedCount
  );


  setText(
    "detailGivenCount",
    givenCount
  );


  /* =========================
     GIFT LIST
  ========================== */

  renderGiftList();


  /* =========================
     DISPLAY
  ========================== */

  document
    .getElementById(
      "personDetailLoading"
    )
    .classList
    .add("hidden");


  document
    .getElementById(
      "personDetailContent"
    )
    .classList
    .remove("hidden");

}


/* ========================================
   GIFT LIST
======================================== */

function renderGiftList() {

  const container =
    document.getElementById(
      "detailGiftList"
    );


  if (
    giftLogs.length === 0
  ) {

    container.innerHTML = `

      <div class="person-detail-no-gifts">

        <i class="fa-regular fa-gift"></i>

        <p>
          まだプレゼント履歴はありません
        </p>

      </div>

    `;


    return;

  }


  container.innerHTML =
    giftLogs
      .map(gift =>
        createGiftItemHtml(
          gift
        )
      )
      .join("");

}


/* ========================================
   GIFT ITEM
======================================== */

function createGiftItemHtml(
  gift
) {

  const isReceived =
    gift.direction ===
    "received";


  const directionText =
    isReceived
      ? "もらった"
      : "あげた";


  const directionClass =
    isReceived
      ? "received"
      : "given";


  const occasionHtml =
    gift.occasion
      ? `
        <span class="person-detail-gift-occasion">
          ${escapeHtml(gift.occasion)}
        </span>
      `
      : "";


  return `

    <article class="person-detail-gift-item">

      <div
        class="
          person-detail-gift-icon
          ${directionClass}
        "
      >

        <i class="fa-solid fa-gift"></i>

      </div>


      <div class="person-detail-gift-content">

        <div class="person-detail-gift-heading">

          <span
            class="
              person-detail-gift-direction
              ${directionClass}
            "
          >
            ${directionText}
          </span>

          ${occasionHtml}

        </div>


        <p class="person-detail-gift-name">

          ${escapeHtml(
            gift.item_name ||
            "名称未登録"
          )}

        </p>


        <time class="person-detail-gift-date">

          ${formatGiftDate(
            gift.gift_date
          )}

        </time>

      </div>

    </article>

  `;

}


/* ========================================
   ERROR
======================================== */

function showError() {

  const loading =
    document.getElementById(
      "personDetailLoading"
    );


  const error =
    document.getElementById(
      "personDetailError"
    );


  if (loading) {

    loading.classList.add(
      "hidden"
    );

  }


  if (error) {

    error.classList.remove(
      "hidden"
    );

  }

}


/* ========================================
   SET TEXT
======================================== */

function setText(
  id,
  value
) {

  const element =
    document.getElementById(
      id
    );


  if (!element) {
    return;
  }


  element.textContent =
    value;

}


/* ========================================
   INITIAL
======================================== */

function getPersonInitial(
  name
) {

  if (!name) {
    return "?";
  }


  const trimmedName =
    name.trim();


  if (!trimmedName) {
    return "?";
  }


  return trimmedName.charAt(0);

}


/* ========================================
   BIRTHDAY
======================================== */

function formatBirthday(
  birthday
) {

  const date =
    parseDate(
      birthday
    );


  return (
    `${date.getMonth() + 1}月`
    +
    `${date.getDate()}日`
  );

}


/* ========================================
   GIFT DATE
======================================== */

function formatGiftDate(
  dateString
) {

  if (!dateString) {
    return "";
  }


  const date =
    parseDate(
      dateString
    );


  const year =
    date.getFullYear();


  const month =
    String(
      date.getMonth() + 1
    ).padStart(
      2,
      "0"
    );


  const day =
    String(
      date.getDate()
    ).padStart(
      2,
      "0"
    );


  return (
    `${year}.${month}.${day}`
  );

}


/* ========================================
   DATE
======================================== */

function parseDate(
  dateString
) {

  return new Date(
    `${dateString}T00:00:00`
  );

}


/* ========================================
   ESCAPE HTML
======================================== */

function escapeHtml(
  value
) {

  if (
    value === null ||
    value === undefined
  ) {

    return "";

  }


  return String(value)
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );

}