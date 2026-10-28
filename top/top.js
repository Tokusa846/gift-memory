import { renderDateDetailCards } from "../common/modal.js";

import {
  buildUrlWithReturnTo
} from "../common/navigation.js";

import { supabase } from "../common/supabase.js";

/* ========================================
   DETAIL NAVIGATION
======================================== */

function createTopDetailUrl(destinationUrl) {

  return buildUrlWithReturnTo(
    destinationUrl,
    "../index.html"
  );

}

/* ========================================
   DATE HELPERS
======================================== */

function getStartOfWeek(
  date
) {

  const targetDate =
    startOfDay(
      new Date(date)
    );


  targetDate.setDate(
    targetDate.getDate()
    -
    targetDate.getDay()
  );


  return targetDate;

}


/* ========================================
   STATE
======================================== */

let giftLogs = [];

let calendarEvents = [];

let currentFilter = "all";

let displayedWeekStart =
  getStartOfWeek(
    new Date()
  );

let selectedCalendarDate = null;


/* ========================================
   INITIALIZE
======================================== */

document.addEventListener("DOMContentLoaded", async () => {

  renderCurrentDate();

  setupNavigation();

  applyInitialTab();
  
  setupWeekNavigation();
  setupWeekDateSelectModal();

  await loadPeople();

  await loadGiftLogs();

  await loadCalendarEvents();

  renderWeekStrip();

  renderNews();

  setupReturnButtons();

  renderTimeline();

  setupFilters();

  setupSearch();

  setupDateDetailModal();

  setupEventActions();

  setupAddButton();

});


/* ========================================
   CURRENT DATE
======================================== */

function renderCurrentDate() {
  const header =
    document.getElementById("currentDateHeader");

  if (!header) return;

  const date =
    selectedCalendarDate ?? new Date();

  header.innerHTML = `
    ${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日
    <i class="fa-solid fa-chevron-down"></i>
  `;
}


/* ========================================
   WEEK NAVIGATION
======================================== */

function setupWeekNavigation() {
  const previousButton =
    document.getElementById("previousWeekButton");

  const nextButton =
    document.getElementById("nextWeekButton");

  const todayButton =
    document.getElementById("todayWeekButton");

  const dateButton =
    document.getElementById("currentDateHeader");

  previousButton?.addEventListener("click", () => {
    displayedWeekStart =
      addDays(displayedWeekStart, -7);

    selectedCalendarDate = null;
    renderWeekStrip();
    renderCurrentDate();
  });

  nextButton?.addEventListener("click", () => {
    displayedWeekStart =
      addDays(displayedWeekStart, 7);

    selectedCalendarDate = null;
    renderWeekStrip();
    renderCurrentDate();
  });

  todayButton?.addEventListener("click", () => {
    displayedWeekStart =
      getStartOfWeek(new Date());

    selectedCalendarDate = null;
    renderWeekStrip();
    renderCurrentDate();
  });

  dateButton?.addEventListener(
    "click",
    openWeekDateSelectModal
  );
}

