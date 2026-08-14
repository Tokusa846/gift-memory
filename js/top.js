import { supabase } from "./supabase.js";


/* ========================================
   STATE
======================================== */

let giftLogs = [];

let currentFilter = "all";


/* ========================================
   INITIALIZE
======================================== */

document.addEventListener("DOMContentLoaded", async () => {

  renderCurrentDate();

  await loadPeople();

  await loadGiftLogs();

  renderWeekStrip();

  renderNews();

  setupReturnButtons();

  renderTimeline();

  setupNavigation();

  setupFilters();

  setupSearch();

  setupDateDetailModal();

  setupAddButton();

});


/* ========================================
   CURRENT DATE
======================================== */

function renderCurrentDate() {

  const today = new Date();

  const year = today.getFullYear();

  const month = String(
    today.getMonth() + 1
  ).padStart(2, "0");

  const date = String(
    today.getDate()
  ).padStart(2, "0");

  const header =
    document.getElementById("currentDateHeader");

  header.textContent =
    `${year}.${month}.${date}.`;
}


/* ========================================
   PEOPLE
======================================== */

let people = [];


async function loadPeople() {

  const { data, error } = await supabase
    .from("people")
    .select("*")
    .order("name", {
      ascending: true
    });


  if (error) {

    console.error(
      "人物情報の取得に失敗しました:",
      error
    );

    people = [];

    return;
  }


  people = data ?? [];

}


/* ========================================
   GIFT LOG
======================================== */

async function loadGiftLogs() {

  const { data, error } = await supabase
    .from("Gifts")
    .select(`
      id,
      person_id,
      direction,
      gift_date,
      occasion,
      item_name,
      price,
      memo,
      need_return,
      return_done,
      people (
        name
      )
    `)
    .order("gift_date", {
      ascending: false
    });


  if (error) {

    console.error(
      "プレゼント履歴の取得に失敗しました:",
      error
    );

    giftLogs = [];

    return;
  }


  giftLogs = data ?? [];

}


/* ========================================
   WEEK CALENDAR
======================================== */

function renderWeekStrip() {

  const container =
    document.getElementById("weeklyStrip");

  container.innerHTML = "";


  const today =
    startOfDay(new Date());


  const dayOfWeek =
    today.getDay();


  const sunday =
    new Date(today);


  sunday.setDate(
    today.getDate() - dayOfWeek
  );


  for (let i = 0; i < 7; i++) {

    const day =
      new Date(sunday);


    day.setDate(
      sunday.getDate() + i
    );


    const isToday =
      isSameDate(
        day,
        today
      );


    /*
      その日のイベントを取得

      現在は誕生日のみ。
      今後イベントを追加するときは
      getEventsForDate() を拡張する。
    */
    const events =
      getEventsForDate(day);


    const hasEvent =
      events.length > 0;


    const dayElement =
      document.createElement("div");


    dayElement.className =
      "calendar-day";


    /* =========================
       DATE
    ========================== */

    const dateButton =
      document.createElement("button");


    dateButton.type =
      "button";


    dateButton.className =
      "calendar-date-button";


    dateButton.textContent =
      day.getDate();


    if (isToday) {

      dateButton.classList.add(
        "today"
      );

    }


    if (hasEvent) {

      dateButton.classList.add(
        "has-event"
      );

    }


    const dateLabel =
      `${day.getFullYear()}年`
      + `${day.getMonth() + 1}月`
      + `${day.getDate()}日`;


    dateButton.setAttribute(
      "aria-label",
      hasEvent
        ? `${dateLabel}、イベントあり`
        : dateLabel
    );


    /*
      日付タップ
    */
    dateButton.addEventListener(
      "click",
      () => {

        openDateDetailModal(
          day
        );

      }
    );


    /* =========================
       EVENT ICONS
    ========================== */

    const eventArea =
      document.createElement("div");


    eventArea.className =
      "calendar-event-area";


    /*
      同じイベント種別をまとめる
    */
    const uniqueEventTypes =
      [
        ...new Set(
          events.map(
            event => event.type
          )
        )
      ];


    /*
      最大2種類
    */
    const visibleTypes =
      uniqueEventTypes.slice(
        0,
        2
      );


    visibleTypes.forEach(type => {

      const icon =
        createCalendarEventIcon(
          type
        );


      if (icon) {

        eventArea.appendChild(
          icon
        );

      }

    });


    /*
      3種類以上なら「…」
    */
    if (
      uniqueEventTypes.length > 2
    ) {

      const more =
        document.createElement(
          "span"
        );


      more.className =
        "calendar-event-more";


      more.textContent =
        "…";


      eventArea.appendChild(
        more
      );

    }


    /*
      イベントなし
    */
    if (
      uniqueEventTypes.length === 0
    ) {

      const spacer =
        document.createElement(
          "span"
        );


      spacer.className =
        "calendar-event-spacer";


      eventArea.appendChild(
        spacer
      );

    }


    /* =========================
       APPEND
    ========================== */

    /*
      曜日はHTML側にあるので、
      ここでは

      日付
      ↓
      イベント

      の順番
    */

    dayElement.appendChild(
      dateButton
    );


    dayElement.appendChild(
      eventArea
    );


    container.appendChild(
      dayElement
    );

  }

}

