/* Import */
import { supabase } from "../common/supabase.js";
import {
  getInitialDate,
  isValidDateString
} from "../common/date_utils.js";
import {
  getReturnUrl
} from "../common/navigation.js";


/* ========================================
   STATE
======================================== */

let editingEventId = null;

/* ========================================
   INITIALIZE
======================================== */

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    setupReturnButtons();

    setupInitialDate();

    await loadPeople();

    setupPersonMode();

    setupEventTypeBehavior();


    editingEventId =
      getUrlParameter(
        "event_id"
      );


    if (editingEventId) {

      await loadEventForEdit(
        editingEventId
      );

    }


    setupEventForm();

  }
);



/* ========================================
   URL PARAMETERS
======================================== */

function getUrlParameter(
  name
) {

  const params =
    new URLSearchParams(
      window.location.search
    );


  return params.get(
    name
  );

}


/* ========================================
   RETURN BUTTONS
======================================== */

function setupReturnButtons() {

  const backButton =
    document.getElementById(
      "eventBackButton"
    );


  const closeButton =
    document.getElementById(
      "eventCloseButton"
    );


  const returnTo =
    getReturnUrl() || "../index.html";


  if (backButton) {

    backButton.href =
      returnTo;

  }


  if (closeButton) {

    closeButton.href =
      returnTo;

  }

}

/* ========================================
   INITIAL DATE
======================================== */

function setupInitialDate() {

  const dateInput =
    document.getElementById("eventDate");

  if (!dateInput) {
    return;
  }

  dateInput.value = getInitialDate(
    new URLSearchParams(window.location.search),
    ["event_date", "date"]
  );
}


/* ========================================
   LOAD PEOPLE
======================================== */

async function loadPeople() {

  const select =
    document.getElementById(
      "eventPersonSelect"
    );


  if (!select) {
    return;
  }


  const { data, error } =
    await supabase
      .from("people")
      .select(`
        id,
        name
      `)
      .order(
        "name",
        {
          ascending: true
        }
      );


  if (error) {

    console.error(
      "人物一覧の取得に失敗しました:",
      error
    );


    showMessage(
      "人物一覧を取得できませんでした。",
      "error"
    );


    return;

  }


  const people =
    data ?? [];


  people.forEach(
    person => {

      const option =
        document.createElement(
          "option"
        );


      option.value =
        person.id;


      option.textContent =
        person.name;


      select.appendChild(
        option
      );

    }
  );

}


/* ========================================
   LOAD EVENT FOR EDIT
======================================== */

async function loadEventForEdit(
  eventId
) {

  const { data, error } =
    await supabase
      .from("events")
      .select(`
        id,
        event_type,
        title,
        event_date,
        person_id,
        related_person_name,
        is_yearly,
        memo
      `)
      .eq(
        "id",
        eventId
      )
      .maybeSingle();


  if (
    error ||
    !data
  ) {

    console.error(
      "編集するイベントを取得できませんでした:",
      error
    );


    showMessage(
      "編集するイベントを取得できませんでした。",
      "error"
    );


    disableEventForm();

    return;

  }


  applyEditPageTitle();


  /*
    イベント種別
  */

  const eventTypeInput =
    document.querySelector(
      `input[name="eventType"][value="${data.event_type}"]`
    );


  if (eventTypeInput) {
    eventTypeInput.checked = true;
  } else if (data.event_type === "gift") {
    // 過去の「プレゼント予定」は編集時だけ選択肢を復元する
    const grid = document.querySelector(".event-type-grid");
    const label = document.createElement("label");
    label.className = "event-type-option";
    label.innerHTML = '<input type="radio" name="eventType" value="gift" checked>' +
      '<span class="event-type-button gift"><i class="fa-solid fa-gift"></i><span>プレゼント予定（既存）</span></span>';
    grid.appendChild(label);
    label.querySelector("input").addEventListener("change", updateEventTypeBehavior);
  }


  /*
    基本情報
  */

  document.getElementById(
    "eventTitle"
  ).value =
    data.title ?? "";


  document.getElementById(
    "eventDate"
  ).value =
    data.event_date ?? "";


  document.getElementById(
    "eventMemo"
  ).value =
    data.memo ?? "";


  document.getElementById(
    "eventIsYearly"
  ).checked =
    Boolean(
      data.is_yearly
    );


  /*
    関連人物
  */

  if (data.person_id) {

    const registeredMode =
      document.querySelector(
        'input[name="personMode"][value="registered"]'
      );


    registeredMode.checked =
      true;


    document.getElementById(
      "eventPersonSelect"
    ).value =
      data.person_id;

  } else if (
    data.related_person_name
  ) {

    const freeMode =
      document.querySelector(
        'input[name="personMode"][value="free"]'
      );


    freeMode.checked =
      true;


    document.getElementById(
      "eventPersonName"
    ).value =
      data.related_person_name;

  } else {

    /*
      人物との関連がない既存イベントは、
      「登録済み人物・人物を選択しない」
      として扱う
    */

    const registeredMode =
      document.querySelector(
        'input[name="personMode"][value="registered"]'
      );


    registeredMode.checked =
      true;


    document.getElementById(
      "eventPersonSelect"
    ).value =
      "";

  }


  /*
    選択内容を画面へ反映
  */

  updatePersonMode();
  updateEventTypeBehavior(true);

}