function addDays(
  date,
  numberOfDays
) {

  const result =
    new Date(date);


  result.setDate(
    result.getDate()
    +
    numberOfDays
  );


  return startOfDay(
    result
  );

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
   CALENDAR EVENT DATA
======================================== */

async function loadCalendarEvents() {

  const { data, error } = await supabase
    .from("events")
    .select(`
      id,
      event_type,
      title,
      event_date,
      person_id,
      related_person_name,
      is_yearly,
      memo,
      people (
        name
      )
    `)
    .order("event_date", {
      ascending: true
    });


  if (error) {

    console.error(
      "イベント情報の取得に失敗しました:",
      error
    );

    calendarEvents = [];

    return;
  }


  calendarEvents = data ?? [];

}

/* ========================================
   DISPLAYED WEEK MONTH
======================================== */

function updateDisplayedWeekMonth(
  weekStart
) {

  const label =
    document.getElementById(
      "displayedWeekMonth"
    );


  if (!label) {
    return;
  }


  const weekEnd =
    new Date(
      weekStart
    );


  weekEnd.setDate(
    weekStart.getDate() + 6
  );


  const startYear =
    weekStart.getFullYear();


  const startMonth =
    weekStart.getMonth() + 1;


  const endYear =
    weekEnd.getFullYear();


  const endMonth =
    weekEnd.getMonth() + 1;


  /*
    同じ月
    例：2026年8月
  */
  if (
    startYear === endYear &&
    startMonth === endMonth
  ) {

    label.textContent =
      `${startYear}年${startMonth}月`;


    return;

  }


  /*
    同じ年で月をまたぐ
    例：2026年8月–9月
  */
  if (
    startYear === endYear
  ) {

    label.textContent =
      `${startYear}年${startMonth}月–${endMonth}月`;


    return;

  }


  /*
    年をまたぐ
    例：2026年12月–2027年1月
  */
  label.textContent =
    `${startYear}年${startMonth}月`
    +
    `–${endYear}年${endMonth}月`;

}


/* ========================================
   WEEK CALENDAR
======================================== */

function renderWeekStrip() {

  const container =
    document.getElementById(
      "weeklyStrip"
    );


  if (!container) {
    return;
  }


  container.innerHTML = "";


  const today =
    startOfDay(
      new Date()
    );


  const sunday =
    new Date(
      displayedWeekStart
    );

    updateDisplayedWeekMonth(
      sunday
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


    const gifts = getGiftsForDate(day);
    const hasEvent = events.length > 0 || gifts.length > 0;


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

    if (
      selectedCalendarDate &&
      isSameDate(selectedCalendarDate, day)
    ) {
      dateButton.classList.add("selected");
      dateButton.setAttribute("aria-pressed", "true");
    } else {
      dateButton.setAttribute("aria-pressed", "false");
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
    dateButton.addEventListener("click", () => {
      if (
        selectedCalendarDate &&
        isSameDate(selectedCalendarDate, day)
      ) {
        openDateDetailModal(day);
        return;
      }

      selectedCalendarDate = new Date(day);

      renderWeekStrip();
      renderCurrentDate();
    });


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
          [...events.map(event => event.type),
             ...gifts.map(gift => gift.direction === "received" ? "received" : "given")]
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
        person.name,

      isYearly:
        true,

      source:
        "people"

    });

  });


  /* =========================
     REGISTERED EVENTS
  ========================== */

  const registeredEvents =
    calendarEvents.filter(event =>
      isRegisteredEventOnDate(
        event,
        date
      )
    );


  registeredEvents.forEach(event => {

    events.push({

      id:
        event.id,

      type:
        event.event_type,

      title:
        event.title,

      eventDate:
        event.event_date,

      personId:
        event.person_id,

      personName:
        event.people?.name
        ?? event.related_person_name
        ?? "",

      isYearly:
        event.is_yearly,

      memo:
        event.memo ?? "",

      source:
        "events"

    });

  });


  return events;

}

// 指定日のプレゼント履歴を取得
function getGiftsForDate(date) {
  return giftLogs.filter(log =>
    isGiftOnDate(log.gift_date, date)
  );
}

// 日付詳細用のプレゼントHTML
function createDateDetailGiftHtml(log) {
  const type = log.direction === "received"
    ? "received"
    : "given";

  const label = type === "received"
    ? "もらったプレゼント"
    : "あげたプレゼント";

  const personName = log.people?.name
    ? formatPersonName(log.people.name)
    : "";

  const href =
    `gifts/gift_detail.html?gift_id=${
      encodeURIComponent(log.id)
    }&return_to=${
      encodeURIComponent("../index.html")
    }`;

  return `
    <a class="gm-day-card ${type}"
       href="${href}">

      <span class="gm-day-card-icon">
        <i class="fa-solid fa-gift"></i>
      </span>

      <span class="gm-day-card-body">

        <span class="gm-day-card-meta">
          <span class="gm-day-card-type">
            ${label}
          </span>

          <span class="gm-day-card-person">
            ${escapeHtml(personName)}
          </span>
        </span>

        <span class="gm-day-card-title">
          ${escapeHtml(
            log.item_name || "名称未登録"
          )}
        </span>

      </span>

      <span class="gm-day-card-arrow">
        <i class="fa-solid fa-chevron-right"></i>
      </span>

    </a>
  `;
}

