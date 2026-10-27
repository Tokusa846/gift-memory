import { renderDateDetailCards } from "../common/modal.js";

import {
  buildUrlWithReturnTo
} from "../common/navigation.js";

import {
  supabase
} from "../common/supabase.js";

/* ========================================
   ELEMENTS
======================================== */

const calendarTitle =
  document.getElementById(
    "scheduleCalendarTitle"
  );

const calendar =
  document.getElementById(
    "scheduleCalendar"
  );

const previousMonthButton =
  document.getElementById(
    "previousMonthButton"
  );

const nextMonthButton =
  document.getElementById(
    "nextMonthButton"
  );

const timeline =
  document.getElementById(
    "scheduleTimeline"
  );

const addButton =
  document.getElementById(
    "scheduleAddButton"
  );

const addMenu =
  document.getElementById(
    "scheduleAddMenu"
  );

const addGiftLink =
  document.getElementById(
    "scheduleAddGiftLink"
  );

const addEventLink =
  document.getElementById(
    "scheduleAddEventLink"
  );


/* ========================================
   STATE
======================================== */

const today =
  new Date();

let displayedDate =
  getInitialDisplayedDate();

let monthlyGifts = [];

let monthlyEvents = [];

let monthlyBirthdays = [];

let selectedDateKey = null;


/* ========================================
   INITIALIZE
======================================== */

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    setupMonthNavigation();

    setupAddMenu();

    setupScheduleModals();

    await renderDisplayedMonth();

  }
);


/* ========================================
   INITIAL MONTH
======================================== */

function getInitialDisplayedDate() {

  const params =
    new URLSearchParams(
      window.location.search
    );

  const monthParam =
    params.get("month");

  if (
    monthParam &&
    /^\d{4}-\d{2}$/.test(
      monthParam
    )
  ) {

    const [
      year,
      month
    ] =
      monthParam
        .split("-")
        .map(Number);

    if (
      month >= 1 &&
      month <= 12
    ) {

      return new Date(
        year,
        month - 1,
        1
      );

    }

  }


  return new Date(
    today.getFullYear(),
    today.getMonth(),
    1
  );

}


/* ========================================
   MONTH NAVIGATION
======================================== */

function setupMonthNavigation() {

  previousMonthButton?.addEventListener(
    "click",
    async () => {

      displayedDate =
        new Date(
          displayedDate.getFullYear(),
          displayedDate.getMonth() - 1,
          1
        );

      await renderDisplayedMonth();

    }
  );


  nextMonthButton?.addEventListener(
    "click",
    async () => {

      displayedDate =
        new Date(
          displayedDate.getFullYear(),
          displayedDate.getMonth() + 1,
          1
        );

      await renderDisplayedMonth();

    }
  );

}


/* ========================================
   RENDER MONTH
======================================== */

async function renderDisplayedMonth() {

  selectedDateKey = null;

  updateMonthUrl();

  renderMonthTitle();

  showLoading();
  
  const result =
    await loadMonthlyData();

  if (!result) {

    renderCalendar();

    return;

  }


  renderCalendar();

  renderTimeline();

  updateAddLinks();

}


/* ========================================
   MONTH URL
======================================== */

function updateMonthUrl() {

  const monthValue =
    getDisplayedMonthValue();

  const url =
    new URL(
      window.location.href
    );

  url.searchParams.set(
    "month",
    monthValue
  );

  window.history.replaceState(
    {},
    "",
    url
  );

}


/* ========================================
   MONTH TITLE
======================================== */

function renderMonthTitle() {

  if (!calendarTitle) {
    return;
  }


  calendarTitle.innerHTML = `
    ${displayedDate.getFullYear()}年${displayedDate.getMonth() + 1}月
    <i class="fa-solid fa-chevron-down"></i>
  `;

}


/* ========================================
   LOAD MONTH DATA
======================================== */