/* ========================================
   CALENDAR EVENTS
======================================== */

function getEventsForDate(date) {

  const events = [];


  /* =========================
     BIRTHDAY
  ========================== */

  const birthdayPeople =
    people.filter(person =>

      isBirthdayOnDate(
        person.birthday,
        date
      )

    );


  birthdayPeople.forEach(person => {

    events.push({

      type: "birthday",

      title:
        `${person.name}さんの誕生日`,

      personId:
        person.id,

      personName:
        person.name

    });

  });


  /*
    今後ここに追加できます。

    例：

    events.push({
      type: "gift",
      title: "プレゼント予定"
    });

    events.push({
      type: "anniversary",
      title: "記念日"
    });
  */


  return events;

}

function createCalendarEventIcon(
  type
) {

  const icon =
    document.createElement("i");


  icon.classList.add(
    "fa-solid",
    "calendar-event-icon"
  );


  switch (type) {

    case "birthday":

      icon.classList.add(
        "fa-cake-candles",
        "birthday"
      );

      icon.setAttribute(
        "aria-label",
        "誕生日"
      );

      break;


    case "gift":

      icon.classList.add(
        "fa-gift",
        "gift"
      );

      icon.setAttribute(
        "aria-label",
        "プレゼント"
      );

      break;


    case "anniversary":

      icon.classList.add(
        "fa-heart",
        "anniversary"
      );

      icon.setAttribute(
        "aria-label",
        "記念日"
      );

      break;


    default:

      return null;

  }


  return icon;

}

/* ========================================
   DATE DETAIL MODAL
======================================== */

function openDateDetailModal(
  date
) {

  const modal =
    document.getElementById(
      "dateDetailModal"
    );


  const title =
    document.getElementById(
      "dateDetailTitle"
    );


  const content =
    document.getElementById(
      "dateDetailContent"
    );


  const events =
    getEventsForDate(date);


  /* =========================
     TITLE
  ========================== */

  title.textContent =
    `${date.getFullYear()}年`
    + `${date.getMonth() + 1}月`
    + `${date.getDate()}日`;


  /* =========================
     EVENTなし
  ========================== */

  if (
    events.length === 0
  ) {

    content.innerHTML = `

      <div class="date-detail-empty">

        <i class="fa-regular fa-calendar"></i>

        <span>
          表示するイベントがありません
        </span>

      </div>

    `;

  }


  /* =========================
     EVENTあり
  ========================== */

  else {

    content.innerHTML =
      events
        .map(event =>
          createDateDetailEventHtml(
            event
          )
        )
        .join("");

  }


  /*
    追加ボタンで使用するため
    日付を保持
  */

  modal.dataset.date =
    formatDateForInput(date);


  modal.classList.remove(
    "hidden"
  );


  modal.setAttribute(
    "aria-hidden",
    "false"
  );


  /*
    背景スクロール防止
  */

  document.body.style.overflow =
    "hidden";

}

