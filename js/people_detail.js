/* Import */
import { supabase } from "./supabase.js";
import {
  openModal,
  closeModal,
  setupModalClose,
  setupModalEscape
} from "./common/modal.js";


/* ========================================
   STATE
======================================== */

let currentPerson = null;

let giftLogs = [];

let memoLogs = [];

let editingMemoId = null;


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

    await loadMemoLogs(
      personId
    );

    renderPersonDetail();

    setupBasicInfoEdit();

    setupPreferenceEdit();

    setupGiftAddButton();

    setupMemoAdd();

    setupMemoEdit();

    setupModalEscape();
    
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

  renderMemoList();


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

  const visibleGifts =
    giftLogs.slice(
      0,
      3
    );


  container.innerHTML =
    visibleGifts
      .map(gift =>
        createGiftItemHtml(
          gift
        )
      )
      .join("");

  if (
    giftLogs.length > 3
  ) {

    container.innerHTML += `
      <a
        class="person-detail-more-button"
        href="gift_history.html?person_id=${encodeURIComponent(
          currentPerson.id
        )}"
      >
        もっと見る…
      </a>
    `;

  }

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

      <a
        class="person-detail-gift-menu"
        href="gifts.html?gift_id=${encodeURIComponent(
          gift.id
        )}&return_to=${encodeURIComponent(
          `people_detail.html?id=${currentPerson.id}`
        )}"
        aria-label="プレゼントを編集"
      >
        <i class="fa-solid fa-ellipsis-vertical"></i>
      </a>

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


  const form =
    document.getElementById(
      "basicInfoEditForm"
    );


  if (
    !openButton ||
    !form
  ) {
    return;
  }


  /* OPEN */

  openButton.addEventListener(
    "click",
    openBasicInfoEditModal
  );


  /* CLOSE */

  setupModalClose(
    "basicInfoEditModal",
    "basicInfoEditClose",
    "basicInfoEditCancel"
  );


  /* SAVE */

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


  /*　現在の値をフォームへセット　*/
  nameInput.value =
    currentPerson.name ?? "";

  birthdayInput.value =
    currentPerson.birthday ?? "";

  relationshipInput.value =
    currentPerson.relationship ?? "";

  message.textContent = "";

  message.className =
    "person-edit-message";
  
  openModal(
  "basicInfoEditModal"
  );

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

      closeModal(
         "basicInfoEditModal"
      );

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


  const form =
    document.getElementById(
      "preferenceEditForm"
    );


  if (
    !openButton ||
    !form
  ) {
    return;
  }


  /* OPEN */

  openButton.addEventListener(
    "click",
    openPreferenceEditModal
  );


  /* CLOSE */

  setupModalClose(
    "preferenceEditModal",
    "preferenceEditClose",
    "preferenceEditCancel"
  );


  /* SAVE */

  form.addEventListener(
    "submit",
    async event => {

      event.preventDefault();

      await savePreferenceInfo();

    }
  );

}