async function loadMonthlyData() {

  const {
    startDate,
    endDate
  } =
    getMonthRange();


  const [
    giftResult,
    eventResult,
    peopleResult
  ] =
    await Promise.all([

      /* ------------------------------
         GIFT LOG
      ------------------------------ */

      supabase
        .from("Gifts")
        .select(`
          id,
          person_id,
          direction,
          gift_date,
          occasion,
          item_name,
          created_at,
          people (
            name
          )
        `)
        .gte(
          "gift_date",
          startDate
        )
        .lte(
          "gift_date",
          endDate
        )
        .order(
          "gift_date",
          {
            ascending: true
          }
        )
        .order(
          "created_at",
          {
            ascending: true
          }
        ),


      /* ------------------------------
         EVENT
      ------------------------------ */

      supabase
        .from("events")
        .select(`
          id,
          event_type,
          title,
          event_date,
          person_id,
          related_person_name,
          is_yearly,
          people (
            name
          )
        `)
        .order(
          "event_date",
          {
            ascending: true
          }
        ),


      /* ------------------------------
         PEOPLE / BIRTHDAY
      ------------------------------ */

      supabase
        .from("people")
        .select(`
          id,
          name,
          birthday
        `)
        .not(
          "birthday",
          "is",
          null
        )

    ]);


  if (
    giftResult.error ||
    eventResult.error ||
    peopleResult.error
  ) {

    console.error(
      "予定画面のデータ取得に失敗しました:",
      {
        giftError:
          giftResult.error,

        eventError:
          eventResult.error,

        peopleError:
          peopleResult.error
      }
    );


    monthlyGifts =
      giftResult.data || [];


    monthlyEvents =
      filterEventsForDisplayedMonth(
        eventResult.data || []
      );


    monthlyBirthdays =
      filterBirthdaysForDisplayedMonth(
        peopleResult.data || []
      );


    showLoadError();

    return false;

  }


  monthlyGifts =
    giftResult.data || [];


  monthlyEvents =
    filterEventsForDisplayedMonth(
      eventResult.data || []
    );


  monthlyBirthdays =
    filterBirthdaysForDisplayedMonth(
      peopleResult.data || []
    );


  return true;

}


/* ========================================
   FILTER EVENTS FOR DISPLAYED MONTH
======================================== */

function filterEventsForDisplayedMonth(
  events
) {

  const displayedYear =
    displayedDate.getFullYear();

  const displayedMonth =
    displayedDate.getMonth();


  return events
    .map(event => {

      if (!event.event_date) {
        return null;
      }


      const [
        eventYear,
        eventMonth,
        eventDay
      ] =
        event.event_date
          .split("-")
          .map(Number);


      /*
        毎年繰り返すイベント
        → 年を表示中の年へ置き換える
      */

      if (event.is_yearly) {

        if (
          eventMonth - 1 !==
          displayedMonth
        ) {
          return null;
        }


        return {
          ...event,

          display_date:
            formatDateKey(
              new Date(
                displayedYear,
                eventMonth - 1,
                eventDay
              )
            )
        };

      }


      /*
        繰り返さないイベント
        → 年月が一致する場合のみ表示
      */

      if (
        eventYear !== displayedYear ||
        eventMonth - 1 !== displayedMonth
      ) {
        return null;
      }


      return {
        ...event,

        display_date:
          event.event_date
      };

    })
    .filter(Boolean)
    .sort(
      (a, b) =>
        a.display_date.localeCompare(
          b.display_date
        )
    );

}

/* ========================================
   FILTER BIRTHDAYS FOR DISPLAYED MONTH
======================================== */