function applyEditPageTitle() {

  const pageTitle =
    document.getElementById(
      "eventPageTitle"
    );


  const submitButton =
    document.getElementById(
      "eventSubmitButton"
    );


  if (pageTitle) {

    pageTitle.textContent =
      "イベントを編集";

  }


  if (submitButton) {

    submitButton.textContent =
      "変更を保存";

  }


  document.title =
    "イベントを編集 | Gift Memory";

}

function disableEventForm() {

  const form =
    document.getElementById(
      "eventForm"
    );


  if (!form) {
    return;
  }


  const controls =
    form.querySelectorAll(
      "input, select, textarea, button"
    );


  controls.forEach(control => {

    control.disabled =
      true;

  });

}

/* ========================================
   PERSON INPUT MODE
======================================== */

function setupPersonMode() {

  const modeInputs =
    document.querySelectorAll(
      'input[name="personMode"]'
    );


  modeInputs.forEach(input => {

    input.addEventListener(
      "change",
      updatePersonMode
    );

  });


  updatePersonMode();

}


function updatePersonMode() {

  const mode =
    getSelectedPersonMode();


  const freeField =
    document.getElementById(
      "eventFreePersonField"
    );


  const registeredField =
    document.getElementById(
      "eventRegisteredPersonField"
    );


  const freeInput =
    document.getElementById(
      "eventPersonName"
    );


  const personSelect =
    document.getElementById(
      "eventPersonSelect"
    );


  const isFree =
    mode === "free";


  const isRegistered =
    mode === "registered";


  freeField.classList.toggle(
    "hidden",
    !isFree
  );


  registeredField.classList.toggle(
    "hidden",
    !isRegistered
  );


  freeInput.disabled =
    !isFree;


  personSelect.disabled =
    !isRegistered;

}


function getSelectedPersonMode() {

  return (
    document.querySelector(
      'input[name="personMode"]:checked'
    )?.value || ""
  );

}

/* ========================================
   EVENT TYPE BEHAVIOR
======================================== */

let previousEventType = "";
let celebrationAutoTitle = "";

function setupEventTypeBehavior() {
  document.querySelectorAll('input[name="eventType"]').forEach(input => {
    input.addEventListener("change", () => updateEventTypeBehavior());
  });

  document.getElementById("eventCelebrationType").addEventListener("change", event => {
    const titleInput = document.getElementById("eventTitle");
    const selected = event.target.value;
    if (selected && selected !== "other") {
      titleInput.value = selected;
      celebrationAutoTitle = selected;
    } else if (titleInput.value === celebrationAutoTitle) {
      titleInput.value = "";
      celebrationAutoTitle = "";
    }
  });

  document.getElementById("eventTitle").addEventListener("input", () => {
    celebrationAutoTitle = "";
  });

  document.getElementById("eventPersonName").addEventListener("input", updateBirthdayTitle);
  document.getElementById("eventPersonSelect").addEventListener("change", updateBirthdayTitle);
  document.querySelectorAll('input[name="personMode"]').forEach(input => {
    input.addEventListener("change", updateBirthdayTitle);
  });

  updateEventTypeBehavior();
}

function getBirthdayTitle() {
  const mode = getSelectedPersonMode();
  if (mode === "free") {
    const name = document.getElementById("eventPersonName").value.trim();
    return name ? `${name}の誕生日` : "誕生日";
  }
  if (mode === "registered") {
    const select = document.getElementById("eventPersonSelect");
    const name = select.value ? select.selectedOptions[0]?.textContent.trim() : "";
    return name ? `${name}${name.endsWith("さん") ? "" : "さん"}の誕生日` : "誕生日";
  }
  return "誕生日";
}

function updateBirthdayTitle() {
  if (getSelectedEventType() === "birthday") {
    document.getElementById("eventTitle").value = getBirthdayTitle();
  }
}

function updateEventTypeBehavior(isEditingLoad = false) {
  const eventType = getSelectedEventType();
  const titleInput = document.getElementById("eventTitle");
  const celebrationSelect = document.getElementById("eventCelebrationType");
  const yearlyCheckbox = document.getElementById("eventIsYearly");
  const typeChanged = previousEventType !== eventType;

  celebrationSelect.disabled = eventType !== "celebration";
  titleInput.readOnly = eventType === "birthday";
  titleInput.required = eventType !== "birthday";
  titleInput.classList.toggle("event-input-readonly", eventType === "birthday");

  if (isEditingLoad && eventType === "celebration") {
    const options = [...celebrationSelect.options].map(option => option.value);
    celebrationSelect.value = options.includes(titleInput.value) ? titleInput.value : "other";
  } else if (typeChanged) {
    celebrationSelect.value = "";
    celebrationAutoTitle = "";
  }

  if (eventType === "birthday") {
    updateBirthdayTitle();
  } else if (typeChanged && previousEventType === "birthday") {
    titleInput.value = "";
  }

  if (typeChanged && !isEditingLoad && eventType) {
    yearlyCheckbox.checked = eventType === "birthday" || eventType === "anniversary";
  }
  yearlyCheckbox.disabled = false;
  previousEventType = eventType;
}


