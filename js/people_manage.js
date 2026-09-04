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
  
  renderPersonIndex();

  /* =========================
     EMPTY
  ========================== */

  if (
    filteredPeople.length === 0
  ) {

    container.innerHTML = `

      <div class="person-list-empty">

        <i class="fa-solid fa-user"></i>

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

  const sections =
    createPersonSections(
      filteredPeople
    );


  container.innerHTML =
    sections
      .map(section =>
        createPersonSectionHtml(
          section
        )
      )
      .join("");


  setupPersonCardLinks();

}

/* ========================================
   PERSON SECTIONS
======================================== */

function createPersonSections(
  personList
) {

  const kanaOrder = [
    "あ",
    "か",
    "さ",
    "た",
    "な",
    "は",
    "ま",
    "や",
    "ら",
    "わ",
    "他"
  ];


  const kanaGroups =
    new Map();


  const alphabetGroups =
    new Map();


  const noKanaPeople = [];


  personList.forEach(person => {

    const name =
      (person.name ?? "")
        .trim();


    const nameKana =
      (person.name_kana ?? "")
        .trim();


    if (!name) {
      return;
    }


    /* =========================
       ENGLISH NAME
    ========================== */

    const firstCharacter =
      name.charAt(0);


    if (
      /^[A-Za-z]$/.test(
        firstCharacter
      )
    ) {

      const alphabetIndex =
        firstCharacter
          .toUpperCase();


      if (
        !alphabetGroups.has(
          alphabetIndex
        )
      ) {

        alphabetGroups.set(
          alphabetIndex,
          []
        );

      }


      alphabetGroups
        .get(alphabetIndex)
        .push(person);


      return;

    }


    /* =========================
       JAPANESE NAME
    ========================== */

    if (nameKana) {

      const kanaIndex =
        getKanaIndex(
          nameKana
        );


      if (
        !kanaGroups.has(
          kanaIndex
        )
      ) {

        kanaGroups.set(
          kanaIndex,
          []
        );

      }


      kanaGroups
        .get(kanaIndex)
        .push(person);


      return;

    }


    /* =========================
       NO FURIGANA
    ========================== */

    noKanaPeople.push(
      person
    );

  });


  /* =========================
     SORT KANA
  ========================== */

  kanaGroups.forEach(
    groupPeople => {

      groupPeople.sort(
        (a, b) => {

          return (
            (a.name_kana ?? "")
              .localeCompare(
                b.name_kana ?? "",
                "ja"
              )
          );

        }
      );

    }
  );


  /* =========================
     SORT ALPHABET
  ========================== */

  alphabetGroups.forEach(
    groupPeople => {

      groupPeople.sort(
        (a, b) => {

          return (
            (a.name ?? "")
              .localeCompare(
                b.name ?? "",
                "en",
                {
                  sensitivity: "base"
                }
              )
          );

        }
      );

    }
  );


  /* =========================
     SORT NO KANA
  ========================== */

  noKanaPeople.sort(
    (a, b) => {

      return (
        (a.name ?? "")
          .localeCompare(
            b.name ?? "",
            "ja"
          )
      );

    }
  );


  /* =========================
     CREATE SECTIONS
  ========================== */

  const sections = [];


  kanaOrder.forEach(index => {

    const groupPeople =
      kanaGroups.get(
        index
      );


    if (
      !groupPeople ||
      groupPeople.length === 0
    ) {

      return;

    }


    sections.push({

      type:
        "kana",

      label:
        index,

      id:
        `person-section-kana-${index}`,

      people:
        groupPeople

    });

  });


  const alphabet =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
      .split("");


  alphabet.forEach(index => {

    const groupPeople =
      alphabetGroups.get(
        index
      );


    if (
      !groupPeople ||
      groupPeople.length === 0
    ) {

      return;

    }


    sections.push({

      type:
        "alphabet",

      label:
        index,

      id:
        `person-section-alphabet-${index}`,

      people:
        groupPeople

    });

  });


  if (
    noKanaPeople.length > 0
  ) {

    sections.push({

      type:
        "no-kana",

      label:
        "ふりがな未登録",

      id:
        "person-section-no-kana",

      people:
        noKanaPeople

    });

  }


  return sections;

}

function createPersonSectionHtml(
  section
) {

  const cardsHtml =
    section.people
      .map(person =>
        createPersonCardHtml(
          person
        )
      )
      .join("");


  return `

    <section
      class="
        person-list-section
        person-list-section-${section.type}
      "
      id="${section.id}"
    >

      <div class="person-list-index-heading">

        <span>
          ${escapeHtml(
            section.label
          )}
        </span>

      </div>


      <div class="person-list-section-cards">

        ${cardsHtml}

      </div>

    </section>

  `;

}

/* ========================================
   PERSON INDEX
======================================== */

function renderPersonIndex() {

  const indexContainer =
    document.getElementById(
      "personIndex"
    );


  if (!indexContainer) {
    return;
  }


  const alphabetIndexes =
    getRegisteredAlphabetIndexes();


  const kanaIndexes =
    getRegisteredKanaIndexes();


  const hasAlphabet =
    alphabetIndexes.size > 0;


  const hasKana =
    kanaIndexes.size > 0;
  
  const isSingleIndex =
    (hasAlphabet && !hasKana) ||
    (!hasAlphabet && hasKana);


  /* =========================
     NO INDEX
  ========================== */

  if (
    !hasAlphabet &&
    !hasKana
  ) {

    indexContainer.innerHTML = "";

    indexContainer.classList.add(
      "hidden"
    );

    return;

  }


    let html = "";


  /* =========================
     KANA
  ========================== */

  if (hasKana) {

    const kanaRows = [
      "あ",
      "か",
      "さ",
      "た",
      "な",
      "は",
      "ま",
      "や",
      "ら",
      "わ",
      "他"
    ];


    html += `
      <div class="
        person-index-group
        kana-index
      ">
    `;


    kanaRows.forEach(row => {

      const isActive =
        kanaIndexes.has(
          row
        );


      html += `
        <span
          class="
            person-index-item
            ${isActive ? "active" : ""}
          "
          ${
            isActive
              ? `
                data-target-id="person-section-kana-${row}"
                role="button"
                tabindex="0"
              `
              : ""
          }
        >
          ${isActive ? row : "・"}
        </span>
      `;

    });


    html += `
      </div>
    `;

  }


  /* =========================
     ALPHABET
  ========================== */

  if (hasAlphabet) {

    const alphabet =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
        .split("");


    html += `
      <div class="
        person-index-group
        alphabet-index
      ">
    `;


    alphabet.forEach(letter => {

      const isActive =
        alphabetIndexes.has(
          letter
        );


      html += `
        <span
          class="
            person-index-item
            ${isActive ? "active" : ""}
          "
          ${
            isActive
              ? `
                data-target-id="person-section-alphabet-${letter}"
                role="button"
                tabindex="0"
              `
              : ""
          }
        >
          ${isActive ? letter : "・"}
        </span>
      `;

    });


    html += `
      </div>
    `;

  }


  indexContainer.innerHTML =
    html;


  indexContainer.classList.remove(
    "hidden"
  );

  indexContainer.classList.toggle(
   "single-index",
    isSingleIndex
  );

  setupPersonIndexLinks();

}

/* ========================================
   PERSON INDEX LINK
======================================== */

function setupPersonIndexLinks() {

  const activeIndexes =
    document.querySelectorAll(
      ".person-index-item.active[data-target-id]"
    );


  activeIndexes.forEach(indexItem => {

    const jumpToSection = () => {

      const targetId =
        indexItem.dataset.targetId;


      if (!targetId) {
        return;
      }


      const target =
        document.getElementById(
          targetId
        );


      if (!target) {
        return;
      }


      target.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });

    };


    indexItem.addEventListener(
      "click",
      jumpToSection
    );


    indexItem.addEventListener(
      "keydown",
      event => {

        if (
          event.key === "Enter" ||
          event.key === " "
        ) {

          event.preventDefault();

          jumpToSection();

        }

      }
    );

  });

}

/* ========================================
   ALPHABET INDEX
======================================== */

function getRegisteredAlphabetIndexes() {

  const indexes =
    new Set();


  people.forEach(person => {

    const name =
      (person.name ?? "")
        .trim();


    if (!name) {
      return;
    }


    const firstCharacter =
      name.charAt(0);


    if (
      /^[A-Za-z]$/.test(
        firstCharacter
      )
    ) {

      indexes.add(
        firstCharacter.toUpperCase()
      );

    }

  });


  return indexes;

}

/* ========================================
   KANA INDEX
======================================== */

function getRegisteredKanaIndexes() {

  const indexes =
    new Set();


  people.forEach(person => {

    const nameKana =
      (person.name_kana ?? "")
        .trim();


    if (!nameKana) {

      return;

    }


    const index =
      getKanaIndex(
        nameKana
      );


    if (index) {

      indexes.add(
        index
      );

    }

  });


  return indexes;

}

function getKanaIndex(
  nameKana
) {

  if (!nameKana) {
    return null;
  }


  let firstCharacter =
    nameKana
      .trim()
      .charAt(0);


  if (!firstCharacter) {
    return null;
  }


  /* カタカナ → ひらがな */
  const code =
    firstCharacter.charCodeAt(0);


  if (
    code >= 0x30A1 &&
    code <= 0x30F6
  ) {

    firstCharacter =
      String.fromCharCode(
        code - 0x60
      );

  }


  const kanaGroups = {

    "あ":
      "あいうえおぁぃぅぇぉ",

    "か":
      "かきくけこがぎぐげご",

    "さ":
      "さしすせそざじずぜぞ",

    "た":
      "たちつてとだぢづでどっ",

    "な":
      "なにぬねの",

    "は":
      "はひふへほばびぶべぼぱぴぷぺぽ",

    "ま":
      "まみむめも",

    "や":
      "やゆよゃゅょ",

    "ら":
      "らりるれろ",

    "わ":
      "わをんゎ"

  };


  for (
    const [index, characters]
    of Object.entries(
      kanaGroups
    )
  ) {

    if (
      characters.includes(
        firstCharacter
      )
    ) {

      return index;

    }

  }


  return "他";

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
     RETURN HTML
  ========================== */

  return `

    <article
        class="person-card person-card-link"
        data-person-id="${person.id}"
        tabindex="0"
        role="link"
    >

        <div class="person-card-main">
            <div class="person-avatar">
                ${escapeHtml(initial)}
            </div>
    
            <div class="person-basic-info">
    
                <p class="person-name">
                    ${escapeHtml(person.name)}
                </p>

                <p class="person-birthday">
                    ${
                        birthdayText
                        ? `誕生日: ${birthdayText}`
                        : "誕生日: 未登録"
                    }
                </p>
            </div>


            <div class="person-gift-counts">
            
                <span class="person-count-badge received">
                    もらった ${receivedCount}
                </span>
                
                <span class="person-count-badge given">
                    あげた ${givenCount}
                </span>
            </div>
        </div>

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

/* ========================================
   PERSON CARD LINK
======================================== */

function setupPersonCardLinks() {

  const cards =
    document.querySelectorAll(
      ".person-card-link"
    );


  cards.forEach(card => {

    const openDetail = () => {

      const personId =
        card.dataset.personId;


      window.location.href =
        `people_detail.html?id=${encodeURIComponent(personId)}`;

    };


    card.addEventListener(
      "click",
      openDetail
    );


    card.addEventListener(
      "keydown",
      event => {

        if (
          event.key === "Enter" ||
          event.key === " "
        ) {

          event.preventDefault();

          openDetail();

        }

      }
    );

  });

}