function filterBirthdaysForDisplayedMonth(
  people
) {

  const displayedYear =
    displayedDate.getFullYear();

  const displayedMonth =
    displayedDate.getMonth();


  return people
    .map(person => {

      if (!person.birthday) {
        return null;
      }


      const birthdayParts =
        person.birthday
          .split("-")
          .map(Number);


      if (
        birthdayParts.length < 3
      ) {
        return null;
      }


      const birthdayMonth =
        birthdayParts[1];

      const birthdayDay =
        birthdayParts[2];


      /*
        表示中の月と
        誕生月が違う場合は対象外
      */

      if (
        birthdayMonth - 1 !==
        displayedMonth
      ) {
        return null;
      }


      /*
        誕生日は毎年表示する。

        元の生年月日は変更せず、
        display_dateだけ表示中の年にする。
      */

      return {
        id: person.id,
        person_id: person.id,
        name: person.name,
        birthday: person.birthday,

        display_date:
          formatDateKey(
            new Date(
              displayedYear,
              birthdayMonth - 1,
              birthdayDay
            )
          )
      };

    })
    .filter(Boolean)
    .sort(
      (a, b) =>
        a.display_date.localeCompare(
          b.display_date
        )
    );

}

/* ========================================
   MONTH RANGE
======================================== */

function getMonthRange() {

  const year =
    displayedDate.getFullYear();

  const month =
    displayedDate.getMonth();


  const lastDay =
    new Date(
      year,
      month + 1,
      0
    ).getDate();


  return {
    startDate:
      formatDateKey(
        new Date(
          year,
          month,
          1
        )
      ),

    endDate:
      formatDateKey(
        new Date(
          year,
          month,
          lastDay
        )
      )
  };

}


/* ========================================
   CALENDAR
======================================== */

function renderCalendar() {

  if (!calendar) {
    return;
  }


  calendar.innerHTML = "";


  const year =
    displayedDate.getFullYear();

  const month =
    displayedDate.getMonth();


  const firstDate =
    new Date(
      year,
      month,
      1
    );


  /*
    日曜日始まり。

    firstDate.getDay()
    0 = 日
    1 = 月
    ...
    6 = 土
  */

  const firstDayIndex =
    firstDate.getDay();


  const calendarStart =
    new Date(
      year,
      month,
      1 - firstDayIndex
    );


  /*
    月表示は6週間固定。
    月による高さの変化を防ぐ。
  */

  const totalCells = 42;


  for (
    let index = 0;
    index < totalCells;
    index += 1
  ) {

    const date =
      new Date(
        calendarStart.getFullYear(),
        calendarStart.getMonth(),
        calendarStart.getDate() + index
      );


    const dayElement =
      createCalendarDay(
        date,
        month
      );


    calendar.appendChild(
      dayElement
    );

  }

}


/* ========================================
   CALENDAR DAY
======================================== */

function createCalendarDay(
  date,
  displayedMonth
) {

  const element =
    document.createElement(
      "div"
    );


  element.className =
    "schedule-calendar-day";
    element.dataset.date = formatDateKey(date);


  const dayOfWeek =
    date.getDay();


  if (dayOfWeek === 0) {

    element.classList.add(
      "sunday"
    );

  }


  if (dayOfWeek === 6) {

    element.classList.add(
      "saturday"
    );

  }


  if (
    date.getMonth() !==
    displayedMonth
  ) {

    element.classList.add(
      "other-month"
    );

  }


  if (isToday(date)) {

    element.classList.add(
      "today"
    );

  }


  const dateKey =
    formatDateKey(date);


  const dateNumber =
    document.createElement(
      "span"
    );

  dateNumber.className =
    "schedule-calendar-date";

  dateNumber.textContent =
    String(
      date.getDate()
    );


  const icons =
    document.createElement(
      "span"
    );

  icons.className =
    "schedule-calendar-icons";


  /*
    表示月の日付だけ
    アイコンを表示する。
  */

  if (
    date.getMonth() ===
    displayedMonth
  ) {

    const types =
      getActivityTypesForDate(
        dateKey
      );


    types.forEach(type => {

      icons.appendChild(
        createCalendarIcon(
          type
        )
      );

    });

  }


element.append(
  dateNumber,
  icons
);

/* ========================================
   DATE SELECTION
======================================== */

function selectCalendarDate(dateKey) {

  // 同じ日付を再度押した場合
  if (selectedDateKey === dateKey) {
    openScheduleDayModal(dateKey);
    return;
  }

  // 選択日を更新
  selectedDateKey = dateKey;

  // 以前のハイライトを解除
  document
    .querySelectorAll(
      ".schedule-calendar-day.selected"
    )
    .forEach(element => {
      element.classList.remove("selected");
    });

  // 新しい日付をハイライト
  const selectedElement =
    Array.from(
      document.querySelectorAll(
        ".schedule-calendar-day"
      )
    ).find(element =>
      element.dataset.date === dateKey
    );

  selectedElement?.classList.add("selected");
}




/* ========================================
   DATE CLICK
======================================== */

// 表示中の月の日付だけクリック可能にする
if (date.getMonth() === displayedMonth) {

  element.setAttribute("role", "button");
  element.setAttribute("tabindex", "0");

  element.setAttribute(
    "aria-label",
    `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日の詳細`
  );

  element.addEventListener("click", () => {
    selectCalendarDate(dateKey);
  });

  element.addEventListener("keydown", event => {

    if (
      event.key === "Enter" ||
      event.key === " "
    ) {
      event.preventDefault();
      selectCalendarDate(dateKey);
    }

  });

}

return element;

}