function createDateDetailEventHtml(
  event
) {

  /* =========================
     BIRTHDAY
  ========================== */

  if (
    event.type === "birthday"
  ) {

    return `

      <article class="date-detail-event">

        <div class="date-detail-event-icon">

          <i
            class="
              fa-solid
              fa-cake-candles
            "
          ></i>

        </div>


        <div class="date-detail-event-body">

          <span class="date-detail-event-label">
            イベントあり
          </span>


          <p class="date-detail-event-title">

            ${escapeHtml(
              event.personName
            )}さんの誕生日

          </p>


          <p class="date-detail-event-description">
            誕生日のプレゼントを確認してみましょう。
          </p>

        </div>

      </article>

    `;

  }


  return "";

}

function closeDateDetailModal() {

  const modal =
    document.getElementById(
      "dateDetailModal"
    );


  modal.classList.add(
    "hidden"
  );


  modal.setAttribute(
    "aria-hidden",
    "true"
  );


  document.body.style.overflow =
    "";

}

function setupDateDetailModal() {

  const modal =
    document.getElementById(
      "dateDetailModal"
    );


  const closeButton =
    document.getElementById(
      "dateDetailClose"
    );


  const addButton =
    document.getElementById(
      "dateDetailAddButton"
    );


  /* 閉じる */

  closeButton.addEventListener(
    "click",
    () => {

      closeDateDetailModal();

    }
  );


  /* 背景タップ */

  modal.addEventListener(
    "click",
    event => {

      if (
        event.target === modal
      ) {

        closeDateDetailModal();

      }

    }
  );


  /* Esc */

  document.addEventListener(
    "keydown",
    event => {

      if (
        event.key === "Escape" &&
        !modal.classList.contains(
          "hidden"
        )
      ) {

        closeDateDetailModal();

      }

    }
  );


  /* =========================
     ADD
  ========================== */

  addButton.addEventListener(
    "click",
    () => {

      const selectedDate =
        modal.dataset.date;


      /*
        現時点では
        プレゼント登録画面へ遷移。

        URLに日付を渡しておくので、
        後から gifts.html 側で
        初期日付として使用できます。
      */

      window.location.href =
        `gifts.html?date=${selectedDate}`;

    }
  );

}


/* ========================================
   NEWS
======================================== */

function renderNews() {

  const container =
    document.getElementById("newsContainer");

  const badge =
    document.getElementById("newsCountBadge");

  const newsItems = [];

  const today =
    startOfDay(
      new Date()
    );


  /* =========================
     誕生日リマインダー
  ========================== */

  people.forEach(person => {

    if (!person.birthday) {
      return;
    }

    const nextBirthday =
      getNextBirthday(
        person.birthday,
        today
      );

    const diffDays =
      getDifferenceInDays(
        today,
        nextBirthday
      );

    if (
      diffDays >= 0 &&
      diffDays <= 30
    ) {

      newsItems.push({
        type: "birthday",
        days: diffDays,
        person: person.name,
        birthday: nextBirthday
      });

    }

  });


  /* =========================
     お返しリマインダー
  ========================== */

  giftLogs.forEach(log => {

    if (
      log.direction !== "received"
    ) {
      return;
    }

    if (
      log.need_return !== true
    ) {
      return;
    }

    if (
      log.return_done === true
    ) {
      return;
    }

    newsItems.push({
      type: "return",
      giftId: log.id,
      person: log.people?.name ?? "人物不明",
      occasion: log.occasion ?? "",
      itemName: log.item_name ?? "",
      giftDate: log.gift_date
    });

  });


  /* =========================
     並び順
  ========================== */

  newsItems.sort((a, b) => {

    if (
      a.type === "birthday" &&
      b.type !== "birthday"
    ) {
      return -1;
    }

    if (
      a.type !== "birthday" &&
      b.type === "birthday"
    ) {
      return 1;
    }

    if (
      a.type === "birthday" &&
      b.type === "birthday"
    ) {
      return a.days - b.days;
    }

    return 0;

  });


  /* =========================
     件数
  ========================== */

  badge.textContent =
    newsItems.length;


  /* =========================
     0件
  ========================== */

  if (
    newsItems.length === 0
  ) {

    container.innerHTML = `
      <div class="empty-message">
        現在お知らせはありません
      </div>
    `;

    return;
  }


  /* =========================
     表示
  ========================== */

  container.innerHTML =
    newsItems
      .map(item =>
        createNewsHtml(item)
      )
      .join("");

}


