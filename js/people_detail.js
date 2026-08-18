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

    setupBasicInfoEdit();

    setupPreferenceEdit();

    setupGiftAddButton();

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

  renderBasicProfile();

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

  renderPreferenceInfo();

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
   GIFT ADD BUTTON
  ======================================== */

  function setupGiftAddButton() {

    const button =
      document.getElementById(
        "giftAddButton"
      );


    if (
      !button ||
      !currentPerson
    ) {
      return;
    }


    button.href =
      `gifts.html?person_id=${encodeURIComponent(
        currentPerson.id
      )}&return_to=${encodeURIComponent(
        `people_detail.html?id=${currentPerson.id}`
      )}`;

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

/* ========================================
   BASIC INFO EDIT
======================================== */

function setupBasicInfoEdit() {

  const openButton =
    document.getElementById(
      "basicInfoEditButton"
    );

  const modal =
    document.getElementById(
      "basicInfoEditModal"
    );

  const closeButton =
    document.getElementById(
      "basicInfoEditClose"
    );

  const cancelButton =
    document.getElementById(
      "basicInfoEditCancel"
    );

  const form =
    document.getElementById(
      "basicInfoEditForm"
    );


  if (
    !openButton ||
    !modal ||
    !form
  ) {
    return;
  }


  /* =========================
     OPEN
  ========================== */

  openButton.addEventListener(
    "click",
    () => {

      openBasicInfoEditModal();

    }
  );


  /* =========================
     CLOSE
  ========================== */

  closeButton.addEventListener(
    "click",
    closeBasicInfoEditModal
  );


  cancelButton.addEventListener(
    "click",
    closeBasicInfoEditModal
  );


  /* 背景タップ */

  modal.addEventListener(
    "click",
    event => {

      if (
        event.target === modal
      ) {

        closeBasicInfoEditModal();

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

        closeBasicInfoEditModal();

      }

    }
  );


  /* =========================
     SAVE
  ========================== */

  form.addEventListener(
    "submit",
    async event => {

      event.preventDefault();

      await saveBasicInfo();

    }
  );

}

/* ========================================
   OPEN BASIC INFO EDIT
======================================== */

function openBasicInfoEditModal() {

  const modal =
    document.getElementById(
      "basicInfoEditModal"
    );


  const nameInput =
    document.getElementById(
      "basicEditName"
    );


  const birthdayInput =
    document.getElementById(
      "basicEditBirthday"
    );


  const relationshipInput =
    document.getElementById(
      "basicEditRelationship"
    );


  const message =
    document.getElementById(
      "basicInfoEditMessage"
    );


  /*
    現在の値をフォームへセット
  */

  nameInput.value =
    currentPerson.name ?? "";


  birthdayInput.value =
    currentPerson.birthday ?? "";


  relationshipInput.value =
    currentPerson.relationship ?? "";


  message.textContent = "";

  message.className =
    "person-edit-message";


  modal.classList.remove(
    "hidden"
  );


  modal.setAttribute(
    "aria-hidden",
    "false"
  );


  document.body.style.overflow =
    "hidden";

}

/* ========================================
   CLOSE BASIC INFO EDIT
======================================== */

function closeBasicInfoEditModal() {

  const modal =
    document.getElementById(
      "basicInfoEditModal"
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

/* ========================================
   SAVE BASIC INFO
======================================== */

async function saveBasicInfo() {

  const nameInput =
    document.getElementById(
      "basicEditName"
    );


  const birthdayInput =
    document.getElementById(
      "basicEditBirthday"
    );


  const relationshipInput =
    document.getElementById(
      "basicEditRelationship"
    );


  const message =
    document.getElementById(
      "basicInfoEditMessage"
    );


  const saveButton =
    document.getElementById(
      "basicInfoEditSave"
    );


  /* =========================
     VALUES
  ========================== */

  const name =
    nameInput.value.trim();


  const birthday =
    birthdayInput.value;


  const relationship =
    relationshipInput.value;


  /* =========================
     VALIDATION
  ========================== */

  if (!name) {

    message.textContent =
      "名前を入力してください。";

    message.className =
      "person-edit-message error";

    return;

  }


  /* =========================
     SAVING
  ========================== */

  saveButton.disabled =
    true;


  saveButton.innerHTML = `

    <i class="fa-solid fa-spinner fa-spin"></i>

    保存中...

  `;


  message.textContent = "";


  /* =========================
     UPDATE
  ========================== */

  const { data, error } =
    await supabase
      .from("people")
      .update({

        name:
          name,

        birthday:
          birthday || null,

        relationship:
          relationship || null

      })
      .eq(
        "id",
        currentPerson.id
      )
      .select()
      .single();


  /* =========================
     ERROR
  ========================== */

  if (error) {

    console.error(
      "人物基本情報の更新に失敗しました:",
      error
    );


    message.textContent =
      "保存に失敗しました。";

    message.className =
      "person-edit-message error";


    resetBasicInfoSaveButton();

    return;

  }


  /* =========================
     SUCCESS
  ========================== */

  currentPerson =
    data;


  /*
    詳細画面を更新
  */

  renderBasicProfile();


  message.textContent =
    "保存しました。";


  message.className =
    "person-edit-message success";


  resetBasicInfoSaveButton();


  /*
    少しだけ成功表示を見せてから閉じる
  */

  setTimeout(
    () => {

      closeBasicInfoEditModal();

    },
    400
  );

}

/* ========================================
   BASIC PROFILE
======================================== */

function renderBasicProfile() {

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

}

/* ========================================
   RESET BASIC SAVE BUTTON
======================================== */

function resetBasicInfoSaveButton() {

  const saveButton =
    document.getElementById(
      "basicInfoEditSave"
    );


  saveButton.disabled =
    false;


  saveButton.textContent =
    "保存";

}

/* ========================================
   PREFERENCE EDIT
======================================== */

function setupPreferenceEdit() {

  const openButton =
    document.getElementById(
      "preferenceEditButton"
    );

  const modal =
    document.getElementById(
      "preferenceEditModal"
    );

  const closeButton =
    document.getElementById(
      "preferenceEditClose"
    );

  const cancelButton =
    document.getElementById(
      "preferenceEditCancel"
    );

  const form =
    document.getElementById(
      "preferenceEditForm"
    );


  if (
    !openButton ||
    !modal ||
    !form
  ) {
    return;
  }


  openButton.addEventListener(
    "click",
    openPreferenceEditModal
  );


  closeButton.addEventListener(
    "click",
    closePreferenceEditModal
  );


  cancelButton.addEventListener(
    "click",
    closePreferenceEditModal
  );


  modal.addEventListener(
    "click",
    event => {

      if (
        event.target === modal
      ) {

        closePreferenceEditModal();

      }

    }
  );


  form.addEventListener(
    "submit",
    async event => {

      event.preventDefault();

      await savePreferenceInfo();

    }
  );

}

function openPreferenceEditModal() {

  const modal =
    document.getElementById(
      "preferenceEditModal"
    );


  document
    .getElementById(
      "preferenceEditLikes"
    )
    .value =
      currentPerson.likes ?? "";


  document
    .getElementById(
      "preferenceEditDislikes"
    )
    .value =
      currentPerson.dislikes ?? "";


  setAllergyFormValues(
    currentPerson.allergies ?? ""
  );


  const message =
    document.getElementById(
      "preferenceEditMessage"
    );


  message.textContent = "";

  message.className =
    "person-edit-message";


  modal.classList.remove(
    "hidden"
  );


  modal.setAttribute(
    "aria-hidden",
    "false"
  );


  document.body.style.overflow =
    "hidden";

}

function closePreferenceEditModal() {

  const modal =
    document.getElementById(
      "preferenceEditModal"
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

function setAllergyFormValues(
  allergyText
) {

  const checkboxes =
    document.querySelectorAll(
      "#preferenceEditModal .allergy-checkbox-item input"
    );


  const otherInput =
    document.getElementById(
      "preferenceEditAllergyOther"
    );


  const knownAllergies =
    [
      "卵",
      "乳",
      "小麦",
      "えび",
      "かに",
      "そば",
      "落花生",
      "くるみ"
    ];


  const allergyItems =
    allergyText
      .split(",")
      .map(item =>
        item.trim()
      )
      .filter(Boolean);


  checkboxes.forEach(
    checkbox => {

      checkbox.checked =
        allergyItems.includes(
          checkbox.value
        );

    }
  );


  const otherItems =
    allergyItems.filter(
      item =>
        !knownAllergies.includes(
          item
        )
    );


  otherInput.value =
    otherItems.join(", ");

}

function buildAllergyText() {

  const checked =
    [
      ...document.querySelectorAll(
        "#preferenceEditModal .allergy-checkbox-item input:checked"
      )
    ]
      .map(
        checkbox =>
          checkbox.value
      );


  const other =
    document
      .getElementById(
        "preferenceEditAllergyOther"
      )
      .value
      .trim();


  if (other) {

    const otherItems =
      other
        .split(",")
        .map(item =>
          item.trim()
        )
        .filter(Boolean);


    checked.push(
      ...otherItems
    );

  }


  return checked.join(", ");

}

async function savePreferenceInfo() {

  const likes =
    document
      .getElementById(
        "preferenceEditLikes"
      )
      .value
      .trim();


  const dislikes =
    document
      .getElementById(
        "preferenceEditDislikes"
      )
      .value
      .trim();


  const allergies =
    buildAllergyText();


  const message =
    document.getElementById(
      "preferenceEditMessage"
    );


  const saveButton =
    document.getElementById(
      "preferenceEditSave"
    );


  saveButton.disabled = true;


  saveButton.innerHTML = `

    <i class="fa-solid fa-spinner fa-spin"></i>

    保存中...

  `;


  const { data, error } =
    await supabase
      .from("people")
      .update({

        likes:
          likes || null,

        dislikes:
          dislikes || null,

        allergies:
          allergies || null

      })
      .eq(
        "id",
        currentPerson.id
      )
      .select()
      .single();


  if (error) {

    console.error(
      "好み情報の更新に失敗しました:",
      error
    );


    message.textContent =
      "保存に失敗しました。";


    message.className =
      "person-edit-message error";


    resetPreferenceSaveButton();

    return;

  }


  currentPerson =
    data;


  renderPreferenceInfo();


  message.textContent =
    "保存しました。";


  message.className =
    "person-edit-message success";


  resetPreferenceSaveButton();


  setTimeout(
    () => {

      closePreferenceEditModal();

    },
    400
  );

}

function renderPreferenceInfo() {

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

}

function resetPreferenceSaveButton() {

  const saveButton =
    document.getElementById(
      "preferenceEditSave"
    );


  saveButton.disabled =
    false;


  saveButton.textContent =
    "保存";

}