/* ========================================
   ACTIVITY TYPES
======================================== */

function getActivityTypesForDate(
  dateKey
) {

  const types =
    new Set();


  /* ------------------------------
     GIFT LOG
  ------------------------------ */

  monthlyGifts.forEach(gift => {

    if (
      gift.gift_date !==
      dateKey
    ) {
      return;
    }


    if (
      gift.direction ===
      "received"
    ) {

      types.add(
        "received"
      );

    } else {

      types.add(
        "given"
      );

    }

  });


  /* ------------------------------
     EVENT
  ------------------------------ */

  monthlyEvents.forEach(event => {

    if (
      event.display_date !==
      dateKey
    ) {
      return;
    }


    types.add(
      `event-${
        normalizeEventType(
          event.event_type
        )
      }`
    );

  });


  /* ------------------------------
     PERSON BIRTHDAY
  ------------------------------ */

  const hasBirthday =
    monthlyBirthdays.some(
      birthday =>
        birthday.display_date ===
        dateKey
    );


  if (hasBirthday) {

    types.add(
      "person-birthday"
    );

  }


  return [
    ...types
  ];

}


/* ========================================
   CALENDAR ICON
======================================== */

function createCalendarIcon(
  type
) {

  const icon =
    document.createElement(
      "i"
    );


  icon.className =
    `schedule-calendar-icon ${
      type
    } ${
      getIconClass(type)
    }`;


  return icon;

}


/* ========================================
   TIMELINE
======================================== */

function renderTimeline() {

  if (!timeline) {
    return;
  }


  const items =
    createMonthlyItems();


  if (
    items.length === 0
  ) {

    timeline.innerHTML = `
      <p class="schedule-empty">
        この月の予定・記録はありません。
      </p>
    `;

    return;

  }


  timeline.innerHTML = "";


  const groupedItems =
    groupItemsByDate(
      items
    );


  groupedItems.forEach(
    group => {

      timeline.appendChild(
        createDateGroup(
          group
        )
      );

    }
  );

}


/* ========================================
   CREATE MONTHLY ITEMS
======================================== */

function createMonthlyItems() {

  const giftItems =
    monthlyGifts.map(
      gift => ({
        kind: "gift",
        id: gift.id,
        date: gift.gift_date,
        data: gift
      })
    );


  const eventItems =
    monthlyEvents.map(
      event => ({
        kind: "event",
        id: event.id,
        date: event.display_date,
        data: event
      })
    );


  const birthdayItems =
    monthlyBirthdays.map(
      birthday => ({
        kind: "birthday",
        id: birthday.id,
        date: birthday.display_date,
        data: birthday
      })
    );


  return [
    ...giftItems,
    ...eventItems,
    ...birthdayItems
  ].sort(
    (a, b) => {

      return (
        a.date.localeCompare(
          b.date
        )
      );

    }
  );

}