/* ========================================
   NEWS HTML
======================================== */

function createNewsHtml(item) {

  /* =========================
     誕生日
  ========================== */

  if (
    item.type === "birthday"
  ) {

    const month =
      item.birthday.getMonth() + 1;

    const date =
      item.birthday.getDate();


    const message =
      item.days === 0
        ? "今日が誕生日です！"
        : `あと${item.days}日です。`;


    return `
      <div class="news-item">

        <div class="news-icon">
          <i class="fa-solid fa-cake-candles"></i>
        </div>

        <div class="news-content">

          <strong>
            ${month}/${date} は
            ${escapeHtml(item.person)}さんの誕生日
          </strong>

          <p>
            ${message}
            プレゼントの準備はお済みですか？
          </p>

        </div>

      </div>
    `;

  }


  /* =========================
     お返し
  ========================== */

  if (
    item.type === "return"
  ) {

    const occasionText =
      item.occasion
        ? `${escapeHtml(item.occasion)}として`
        : "";


    return `
      <div class="news-item news-item-return">

        <div class="news-icon news-icon-return">
          <i class="fa-solid fa-gift"></i>
        </div>

        <div class="news-content">

          <strong>
            ${escapeHtml(item.person)}さんから
            ${occasionText}
            プレゼントをもらいました
          </strong>

          <p>
            ${escapeHtml(item.itemName)}
          </p>

          <p class="return-reminder-text">
            お返しは済みましたか？
          </p>

          <button
            type="button"
            class="return-done-button"
            data-gift-id="${item.giftId}"
          >
            <i class="fa-solid fa-check"></i>
            お返し済みにする
          </button>

        </div>

      </div>
    `;

  }


  return "";

}


/* ========================================
   TIMELINE
======================================== */

function renderTimeline() {

  const container =
    document.getElementById(
      "timelineContainer"
    );

  const count =
    document.getElementById(
      "logCount"
    );

  const searchQuery =
    document
      .getElementById(
        "searchInput"
      )
      .value
      .trim()
      .toLowerCase();


  let filtered =
    giftLogs.filter(log => {

      if (
        currentFilter === "received"
      ) {

        return (
          log.direction ===
          "received"
        );

      }


      if (
        currentFilter === "given"
      ) {

        return (
          log.direction ===
          "given"
        );

      }


      return true;

    });


  if (
    searchQuery !== ""
  ) {

    filtered =
      filtered.filter(log => {

        const personName =
          log.people?.name ?? "";

        const itemName =
          log.item_name ?? "";

        const occasion =
          log.occasion ?? "";


        return (

          personName
            .toLowerCase()
            .includes(searchQuery)

          ||

          itemName
            .toLowerCase()
            .includes(searchQuery)

          ||

          occasion
            .toLowerCase()
            .includes(searchQuery)

        );

      });

  }


  count.textContent =
    `全 ${filtered.length} 件`;


  if (
    filtered.length === 0
  ) {

    container.innerHTML = `
      <div class="empty-message">
        <i class="fa-solid fa-box-open"></i>
        <br><br>
        プレゼント履歴はありません
      </div>
    `;

    return;

  }


  container.innerHTML =
    filtered
      .map(log =>
        createGiftLogHtml(log)
      )
      .join("");

}


