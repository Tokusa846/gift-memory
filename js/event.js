/* Import */
import { supabase } from "./supabase.js";


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
    getSafeReturnUrl(
      getUrlParameter(
        "return_to"
      )
    ) || "index.html";


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
   SAFE RETURN URL
======================================== */

function getSafeReturnUrl(
  returnTo
) {

  if (!returnTo) {
    return null;
  }


  try {

    const url =
      new URL(
        returnTo,
        window.location.href
      );


    if (
      url.origin !==
      window.location.origin
    ) {

      return null;

    }


    return (
      url.pathname
        .split("/")
        .pop() +
      url.search +
      url.hash
    );

  } catch (error) {

    console.error(
      "戻り先URLを確認できませんでした:",
      error
    );


    return null;

  }

}


/* ========================================
   INITIAL DATE
======================================== */

function setupInitialDate() {

  const dateInput =
    document.getElementById(
      "eventDate"
    );


  if (!dateInput) {
    return;
  }


  const dateFromUrl =
    getUrlParameter(
      "date"
    );


  if (
    dateFromUrl &&
    isValidDateString(
      dateFromUrl
    )
  ) {

    dateInput.value =
      dateFromUrl;

    return;

  }


  dateInput.value =
    formatDateForInput(
      new Date()
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

function setupEventTypeBehavior() {

  const eventTypeInputs =
    document.querySelectorAll(
      'input[name="eventType"]'
    );


  eventTypeInputs.forEach(input => {

    input.addEventListener(
      "change",
      updateEventTypeBehavior
    );

  });


  updateEventTypeBehavior();

}


function updateEventTypeBehavior() {

  const eventType =
    getSelectedEventType();


  const yearlyCheckbox =
    document.getElementById(
      "eventIsYearly"
    );


  if (!yearlyCheckbox) {
    return;
  }


  const isBirthday =
    eventType === "birthday";


  if (isBirthday) {

    yearlyCheckbox.dataset.previousChecked =
      yearlyCheckbox.checked
        ? "true"
        : "false";


    yearlyCheckbox.checked =
      true;


    yearlyCheckbox.disabled =
      true;

  } else {

    if (
      yearlyCheckbox.disabled
    ) {

      yearlyCheckbox.checked =
        yearlyCheckbox.dataset
          .previousChecked === "true";

    }


    yearlyCheckbox.disabled =
      false;

  }

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


  if (!title) {

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
    !freePersonName
  ) {

    showMessage(
      "自由入力する人物名を入力してください。",
      "error"
    );

    return false;

  }


  if (
    eventType === "birthday" &&
    personMode === "registered" &&
    !registeredPersonId
  ) {

    showMessage(
      "誕生日を登録する人物を選択してください。",
      "error"
    );

    return false;

  }

  if (!personMode) {

    showMessage(
     "人物の入力方法を選択してください。",
     "error"
    );

     return false;

}


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


  const title =
    document
      .getElementById(
        "eventTitle"
      )
      .value
      .trim();


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


  const isYearly =
    eventType === "birthday" ||
    document
      .getElementById(
        "eventIsYearly"
      )
      .checked;


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


  const { error } =
    await supabase
      .from("events")
      .insert({

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

      });


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
    "イベントを登録しました。",
    "success"
  );


  window.setTimeout(
    () => {

      window.location.href =
        getSafeReturnUrl(
          getUrlParameter(
            "return_to"
          )
        ) || "index.html";

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


  button.textContent =
    isSubmitting
      ? "登録しています..."
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


/* ========================================
   DATE UTILITIES
======================================== */

function isValidDateString(
  value
) {

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      value
    )
  ) {

    return false;

  }


  const date =
    new Date(
      `${value}T00:00:00`
    );


  return (
    !Number.isNaN(
      date.getTime()
    ) &&
    formatDateForInput(
      date
    ) === value
  );

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