/* ========================================
   GROUP BY DATE
======================================== */

function groupItemsByDate(
  items
) {

  const groups =
    new Map();


  items.forEach(item => {

    if (
      !groups.has(
        item.date
      )
    ) {

      groups.set(
        item.date,
        []
      );

    }


    groups
      .get(item.date)
      .push(item);

  });


  return [
    ...groups.entries()
  ].map(
    ([
      date,
      groupItems
    ]) => ({
      date,
      items: groupItems
    })
  );

}


/* ========================================
   DATE GROUP
======================================== */

function createDateGroup(
  group
) {

  const section =
    document.createElement(
      "section"
    );

  section.className =
    "schedule-date-group";


  const heading =
    document.createElement(
      "h3"
    );

  heading.className =
    "schedule-date-heading";

  heading.textContent =
    formatTimelineDate(
      group.date
    );


  const itemList =
    document.createElement(
      "div"
    );

  itemList.className =
    "schedule-date-items";


  group.items.forEach(
    item => {

      if (
        item.kind ===
        "gift"
      ) {

        itemList.appendChild(
          createGiftCard(
            item.data
          )
        );

        return;

      }


      if (
        item.kind ===
        "birthday"
      ) {

        itemList.appendChild(
          createBirthdayCard(
            item.data
          )
        );

        return;

      }


      itemList.appendChild(
        createEventCard(
          item.data
        )
      );

    }
  );


  section.append(
    heading,
    itemList
  );


  return section;

}


/* ========================================
   GIFT CARD
======================================== */

function createGiftCard(
  gift
) {

  const direction =
    gift.direction ===
    "received"
      ? "received"
      : "given";


  const card =
    document.createElement(
      "a"
    );


  card.className =
    `schedule-card ${direction}`;


  card.href =
    createGiftDetailUrl(
      gift.id
    );


  const personName =
    formatPersonName(
      gift.people?.name
    );


  const directionLabel =
    direction === "received"
      ? "もらった"
      : "あげた";


  card.innerHTML = `

    <span class="schedule-card-icon">
      <i class="fa-solid fa-gift"></i>
    </span>

    <span class="schedule-card-content">

      <span class="schedule-card-title">
        ${escapeHtml(
          gift.item_name ||
          "名称未登録"
        )}
      </span>

      <span class="schedule-card-meta">
        ${escapeHtml(
          `${personName}・${directionLabel}`
        )}
      </span>

    </span>

    <span class="schedule-card-arrow">
      <i class="fa-solid fa-chevron-right"></i>
    </span>

  `;


  return card;

}

/* ========================================
   BIRTHDAY CARD
======================================== */

function createBirthdayCard(
  birthday
) {

  const card =
    document.createElement(
      "a"
    );


  card.className =
    "schedule-card person-birthday";


  card.href =
    createPersonDetailUrl(
      birthday.person_id
    );


  card.innerHTML = `

    <span class="schedule-card-icon">
      <i class="fa-solid fa-cake-candles"></i>
    </span>

    <span class="schedule-card-content">

      <span class="schedule-card-title">
        ${escapeHtml(
          `${birthday.name || "名前未登録"}の誕生日`
        )}
      </span>

      <span class="schedule-card-meta">
        人物登録の誕生日
      </span>

    </span>

    <span class="schedule-card-arrow">
      <i class="fa-solid fa-chevron-right"></i>
    </span>

  `;


  return card;

}

/* ========================================
   EVENT CARD
======================================== */