/* ========================================
   GIFT LOG HTML
======================================== */

function createGiftLogHtml(log) {

  const isReceived =
    log.direction ===
    "received";


  const directionClass =
    isReceived
      ? "received"
      : "given";


  const directionText =
    isReceived
      ? "もらった"
      : "あげた";


  const icon =
    isReceived
      ? "fa-arrow-down-left"
      : "fa-arrow-up-right";


  const personName =
    log.people?.name ??
    "人物不明";


  const formattedDate =
    formatDate(
      log.gift_date
    );


  const price =
    log.price
      ? `${Number(log.price).toLocaleString()}円`
      : "";


  const occasion =
    log.occasion
      ? `#${escapeHtml(log.occasion)}`
      : "#その他";


  const memoHtml =
    log.memo
      ? `
        <p class="gift-memo">
          ${escapeHtml(log.memo)}
        </p>
      `
      : "";


  return `
    <article class="timeline-item">

      <span
        class="timeline-dot ${directionClass}"
      ></span>

      <div class="gift-card">

        <div class="gift-card-top">

          <div class="gift-person-area">

            <span
              class="
                direction-badge
                ${directionClass}
              "
            >

              <i
                class="
                  fa-solid
                  ${icon}
                "
              ></i>

              ${directionText}

            </span>

            <span class="gift-person">
              ${escapeHtml(personName)}
            </span>

          </div>


          <span class="gift-date">
            ${formattedDate}
          </span>

        </div>


        <div class="gift-item-row">

          <span class="gift-item-name">
            ${escapeHtml(log.item_name)}
          </span>

          ${
            price
              ? `
                <span class="gift-price">
                  ${price}
                </span>
              `
              : ""
          }

        </div>


        <div class="gift-card-bottom">

          <span class="occasion-tag">
            ${occasion}
          </span>

        </div>


        ${memoHtml}

      </div>

    </article>
  `;

}


/* ========================================
   FILTER
======================================== */

function setupFilters() {

  const buttons =
    document.querySelectorAll(
      ".filter-button"
    );


  buttons.forEach(button => {

    button.addEventListener(
      "click",
      () => {

        currentFilter =
          button.dataset.filter;


        buttons.forEach(btn => {
          btn.classList.remove(
            "active"
          );
        });


        button.classList.add(
          "active"
        );


        renderTimeline();

      }
    );

  });

}


/* ========================================
   SEARCH
======================================== */

function setupSearch() {

  const input =
    document.getElementById(
      "searchInput"
    );


  input.addEventListener(
    "input",
    () => {

      renderTimeline();

    }
  );

}


/* ========================================
   NAVIGATION
======================================== */

function setupNavigation() {

  const buttons =
    document.querySelectorAll(
      ".nav-button"
    );


  buttons.forEach(button => {

    button.addEventListener(
      "click",
      () => {

        switchTab(
          button.dataset.tab
        );

      }
    );

  });

}


/* ========================================
   SWITCH TAB
======================================== */

function switchTab(tabName) {

  const tabs = [
    "home",
    "person",
    "schedule",
    "ai",
    "setting"
  ];


  tabs.forEach(tab => {

    const section =
      document.getElementById(
        `tab-${tab}`
      );

    const nav =
      document.getElementById(
        `nav-${tab}`
      );


    section.classList.add(
      "hidden"
    );


    nav.classList.remove(
      "active-tab"
    );

  });


  const targetSection =
    document.getElementById(
      `tab-${tabName}`
    );


  const targetNav =
    document.getElementById(
      `nav-${tabName}`
    );


  targetSection.classList.remove(
    "hidden"
  );


  targetNav.classList.add(
    "active-tab"
  );


  closeAddMenu();

}


/* 動作確認などで
   consoleから呼び出せるようにする */
window.switchTab =
  switchTab;


/* ========================================
   ADD BUTTON
======================================== */