/* ========================================
   EVENT FORM
======================================== */

function setupEventForm() {

  const form =
    document.getElementById(
      "eventForm"
    );


  if (!form) {
    return;
  }


  form.addEventListener(
    "submit",
    async event => {

      event.preventDefault();


      if (!validateEventForm()) {
        return;
      }


      await saveEvent();

    }
  );

}


/* ========================================
   VALIDATE EVENT FORM
======================================== */

function validateEventForm() {

  const eventType =
    getSelectedEventType();


  const title =
    document
      .getElementById(
        "eventTitle"
      )
      ?.value
      .trim() || "";


  const eventDate =
    document
      .getElementById(
        "eventDate"
      )
      ?.value || "";


  const personMode =
    getSelectedPersonMode();


  const freePersonName =
    document
      .getElementById(
        "eventPersonName"
      )
      ?.value
      .trim() || "";


  const registeredPersonId =
    document
      .getElementById(
        "eventPersonSelect"
      )
      ?.value || "";


  if (!eventType) {

    showMessage(
      "イベント種別を選択してください。",
      "error"
    );

    return false;

  }


  if (!title && eventType !== "birthday") {

    showMessage(
      "イベント名を入力してください。",
      "error"
    );

    return false;

  }


  if (
    !eventDate ||
    !isValidDateString(
      eventDate
    )
  ) {

    showMessage(
      "正しい日付を入力してください。",
      "error"
    );

    return false;

  }


  if (
    personMode === "free" &&
    !freePersonName &&
    eventType !== "birthday"
  ) {

    showMessage(
      "自由入力する人物名を入力してください。",
      "error"
    );

    return false;

  }


  // 人物の関連付けは任意。誕生日は名前なしでも登録できる。

  showMessage(
    "",
    "error"
  );


  return true;

}


/* ========================================
   SAVE EVENT
======================================== */

async function saveEvent() {

  const submitButton =
    document.getElementById(
      "eventSubmitButton"
    );


  const eventType =
    getSelectedEventType();


  const title = eventType === "birthday"
    ? getBirthdayTitle()
    : document.getElementById("eventTitle").value.trim();


  const eventDate =
    document
      .getElementById(
        "eventDate"
      )
      .value;


  const personMode =
    getSelectedPersonMode();


  const selectedPersonId =
    document
      .getElementById(
        "eventPersonSelect"
      )
      .value;


  const freePersonName =
    document
      .getElementById(
        "eventPersonName"
      )
      .value
      .trim();


  const isYearly = document.getElementById("eventIsYearly").checked;


  const memo =
    document
      .getElementById(
        "eventMemo"
      )
      .value
      .trim();


  const personId =
    personMode === "registered"
      ? selectedPersonId || null
      : null;


  const relatedPersonName =
    personMode === "free"
      ? freePersonName || null
      : null;


  setSubmitState(
    submitButton,
    true
  );


  const eventData = {

    event_type:
      eventType,

    title:
      title,

    event_date:
      eventDate,

    person_id:
      personId,

    related_person_name:
      relatedPersonName,

    is_yearly:
      isYearly,

    memo:
      memo || null

  };


  let saveResult;


  if (editingEventId) {

    saveResult =
      await supabase
        .from("events")
        .update(
          eventData
        )
        .eq(
          "id",
          editingEventId
        );

  } else {

    saveResult =
      await supabase
        .from("events")
        .insert(
          eventData
        );

  }


const { error } =
  saveResult;


  if (error) {

    console.error(
      "イベント登録に失敗しました:",
      error
    );


    showMessage(
      "イベントを登録できませんでした。",
      "error"
    );


    setSubmitState(
      submitButton,
      false
    );


    return;

  }


  showMessage(
  editingEventId
    ? "イベントを更新しました。"
    : "イベントを登録しました。",
  "success"
);


  window.setTimeout(
    () => {

      window.location.href =
        getReturnUrl() || "../index.html";

    },
    700
  );

}


/* ========================================
   SELECTED EVENT TYPE
======================================== */

function getSelectedEventType() {

  return (
    document.querySelector(
      'input[name="eventType"]:checked'
    )?.value || ""
  );

}


/* ========================================
   SUBMIT STATE
======================================== */

function setSubmitState(
  button,
  isSubmitting
) {

  if (!button) {
    return;
  }


  button.disabled =
    isSubmitting;


  if (isSubmitting) {

    button.textContent =
      editingEventId
        ? "保存しています..."
        : "登録しています...";

    return;

  }


  button.textContent =
    editingEventId
      ? "変更を保存"
      : "イベントを登録";

}


/* ========================================
   MESSAGE
======================================== */

function showMessage(
  text,
  type
) {

  const message =
    document.getElementById(
      "eventFormMessage"
    );


  if (!message) {
    return;
  }


  message.textContent =
    text;


  message.classList.toggle(
    "success",
    type === "success"
  );

}