/* ========================================
   REGISTERED EVENT CHECK
======================================== */

function isRegisteredEventOnDate(
  event,
  targetDate
) {

  if (
    !event ||
    !event.event_date
  ) {

    return false;

  }


  const dateParts =
    event.event_date
      .split("-")
      .map(Number);


  const eventYear =
    dateParts[0];

  const eventMonth =
    dateParts[1];

  const eventDay =
    dateParts[2];


  if (
    event.is_yearly
  ) {

    return (

      eventMonth ===
        targetDate.getMonth() + 1

      &&

      eventDay ===
        targetDate.getDate()

    );

  }


  return (

    eventYear ===
      targetDate.getFullYear()

    &&

    eventMonth ===
      targetDate.getMonth() + 1

    &&

    eventDay ===
      targetDate.getDate()

  );

}


/* ========================================
   CALENDAR EVENT ICON
======================================== */

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

    case "received":
      icon.classList.add("fa-gift", "received");
      icon.setAttribute("aria-label", "もらったプレゼント");
      break;

    case "given":
      icon.classList.add("fa-gift", "given");
      icon.setAttribute("aria-label", "あげたプレゼント");
      break;

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
        "プレゼント予定"
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


    case "celebration":

      icon.classList.add(
        "fa-champagne-glasses",
        "celebration"
      );

      icon.setAttribute(
        "aria-label",
        "お祝い"
      );

      break;


    case "other":

      icon.classList.add(
        "fa-star",
        "other"
      );

      icon.setAttribute(
        "aria-label",
        "その他のイベント"
      );

      break;


    default:

      icon.classList.add(
        "fa-calendar",
        "other"
      );

      break;

  }


  return icon;

}


/* ========================================
   DATE DETAIL MODAL
======================================== */

function openDateDetailModal(date) {

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

  const gifts = 
    getGiftsForDate(date);


  /* =========================
     TITLE
  ========================== */

    const weekdays = [
      "日", "月", "火", "水", "木", "金", "土"
    ];

    title.textContent =
      `${date.getFullYear()}年`
     + `${date.getMonth() + 1}月`
     + `${date.getDate()}日`
     + `（${weekdays[date.getDay()]}）`;


    const items = [
    ...events.map(event => ({
      type: event.type,
      title: event.title || "イベント",
      personName: event.type !== "birthday" && event.personName
        ? formatPersonName(event.personName)
        : "",
      href: event.source === "people"
        ? createTopDetailUrl(
            `people/people_detail.html?id=${encodeURIComponent(event.personId)}`
          )
        : createTopDetailUrl(
            `events/event_detail.html?event_id=${encodeURIComponent(event.id)}`
          )
    })),

    ...gifts.map(log => ({
      type: log.direction === "received" ? "received" : "given",
      title: log.item_name || "名称未登録",
      personName: log.people?.name
        ? formatPersonName(log.people.name)
        : "",
      href: createTopDetailUrl(
        `gifts/gift_detail.html?gift_id=${encodeURIComponent(log.id)}`
      )
    }))
  ];
  renderDateDetailCards(content, items);

  /*追加ボタンで使用するため日付を保持*/
  modal.dataset.date =
    formatDateForInput(date);


  modal.classList.remove(
    "hidden"
  );


  modal.setAttribute(
    "aria-hidden",
    "false"
  );


  /*背景スクロール防止*/
  document.body.style.overflow =
    "hidden";

}