function openPreferenceEditModal() {

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
  
  openModal(
    "preferenceEditModal"
  );

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

      closeModal(
        "preferenceEditModal"
      );
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

/* ========================================
   LOAD MEMOS
======================================== */

async function loadMemoLogs(
  personId
) {

  const { data, error } =
    await supabase
      .from("person_memos")
      .select(`
        id,
        person_id,
        content,
        created_at,
        updated_at
      `)
      .eq(
        "person_id",
        personId
      )
      .order(
        "created_at",
        {
          ascending: false
        }
      );


  if (error) {

    console.error(
      "メモ情報の取得に失敗しました:",
      error
    );

    memoLogs = [];

    return;

  }


  memoLogs =
    data ?? [];

}

/* ========================================
   MEMO LIST
======================================== */

function renderMemoList() {

  const container =
    document.getElementById(
      "detailMemoList"
    );


  if (!container) {
    return;
  }


  if (
    memoLogs.length === 0
  ) {

    container.innerHTML = `
      <div class="person-detail-memo-empty">
        メモはありません
      </div>
    `;

    return;

  }

  const visibleMemos =
    memoLogs.slice(
      0,
      3
    );


  container.innerHTML =
    visibleMemos
      .map(
        memo =>
          createMemoItemHtml(
            memo
          )
      )
      .join("");

   if (
    memoLogs.length > 3
  ) {

    container.innerHTML += `
      <a
        class="person-detail-more-button"
        href="memo_history.html?person_id=${encodeURIComponent(
          currentPerson.id
        )}"
      >
        もっと見る…
      </a>
    `;

  }

}

function createMemoItemHtml(
  memo
) {

  return `

    <article class="person-detail-memo-item">

      <div class="person-detail-memo-content">

        <p>${escapeHtml(memo.content)}</p>

        <time>
          ${formatMemoDate(
            memo.created_at
          )}
        </time>

      </div>

      <button
        type="button"
        class="person-detail-memo-menu"
        data-memo-id="${memo.id}"
        aria-label="メモを編集"
      >
        <i class="fa-solid fa-ellipsis-vertical"></i>
      </button>

    </article>

  `;

}

function formatMemoDate(
  dateString
) {

  if (!dateString) {
    return "";
  }


  const date =
    new Date(
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


  return `${year}.${month}.${day}`;

}

/* ========================================
   MEMO ADD
======================================== */

function setupMemoAdd() {

  const openButton =
    document.getElementById(
      "memoAddButton"
    );


  const form =
    document.getElementById(
      "memoAddForm"
    );


  if (
    !openButton ||
    !form
  ) {
    return;
  }


  /* OPEN */

  openButton.addEventListener(
    "click",
    openMemoAddModal
  );


  /* CLOSE */

  setupModalClose(
    "memoAddModal",
    "memoAddClose",
    "memoAddCancel"
  );


  /* SAVE */

  form.addEventListener(
    "submit",
    async event => {

      event.preventDefault();

      await saveNewMemo();

    }
  );

}

function openMemoAddModal() {

  const input =
    document.getElementById(
      "memoAddContent"
    );


  const message =
    document.getElementById(
      "memoAddMessage"
    );


  input.value = "";

  message.textContent = "";

  message.className =
    "person-edit-message";


  openModal(
    "memoAddModal"
  );


  input.focus();

}

async function saveNewMemo() {

  const input =
    document.getElementById(
      "memoAddContent"
    );


  const message =
    document.getElementById(
      "memoAddMessage"
    );


  const saveButton =
    document.getElementById(
      "memoAddSave"
    );


  const content =
    input.value.trim();


  if (!content) {

    message.textContent =
      "メモを入力してください。";

    message.className =
      "person-edit-message error";

    return;

  }


  saveButton.disabled =
    true;


  saveButton.innerHTML = `
    <i class="fa-solid fa-spinner fa-spin"></i>
    追加中...
  `;


  const { data, error } =
    await supabase
      .from("person_memos")
      .insert([
        {
          person_id:
            currentPerson.id,

          content:
            content
        }
      ])
      .select(`
        id,
        person_id,
        content,
        created_at,
        updated_at
      `)
      .single();


  if (error) {

    console.error(
      "メモ追加に失敗しました:",
      error
    );


    message.textContent =
      "メモの追加に失敗しました。";


    message.className =
      "person-edit-message error";


    resetMemoAddButton();

    return;

  }


  /* 新しいメモを先頭に追加 */

  memoLogs.unshift(
    data
  );


  renderMemoList();


  message.textContent =
    "メモを追加しました。";


  message.className =
    "person-edit-message success";


  resetMemoAddButton();


  setTimeout(
    () => {

      closeModal(
        "memoAddModal"
      );

    },
    400
  );

}

function resetMemoAddButton() {

  const saveButton =
    document.getElementById(
      "memoAddSave"
    );


  saveButton.disabled =
    false;


  saveButton.textContent =
    "追加";

}

/* ========================================
   MEMO EDIT
======================================== */

function setupMemoEdit() {

  const memoList =
    document.getElementById(
      "detailMemoList"
    );


  const form =
    document.getElementById(
      "memoEditForm"
    );


  if (
    !memoList ||
    !form
  ) {
    return;
  }


  /* 「…」押下 */

  memoList.addEventListener(
    "click",
    event => {

      const menuButton =
        event.target.closest(
          ".person-detail-memo-menu"
        );


      if (!menuButton) {
        return;
      }


      const memoId =
        menuButton.dataset.memoId;


      openMemoEditModal(
        memoId
      );

    }
  );


  /* CLOSE */

  setupModalClose(
    "memoEditModal",
    "memoEditClose",
    "memoEditCancel"
  );


  /* SAVE */

  form.addEventListener(
    "submit",
    async event => {

      event.preventDefault();

      await saveEditedMemo();

    }
  );

}

/* 編集モーダルを開く */
function openMemoEditModal(
  memoId
) {

  const memo =
    memoLogs.find(
      item =>
        String(item.id) ===
        String(memoId)
    );


  if (!memo) {

    console.error(
      "編集対象のメモが見つかりません:",
      memoId
    );

    return;

  }


  editingMemoId =
    memo.id;


  const input =
    document.getElementById(
      "memoEditContent"
    );


  const message =
    document.getElementById(
      "memoEditMessage"
    );


  input.value =
    memo.content ?? "";


  message.textContent = "";

  message.className =
    "person-edit-message";


  openModal(
    "memoEditModal"
  );


  input.focus();

}


/* SupabaseのUPDATE処理 */
async function saveEditedMemo() {

  if (!editingMemoId) {
    return;
  }


  const input =
    document.getElementById(
      "memoEditContent"
    );


  const message =
    document.getElementById(
      "memoEditMessage"
    );


  const saveButton =
    document.getElementById(
      "memoEditSave"
    );


  const content =
    input.value.trim();


  if (!content) {

    message.textContent =
      "メモを入力してください。";

    message.className =
      "person-edit-message error";

    return;

  }


  saveButton.disabled =
    true;


  saveButton.innerHTML = `
    <i class="fa-solid fa-spinner fa-spin"></i>
    保存中...
  `;


  const { data, error } =
    await supabase
      .from("person_memos")
      .update({
        content:
          content,

        updated_at:
          new Date().toISOString()
      })
      .eq(
        "id",
        editingMemoId
      )
      .select(`
        id,
        person_id,
        content,
        created_at,
        updated_at
      `)
      .single();


  if (error) {

    console.error(
      "メモ更新に失敗しました:",
      error
    );


    message.textContent =
      "メモの更新に失敗しました。";


    message.className =
      "person-edit-message error";


    resetMemoEditButton();

    return;

  }


  const memoIndex =
    memoLogs.findIndex(
      memo =>
        String(memo.id) ===
        String(editingMemoId)
    );


  if (
    memoIndex !== -1
  ) {

    memoLogs[memoIndex] =
      data;

  }


  renderMemoList();


  message.textContent =
    "メモを更新しました。";


  message.className =
    "person-edit-message success";


  resetMemoEditButton();


  setTimeout(
    () => {

      closeModal(
        "memoEditModal"
      );


      editingMemoId =
        null;

    },
    400
  );

}

/* 保存ボタンを戻す*/
function resetMemoEditButton() {

  const saveButton =
    document.getElementById(
      "memoEditSave"
    );


  saveButton.disabled =
    false;


  saveButton.textContent =
    "保存";

}