import { supabase } from "./supabase.js";


/* ========================================
   STATE
======================================== */

let people = [];

let giftLogs = [];


/* ========================================
   INITIALIZE
======================================== */

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    await loadPeople();

    await loadGiftLogs();

    renderPersonList();

    setupPersonSearch();

  }
);


/* ========================================
   LOAD PEOPLE
======================================== */

async function loadPeople() {

  const { data, error } =
    await supabase
      .from("people")
      .select("*")
      .order(
        "name",
        {
          ascending: true
        }
      );


  if (error) {

    console.error(
      "人物情報の取得に失敗しました:",
      error
    );


    people = [];

    return;

  }


  people =
    data ?? [];

}


/* ========================================
   LOAD GIFTS
======================================== */

async function loadGiftLogs() {

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
   PERSON LIST
======================================== */

function renderPersonList() {

  const container =
    document.getElementById(
      "personListContainer"
    );


  const count =
    document.getElementById(
      "personCount"
    );


  const searchInput =
    document.getElementById(
      "personSearchInput"
    );


  const searchQuery =
    searchInput
      ? searchInput
          .value
          .trim()
          .toLowerCase()
      : "";


  /* =========================
     FILTER
  ========================== */

  const filteredPeople =
    people.filter(person => {

      if (
        searchQuery === ""
      ) {

        return true;

      }


      const name =
        person.name ?? "";


      return name
        .toLowerCase()
        .includes(
          searchQuery
        );

    });


  /* =========================
     COUNT
  ========================== */

  count.textContent =
    `${filteredPeople.length}人`;


  /* =========================
     EMPTY
  ========================== */

  if (
    filteredPeople.length === 0
  ) {

    container.innerHTML = `

      <div class="person-list-empty">

        <i class="fa-regular fa-user"></i>

        <p>
          該当する人物はいません
        </p>

      </div>

    `;


    return;

  }


  /* =========================
     RENDER
  ========================== */

  container.innerHTML =
    filteredPeople
      .map(person =>
        createPersonCardHtml(
          person
        )
      )
      .join("");

}


/* ========================================
   PERSON CARD
======================================== */

function createPersonCardHtml(
  person
) {

  const personLogs =
    giftLogs.filter(log =>

      String(log.person_id) ===
      String(person.id)

    );


  /* =========================
     COUNT
  ========================== */

  const receivedCount =
    personLogs.filter(log =>

      log.direction === "received"

    ).length;


  const givenCount =
    personLogs.filter(log =>

      log.direction === "given"

    ).length;


  /* =========================
     LATEST GIFT
  ========================== */

  const latestGift =
    [...personLogs]
      .sort((a, b) => {

        return (
          parseDate(
            b.gift_date
          )
          -
          parseDate(
            a.gift_date
          )
        );

      })[0];


  /* =========================
     BASIC INFO
  ========================== */

  const initial =
    getPersonInitial(
      person.name
    );


  const birthdayText =
    formatPersonBirthday(
      person.birthday
    );


  /* =========================
     LATEST GIFT HTML
  ========================== */

  let latestGiftHtml = `

    <div class="person-no-gift">

      <i class="fa-regular fa-gift"></i>

      <span>
        まだプレゼント履歴はありません
      </span>

    </div>

  `;


  if (latestGift) {

    const directionText =
      latestGift.direction ===
      "received"
        ? "もらった"
        : "あげた";


    const directionClass =
      latestGift.direction ===
      "received"
        ? "received"
        : "given";


    latestGiftHtml = `

      <div class="person-latest-gift">

        <div
          class="
            person-latest-icon
            ${directionClass}
          "
        >

          <i class="fa-solid fa-gift"></i>

        </div>


        <div class="person-latest-content">

          <span class="person-latest-label">
            直近のプレゼント
          </span>


          <span class="person-latest-title">

            ${escapeHtml(
              latestGift.item_name
            )}

          </span>

        </div>


        <div class="person-latest-meta">

          <span>
            ${directionText}
          </span>

          <time>
            ${formatGiftDate(
              latestGift.gift_date
            )}
          </time>

        </div>

      </div>

    `;

  }


  /* =========================
     RETURN HTML
  ========================== */

  return `

    <article
      class="person-card"
      data-person-id="${person.id}"
    >

      <div class="person-card-main">


        <!-- AVATAR -->
        <div class="person-avatar">

          ${escapeHtml(
            initial
          )}

        </div>


        <!-- NAME / BIRTHDAY -->
        <div class="person-basic-info">

          <p class="person-name">

            ${escapeHtml(
              person.name
            )}

          </p>


          <p class="person-birthday">

            ${
              birthdayText
                ? `誕生日: ${birthdayText}`
                : "誕生日: 未登録"
            }

          </p>

        </div>


      </div>


      <!-- COUNTS -->
      <div class="person-gift-counts">

        <span
          class="
            person-count-badge
            received
          "
        >
          もらった ${receivedCount}
        </span>


        <span
          class="
            person-count-badge
            given
          "
        >
          あげた ${givenCount}
        </span>

      </div>


      <!-- LATEST GIFT -->
      ${latestGiftHtml}


    </article>

  `;

}


/* ========================================
   SEARCH
======================================== */

function setupPersonSearch() {

  const input =
    document.getElementById(
      "personSearchInput"
    );


  if (!input) {
    return;
  }


  input.addEventListener(
    "input",
    () => {

      renderPersonList();

    }
  );

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


  if (
    trimmedName.length === 0
  ) {

    return "?";

  }


  return trimmedName.charAt(0);

}


/* ========================================
   BIRTHDAY FORMAT
======================================== */

function formatPersonBirthday(
  birthday
) {

  if (!birthday) {
    return "";
  }


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
   GIFT DATE FORMAT
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
   SECURITY
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