function createDateDetailEventHtml(event) {
  const type = [
    "birthday",
    "anniversary",
    "celebration",
    "gift",
    "other"
  ].includes(event.type)
    ? event.type
    : "other";

  const settings = {
    birthday: {
      label: "誕生日",
      icon: "fa-solid fa-cake-candles"
    },
    anniversary: {
      label: "記念日",
      icon: "fa-solid fa-heart"
    },
    celebration: {
      label: "お祝い",
      icon: "fa-solid fa-champagne-glasses"
    },
    gift: {
      label: "プレゼント予定",
      icon: "fa-solid fa-gift"
    },
    other: {
      label: "その他",
      icon: "fa-regular fa-calendar"
    }
  };

  const setting = settings[type];

  // 誕生日カードは人物名を重複表示しない
  const personName =
    type === "birthday"
      ? ""
      : event.personName
        ? formatPersonName(event.personName)
        : "";

  let href;

  // 人物情報から取得した誕生日
  if (event.source === "people") {
    href =
      `people/people_detail.html?id=${
        encodeURIComponent(event.personId)
      }`;

  // イベント登録画面から登録したイベント
  } else {
    href =
      `events/event_detail.html?event_id=${
        encodeURIComponent(event.id)
      }&return_to=${
        encodeURIComponent("../index.html")
      }`;
  }

  return `
    <a class="gm-day-card ${type}"
       href="${href}">

      <span class="gm-day-card-icon">
        <i class="${setting.icon}"></i>
      </span>

      <span class="gm-day-card-body">

        <span class="gm-day-card-meta">

          <span class="gm-day-card-type">
            ${setting.label}
          </span>

          <span class="gm-day-card-person">
            ${escapeHtml(personName)}
          </span>

        </span>

        <span class="gm-day-card-title">
          ${escapeHtml(event.title || "イベント")}
        </span>

      </span>

      <span class="gm-day-card-arrow">
        <i class="fa-solid fa-chevron-right"></i>
      </span>

    </a>
  `;
}