function createEventCard(
  event
) {

  const eventType =
    normalizeEventType(
      event.event_type
    );


  const card =
    document.createElement(
      "a"
    );


  card.className =
    `schedule-card event-${eventType}`;


  card.href =
    createEventDetailUrl(
      event.id
    );


  const personName =
    getEventPersonName(
      event
    );


  card.innerHTML = `

    <span class="schedule-card-icon">
      <i class="${
        getIconClass(
          `event-${eventType}`
        )
      }"></i>
    </span>

    <span class="schedule-card-content">

      <span class="schedule-card-title">
        ${escapeHtml(
          event.title ||
          "イベント"
        )}
      </span>

      <span class="schedule-card-meta">
        ${escapeHtml(
          personName
        )}
      </span>

    </span>

    <span class="schedule-card-arrow">
      <i class="fa-solid fa-chevron-right"></i>
    </span>

  `;


  return card;

}


/* ========================================
   EVENT PERSON
======================================== */

function getEventPersonName(
  event
) {

  const registeredName =
    event.people?.name;


  if (registeredName) {

    return formatPersonName(
      registeredName
    );

  }


  if (
    event.related_person_name
  ) {

    return event.related_person_name;

  }


  return "関連人物なし";

}


/* ========================================
   ICON
======================================== */

function getIconClass(
  type
) {

  switch (type) {

    case "received":
    case "given":
      return "fa-solid fa-gift";


    case "event-birthday":
    case "person-birthday":
      return "fa-solid fa-cake-candles";

    case "event-anniversary":
      return "fa-solid fa-heart";


    case "event-celebration":
      return "fa-solid fa-champagne-glasses";


    case "event-gift":
      return "fa-solid fa-gift";


    default:
      return "fa-regular fa-calendar";

  }

}


/* ========================================
   EVENT TYPE
======================================== */

function normalizeEventType(
  value
) {

  const validTypes = [
    "birthday",
    "anniversary",
    "celebration",
    "gift",
    "other"
  ];


  return validTypes.includes(
    value
  )
    ? value
    : "other";

}


/* ========================================
   ADD MENU
======================================== */