function setupAddButton() {

  const addButton =
    document.getElementById(
      "addButton"
    );


  const addMenu =
    document.getElementById(
      "addMenu"
    );


  addButton.addEventListener(
    "click",
    event => {

      event.stopPropagation();


      const isHidden =
        addMenu.classList.contains(
          "hidden"
        );


      if (isHidden) {

        addMenu.classList.remove(
          "hidden"
        );

        addButton.classList.add(
          "open"
        );

      } else {

        closeAddMenu();

      }

    }
  );


  addMenu.addEventListener(
    "click",
    event => {

      event.stopPropagation();

    }
  );


  document.addEventListener(
    "click",
    () => {

      closeAddMenu();

    }
  );

}


/* ========================================
   CLOSE ADD MENU
======================================== */

function closeAddMenu() {

  const addMenu =
    document.getElementById(
      "addMenu"
    );


  const addButton =
    document.getElementById(
      "addButton"
    );


  if (
    !addMenu ||
    !addButton
  ) {
    return;
  }


  addMenu.classList.add(
    "hidden"
  );


  addButton.classList.remove(
    "open"
  );

}


/* ========================================
   DATE UTILS
======================================== */

function isSameDate(
  date1,
  date2
) {

  return (

    date1.getFullYear() ===
      date2.getFullYear()

    &&

    date1.getMonth() ===
      date2.getMonth()

    &&

    date1.getDate() ===
      date2.getDate()

  );

}


function isGiftOnDate(
  dateString,
  targetDate
) {

  if (!dateString) {
    return false;
  }


  const giftDate =
    new Date(
      `${dateString}T00:00:00`
    );


  return isSameDate(
    giftDate,
    targetDate
  );

}


function isBirthdayOnDate(
  birthday,
  targetDate
) {

  if (!birthday) {
    return false;
  }


  const birthDate =
    new Date(
      `${birthday}T00:00:00`
    );


  return (

    birthDate.getMonth() ===
      targetDate.getMonth()

    &&

    birthDate.getDate() ===
      targetDate.getDate()

  );

}


function getNextBirthday(
  birthday,
  today
) {

  const birthDate =
    new Date(
      `${birthday}T00:00:00`
    );


  let birthdayThisYear =
    new Date(
      today.getFullYear(),
      birthDate.getMonth(),
      birthDate.getDate()
    );


  if (
    birthdayThisYear < today
  ) {

    birthdayThisYear =
      new Date(
        today.getFullYear() + 1,
        birthDate.getMonth(),
        birthDate.getDate()
      );

  }


  return birthdayThisYear;

}


function getDifferenceInDays(
  startDate,
  endDate
) {

  const milliseconds =
    endDate.getTime() -
    startDate.getTime();


  return Math.round(
    milliseconds /
    (
      1000 *
      60 *
      60 *
      24
    )
  );

}


function startOfDay(date) {

  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );

}


function formatDate(dateString) {

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


  return `${year}.${month}.${day}`;

}

function setupReturnButtons() {

  const buttons =
    document.querySelectorAll(
      ".return-done-button"
    );


  buttons.forEach(button => {

    button.addEventListener(
      "click",
      async () => {

        const giftId =
          button.dataset.giftId;


        button.disabled =
          true;

        button.innerHTML = `
          <i class="fa-solid fa-spinner fa-spin"></i>
          更新中...
        `;


        const { error } =
          await supabase
            .from("Gifts")
            .update({
              return_done: true
            })
            .eq(
              "id",
              giftId
            );


        if (error) {

          console.error(
            "お返し状態の更新に失敗しました:",
            error
          );

          button.disabled =
            false;

          button.innerHTML = `
            <i class="fa-solid fa-check"></i>
            お返し済みにする
          `;

          return;
        }


        await loadGiftLogs();

        renderNews();

        setupReturnButtons();

        renderTimeline();

      }
    );

  });

}

function formatDateForInput(
  date
) {

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
    `${year}-${month}-${day}`
  );

}


/* ========================================
   SECURITY
======================================== */

function escapeHtml(value) {

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