function getEventDisplaySettings(
  type
) {

  switch (type) {

    case "anniversary":

      return {
        label: "記念日",
        iconClass: "fa-heart"
      };


    case "celebration":

      return {
        label: "お祝い",
        iconClass: "fa-champagne-glasses"
      };


    case "gift":

      return {
        label: "プレゼント予定",
        iconClass: "fa-gift"
      };


    case "other":

      return {
        label: "その他",
        iconClass: "fa-calendar"
      };


    default:

      return {
        label: "イベント",
        iconClass: "fa-calendar"
      };

  }

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

  const giftAddButton =
    document.getElementById(
      "dateDetailGiftAddButton"
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
     追加　イベント登録　＆　プレゼント登録
  ========================== */
  // イベント登録へ
  addButton.addEventListener("click", () => {

    const selectedDate = modal.dataset.date;

    const destinationUrl =
      `events/event.html?event_date=${
        encodeURIComponent(selectedDate)
      }`;

    window.location.href =
      createTopDetailUrl(destinationUrl);

  });

  // プレゼント登録へ
  giftAddButton.addEventListener("click", () => {

    const selectedDate = modal.dataset.date;

    const destinationUrl =
      `gifts/gifts.html?gift_date=${
        encodeURIComponent(selectedDate)
      }`;

    window.location.href =
      createTopDetailUrl(destinationUrl);

  });
}


/* ========================================
   EVENT ACTIONS
======================================== */

function setupEventActions() {

  const content =
    document.getElementById(
      "dateDetailContent"
    );


  if (!content) {
    return;
  }


  content.addEventListener(
    "click",
    async event => {

      
      /*三点リーダー*/
      const toggleButton =
        event.target.closest(
          ".date-detail-actions-toggle"
        );


      if (toggleButton) {

        event.stopPropagation();


        const actions =
          toggleButton.closest(
            ".date-detail-actions"
          );


        const menu =
          actions?.querySelector(
            ".date-detail-actions-menu"
          );


        if (!menu) {
          return;
        }


        const willOpen =
          menu.classList.contains(
            "hidden"
          );


        closeAllEventActionMenus();


        menu.classList.toggle(
          "hidden",
          !willOpen
        );


        toggleButton.setAttribute(
          "aria-expanded",
          String(willOpen)
        );


        return;

      }


      /*編集*/
      const editButton =
        event.target.closest(
          ".event-edit-button"
        );


      if (editButton) {

        const eventId =
          editButton.dataset.eventId;


        if (!eventId) {
          return;
        }


        window.location.href =
          createTopDetailUrl(
            `events/event.html?event_id=${
                encodeURIComponent(eventId)
            }`
        );

        return;

      }


      /*削除*/
      const deleteButton =
        event.target.closest(
          ".date-detail-delete-button"
        );


      if (deleteButton) {

        const eventId =
          deleteButton.dataset.eventId;


        if (!eventId) {
          return;
        }


        const shouldDelete =
          window.confirm(
            "このイベントを削除しますか？\nこの操作は取り消せません。"
          );


        if (!shouldDelete) {
          return;
        }


        await deleteCalendarEvent(
          eventId,
          deleteButton
        );

      }

    }
  );


  /*メニュー外を押した場合は閉じる*/
  document.addEventListener(
    "click",
    event => {

      if (
        event.target.closest(
          ".date-detail-actions"
        )
      ) {

        return;

      }


      closeAllEventActionMenus();

    }
  );

}


/* ========================================
   CLOSE EVENT ACTION MENUS
======================================== */

function closeAllEventActionMenus() {

  const menus =
    document.querySelectorAll(
      ".date-detail-actions-menu"
    );


  menus.forEach(menu => {

    menu.classList.add(
      "hidden"
    );

  });


  const toggleButtons =
    document.querySelectorAll(
      ".date-detail-actions-toggle"
    );


  toggleButtons.forEach(button => {

    button.setAttribute(
      "aria-expanded",
      "false"
    );

  });

}

async function deleteCalendarEvent(
  eventId,
  deleteButton
) {

  deleteButton.disabled =
    true;


  const originalHtml =
    deleteButton.innerHTML;


  deleteButton.innerHTML = `
    <i class="fa-solid fa-spinner fa-spin"></i>
  `;


  const { error } =
    await supabase
      .from("events")
      .delete()
      .eq(
        "id",
        eventId
      );


  if (error) {

    console.error(
      "イベントの削除に失敗しました:",
      error
    );


    window.alert(
      "イベントを削除できませんでした。"
    );


    deleteButton.disabled =
      false;


    deleteButton.innerHTML =
      originalHtml;


    return;

  }


  calendarEvents =
    calendarEvents.filter(
      event =>
        event.id !== eventId
    );


  renderWeekStrip();


  reopenSelectedDateDetail();

}

function reopenSelectedDateDetail() {

  const modal =
    document.getElementById(
      "dateDetailModal"
    );


  const selectedDate =
    modal?.dataset.date;


  if (!selectedDate) {
    return;
  }


  const dateParts =
    selectedDate
      .split("-")
      .map(Number);


  const selectedDateObject =
    new Date(
      dateParts[0],
      dateParts[1] - 1,
      dateParts[2]
    );


  openDateDetailModal(
    selectedDateObject
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
    
    const detailUrl =
      createTopDetailUrl(
        `gifts/gift_detail.html?gift_id=${
           encodeURIComponent(log.id)
        }`
      );


  return `
    <article class="timeline-item">

      <span
        class="timeline-dot ${directionClass}"
      ></span>

      <a 
        class="gift-card"
        href="${detailUrl}"
        aria-label="${escapeHtml(
          log.item_name ||
          "プレゼント"
        )}の詳細を表示"
      >

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

      </a>

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
   INITIAL TAB FROM URL
======================================== */

function applyInitialTab() {

  const params =
    new URLSearchParams(
      window.location.search
    );


  const tab =
    params.get(
      "tab"
    );


  const allowedTabs =
    [
      "home",
      "schedule",
      "ai",
      "setting"
    ];


  if (
    !tab ||
    !allowedTabs.includes(
      tab
    )
  ) {
    return;
  }


  switchTab(
    tab
  );

}


/* ========================================
   SWITCH TAB
======================================== */

function switchTab(tabName) {

  const tabs = [
    "home",
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
   PERSON NAME FORMAT
======================================== */

function formatPersonName(
  name
) {

  const trimmedName =
    String(name ?? "").trim();


  if (!trimmedName) {
    return "";
  }


  const hasHonorific =
    /(?:さん|様|さま|くん|君|ちゃん)$/
      .test(trimmedName);


  return hasHonorific
    ? trimmedName
    : `${trimmedName}さん`;

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

/* ========================================
   WEEK DATE SELECT MODAL
======================================== */

function openWeekDateSelectModal() {
  const modal =
    document.getElementById("weekDateSelectModal");

  const yearSelect =
    document.getElementById("weekSelectYear");

  const monthSelect =
    document.getElementById("weekSelectMonth");

  const daySelect =
    document.getElementById("weekSelectDay");

  const baseDate =
    selectedCalendarDate ?? new Date();

  const currentYear = new Date().getFullYear();

  yearSelect.innerHTML = "";

  for (let year = 1900; year <= currentYear + 100; year++) {
    yearSelect.add(new Option(`${year}年`, year));
  }

  monthSelect.innerHTML = "";

  for (let month = 1; month <= 12; month++) {
    monthSelect.add(new Option(`${month}月`, month));
  }

  yearSelect.value = String(baseDate.getFullYear());
  monthSelect.value = String(baseDate.getMonth() + 1);

  function updateDays() {
    const year = Number(yearSelect.value);
    const month = Number(monthSelect.value);

    const maxDay = new Date(year, month, 0).getDate();
    const previousDay = Number(daySelect.value) || baseDate.getDate();

    daySelect.innerHTML = "";

    for (let day = 1; day <= maxDay; day++) {
      daySelect.add(new Option(`${day}日`, day));
    }

    daySelect.value = String(Math.min(previousDay, maxDay));
  }

  yearSelect.onchange = updateDays;
  monthSelect.onchange = updateDays;

  updateDays();

  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeWeekDateSelectModal() {
  const modal =
    document.getElementById("weekDateSelectModal");

  modal.classList.add("hidden");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function setupWeekDateSelectModal() {
  const modal =
    document.getElementById("weekDateSelectModal");

  const closeButton =
    document.getElementById("weekDateSelectClose");

  const confirmButton =
    document.getElementById("weekDateSelectConfirm");

  closeButton.addEventListener(
    "click",
    closeWeekDateSelectModal
  );

  modal.addEventListener("click", event => {
    if (event.target === modal) {
      closeWeekDateSelectModal();
    }
  });

  document.addEventListener("keydown", event => {
    if (
      event.key === "Escape" &&
      !modal.classList.contains("hidden")
    ) {
      closeWeekDateSelectModal();
    }
  });

  confirmButton.addEventListener("click", () => {
    const year =
      Number(document.getElementById("weekSelectYear").value);

    const month =
      Number(document.getElementById("weekSelectMonth").value);

    const day =
      Number(document.getElementById("weekSelectDay").value);

    const selectedDate = new Date(year, month - 1, day);

    displayedWeekStart =
      getStartOfWeek(selectedDate);

    selectedCalendarDate = selectedDate;

    renderWeekStrip();
    renderCurrentDate();
    closeWeekDateSelectModal();
  });
}