function setupAddMenu() {

  if (
    !addButton ||
    !addMenu
  ) {
    return;
  }


  addButton.addEventListener(
    "click",
    event => {

      event.stopPropagation();


      const willOpen =
        addMenu.classList.contains(
          "hidden"
        );


      addMenu.classList.toggle(
        "hidden",
        !willOpen
      );


      addButton.setAttribute(
        "aria-expanded",
        String(willOpen)
      );

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


  document.addEventListener(
    "keydown",
    event => {

      if (
        event.key ===
        "Escape"
      ) {

        closeAddMenu();

      }

    }
  );


  updateAddLinks();

}


/* ========================================
   ADD LINKS
======================================== */

function updateAddLinks() {

  const returnUrl =
    createScheduleReturnUrl();

  if (addGiftLink) {
    addGiftLink.href =
      buildUrlWithReturnTo(
        "../gifts/gifts.html",
        returnUrl
      );
  }

  if (addEventLink) {
    addEventLink.href =
      buildUrlWithReturnTo(
        "../events/event.html",
        returnUrl
      );
  }

}


/* ========================================
   CLOSE ADD MENU
======================================== */

function closeAddMenu() {

  if (
    !addButton ||
    !addMenu
  ) {
    return;
  }


  addMenu.classList.add(
    "hidden"
  );


  addButton.setAttribute(
    "aria-expanded",
    "false"
  );

}


/* ========================================
   DETAIL URL
======================================== */

function createGiftDetailUrl(giftId) {

  const destinationUrl =
    `../gifts/gift_detail.html?gift_id=${
      encodeURIComponent(giftId)
    }`;

  return buildUrlWithReturnTo(
    destinationUrl,
    createScheduleReturnUrl()
  );

}

/*
  現在イベント専用の詳細画面はないため、
  登録画面の編集モードへ遷移する。
*/

function createEventDetailUrl(eventId) {

  const destinationUrl =
    `../events/event_detail.html?event_id=${
      encodeURIComponent(eventId)
    }`;

  return buildUrlWithReturnTo(
    destinationUrl,
    createScheduleReturnUrl()
  );

}

function createPersonDetailUrl(personId) {

  const destinationUrl =
    `../people/people_detail.html?id=${
      encodeURIComponent(personId)
    }`;

  const returnUrl =
    createScheduleReturnUrl();

  return buildUrlWithReturnTo(
    destinationUrl,
    returnUrl
  );

}


/* ========================================
   RETURN URL
======================================== */

function createScheduleReturnUrl() {

  return (
    `../schedule/schedule.html?month=${
      encodeURIComponent(
        getDisplayedMonthValue()
      )
    }`
  );

}


/* ========================================
   DISPLAY MONTH VALUE
======================================== */

function getDisplayedMonthValue() {

  const year =
    displayedDate.getFullYear();


  const month =
    String(
      displayedDate.getMonth() + 1
    ).padStart(
      2,
      "0"
    );


  return `${year}-${month}`;

}


/* ========================================
   DATE FORMAT
======================================== */

function formatDateKey(
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
   TIMELINE DATE
======================================== */

function formatTimelineDate(
  dateString
) {

  const [
    year,
    month,
    day
  ] =
    dateString
      .split("-")
      .map(Number);


  const date =
    new Date(
      year,
      month - 1,
      day
    );


  const weekdays = [
    "日",
    "月",
    "火",
    "水",
    "木",
    "金",
    "土"
  ];


  return (
    `${year}.${String(month).padStart(2, "0")}.${
      String(day).padStart(2, "0")
    }`
    +
    `（${
      weekdays[
        date.getDay()
      ]
    }）`
  );

}


/* ========================================
   TODAY
======================================== */

function isToday(
  date
) {

  return (
    date.getFullYear() ===
      today.getFullYear()
    &&
    date.getMonth() ===
      today.getMonth()
    &&
    date.getDate() ===
      today.getDate()
  );

}


/* ========================================
   PERSON NAME
======================================== */

function formatPersonName(
  name
) {

  const trimmedName =
    String(
      name ?? ""
    ).trim();


  if (!trimmedName) {
    return "人物未登録";
  }


  const hasHonorific =
    /(?:さん|様|さま|くん|君|ちゃん)$/
      .test(
        trimmedName
      );


  return hasHonorific
    ? trimmedName
    : `${trimmedName}さん`;

}


/* ========================================
   LOADING / ERROR
======================================== */

function showLoading() {

  if (!timeline) {
    return;
  }


  timeline.innerHTML = `
    <p class="schedule-loading">
      予定・記録を読み込んでいます...
    </p>
  `;

}


function showLoadError() {

  if (!timeline) {
    return;
  }


  timeline.innerHTML = `
    <p class="schedule-error">
      予定・記録を取得できませんでした。
    </p>
  `;

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

/* ========================================
   SCHEDULE MODALS
======================================== */

function setupScheduleModals() {
  const todayButton = document.getElementById("scheduleTodayButton");
  const titleButton = document.getElementById("scheduleCalendarTitle");

  const monthModal = document.getElementById("scheduleMonthModal");
  const yearSelect = document.getElementById("scheduleJumpYear");
  const monthSelect = document.getElementById("scheduleJumpMonth");

  const dayModal = document.getElementById("scheduleDayModal");

  const closeModal = modal => {
    modal.classList.add("hidden");
    document.body.classList.remove("schedule-modal-open");
  };

  const showModal = modal => {
    modal.classList.remove("hidden");
    document.body.classList.add("schedule-modal-open");
  };

  // Today：現在の月へ戻る
  todayButton.addEventListener("click", async () => {
    const now = new Date();

    displayedDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    );

    await renderDisplayedMonth();
  });

  // 年月選択：1900年～現在年+100年
  const currentYear = new Date().getFullYear();

  for (let year = 1900; year <= currentYear + 100; year++) {
    const option = document.createElement("option");
    option.value = String(year);
    option.textContent = `${year}年`;
    yearSelect.appendChild(option);
  }

  for (let month = 1; month <= 12; month++) {
    const option = document.createElement("option");
    option.value = String(month);
    option.textContent = `${month}月`;
    monthSelect.appendChild(option);
  }

  // 年月表示を押してジャンプ先を選択
  titleButton.addEventListener("click", () => {
    yearSelect.value = String(displayedDate.getFullYear());
    monthSelect.value = String(displayedDate.getMonth() + 1);

    showModal(monthModal);
  });

  document.getElementById("scheduleMonthCancel")
    .addEventListener("click", () => closeModal(monthModal));

  document.getElementById("scheduleMonthApply")
    .addEventListener("click", async () => {
      displayedDate = new Date(
        Number(yearSelect.value),
        Number(monthSelect.value) - 1,
        1
      );

      closeModal(monthModal);
      await renderDisplayedMonth();
    });

  document.getElementById("scheduleDayClose")
    .addEventListener("click", () => closeModal(dayModal));

  // 背景タップで閉じる
  [monthModal, dayModal].forEach(modal => {
    modal.addEventListener("click", event => {
      if (event.target === modal) {
        closeModal(modal);
      }
    });
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      closeModal(monthModal);
      closeModal(dayModal);
    }
  });
}

/* ========================================
   日付詳細モーダル専用カード
======================================== */

function toSharedScheduleCard(kind, data) {
  if (kind === "gift") {
    return {
      type: data.direction === "received" ? "received" : "given",
      title: data.item_name || "名称未登録",
      personName: data.people?.name ? formatPersonName(data.people.name) : "",
      href: createGiftDetailUrl(data.id)
    };
  }
  if (kind === "birthday") {
    return {
      type: "birthday",
      title: `${data.name || "名前未登録"}の誕生日`,
      href: createPersonDetailUrl(data.person_id)
    };
  }
  return {
    type: normalizeEventType(data.event_type),
    title: data.title || "イベント",
    personName: (data.people?.name || data.related_person_name)
      ? formatPersonName(data.people?.name || data.related_person_name) : "",
    href: createEventDetailUrl(data.id)
  };
}

/* ========================================
   DAY DETAIL MODAL
======================================== */

function openScheduleDayModal(dateKey) {
  const modal = document.getElementById("scheduleDayModal");
  const title = document.getElementById("scheduleDayModalTitle");
  const container = document.getElementById("scheduleDayItems");

  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];

  title.textContent =
    `${year}年${month}月${day}日（${weekdays[date.getDay()]}）`;

  container.replaceChildren();

  const gifts = monthlyGifts.filter(
    gift => gift.gift_date === dateKey
  );

  const events = monthlyEvents.filter(
    event => event.display_date === dateKey
  );

  const birthdays = monthlyBirthdays.filter(
    birthday => birthday.display_date === dateKey
  );

  renderDateDetailCards(container, [
    ...gifts.map(gift => toSharedScheduleCard("gift", gift)),
    ...events.map(event => toSharedScheduleCard("event", event)),
    ...birthdays.map(birthday => toSharedScheduleCard("birthday", birthday))
  ]);

    // 選択日を登録画面へ引き継ぐ
  const returnUrl = createScheduleReturnUrl();

  const giftUrl =
    `../gifts/gifts.html?gift_date=${
      encodeURIComponent(dateKey)
    }`;

  const eventUrl =
    `../events/event.html?event_date=${
      encodeURIComponent(dateKey)
    }`;

  document.getElementById("scheduleDayGiftLink").href =
    buildUrlWithReturnTo(
      giftUrl,
      returnUrl
    );

  document.getElementById("scheduleDayEventLink").href =
    buildUrlWithReturnTo(
      eventUrl,
      returnUrl
    );

  modal.classList.remove("hidden");
  document.body.classList.add("schedule-modal-open");
}
