/* Import */
import { supabase } from "../common/supabase.js";


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


    renderGiftHistory();

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


  return params.get(
    "person_id"
  );

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
        name_kana
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
        created_at,
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
      )
      .order(
        "created_at",
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

function renderGiftHistory() {

  renderPersonInfo();

  renderGiftCounts();

  renderGiftList();

  setupBackLink();

  setupAddGiftLink();


  const loading =
    document.getElementById(
      "giftHistoryLoading"
    );


  const content =
    document.getElementById(
      "giftHistoryContent"
    );


  loading?.classList.add(
    "hidden"
  );


  content?.classList.remove(
    "hidden"
  );

}


/* ========================================
   PERSON INFO
======================================== */

function renderPersonInfo() {

  setText(
    "giftHistoryAvatar",
    getPersonInitial(
      currentPerson.name
    )
  );


  setText(
    "giftHistoryName",
    currentPerson.name ||
      "名称未登録"
  );


  const nameKana =
    document.getElementById(
      "giftHistoryNameKana"
    );


  if (!nameKana) {
    return;
  }


  if (
    currentPerson.name_kana
  ) {

    nameKana.textContent =
      currentPerson.name_kana;


    nameKana.classList.remove(
      "hidden"
    );

  } else {

    nameKana.textContent =
      "";


    nameKana.classList.add(
      "hidden"
    );

  }

}


/* ========================================
   GIFT COUNTS
======================================== */

function renderGiftCounts() {

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
    "giftHistoryReceivedCount",
    receivedCount
  );


  setText(
    "giftHistoryGivenCount",
    givenCount
  );

}


/* ========================================
   GIFT LIST
======================================== */

function renderGiftList() {

  const container =
    document.getElementById(
      "giftHistoryList"
    );


  if (!container) {
    return;
  }


  if (
    giftLogs.length === 0
  ) {

    container.innerHTML = `

      <div class="gift-history-empty">

        <i class="fa-solid fa-gift"></i>

        <p>
          まだプレゼント履歴はありません
        </p>

      </div>

    `;

    return;

  }


  container.innerHTML =
    giftLogs
      .map(
        gift =>
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
        <span class="gift-history-occasion">
          ${escapeHtml(
            gift.occasion
          )}
        </span>
      `
      : "";


  const returnTo =
    `gift_history.html?person_id=${
      encodeURIComponent(
        currentPerson.id
      )
    }`;


  const detailUrl =
    `gift_detail.html?gift_id=${
      encodeURIComponent(
        gift.id
      )
    }&return_to=${
      encodeURIComponent(
        returnTo
      )
    }`;


  return `

    <a
      class="gift-history-item"
      href="${detailUrl}"
      aria-label="${escapeHtml(
        gift.item_name ||
        "プレゼント"
      )}の詳細を表示"
    >

      <div
        class="
          gift-history-icon
          ${directionClass}
        "
      >

        <i class="fa-solid fa-gift"></i>

      </div>


      <div class="gift-history-item-content">

        <div class="gift-history-item-heading">

          <span
            class="
              gift-history-direction
              ${directionClass}
            "
          >
            ${directionText}
          </span>

          ${occasionHtml}

        </div>


        <p class="gift-history-name">

          ${escapeHtml(
            gift.item_name ||
            "名称未登録"
          )}

        </p>


        <time class="gift-history-date">

          ${formatGiftDate(
            gift.gift_date
          )}

        </time>

      </div>


      <span
        class="gift-history-arrow"
        aria-hidden="true"
      >
        <i class="fa-solid fa-chevron-right"></i>
      </span>

    </a>

  `;

}


/* ========================================
   BACK LINK
======================================== */

function setupBackLink() {

  const backLink =
    document.getElementById(
      "giftHistoryBack"
    );


  if (
    !backLink ||
    !currentPerson
  ) {
    return;
  }


  backLink.href =
    `../people/people_detail.html?id=${
      encodeURIComponent(
        currentPerson.id
      )
    }`;

}

/* ========================================
   ADD GIFT LINK
======================================== */

function setupAddGiftLink() {

  const addButton =
    document.getElementById(
      "giftHistoryAddButton"
    );


  if (
    !addButton ||
    !currentPerson
  ) {
    return;
  }


  const returnTo =
    `gift_history.html?person_id=${
      encodeURIComponent(
        currentPerson.id
      )
    }`;


  addButton.href =
    `gifts.html?person_id=${
      encodeURIComponent(
        currentPerson.id
      )
    }&return_to=${
      encodeURIComponent(
        returnTo
      )
    }`;

}

/* ========================================
   ERROR
======================================== */

function showError() {

  const loading =
    document.getElementById(
      "giftHistoryLoading"
    );


  const content =
    document.getElementById(
      "giftHistoryContent"
    );


  const error =
    document.getElementById(
      "giftHistoryError"
    );


  loading?.classList.add(
    "hidden"
  );


  content?.classList.add(
    "hidden"
  );


  error?.classList.remove(
    "hidden"
  );

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


  return trimmedName.charAt(
    0
  );

}


/* ========================================
   DATE
======================================== */

function formatGiftDate(
  dateString
) {

  if (!dateString) {
    return "";
  }


  const date =
    new Date(
      `${dateString}T00:00:00`
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