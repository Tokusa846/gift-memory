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


    await loadMemoLogs(
      personId
    );


    renderMemoHistory();

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
   RENDER
======================================== */

function renderMemoHistory() {

  renderPersonInfo();

  renderMemoList();

  setupBackLink();


  const loading =
    document.getElementById(
      "memoHistoryLoading"
    );


  const content =
    document.getElementById(
      "memoHistoryContent"
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
    "memoHistoryAvatar",
    getPersonInitial(
      currentPerson.name
    )
  );


  setText(
    "memoHistoryName",
    currentPerson.name ||
      "名称未登録"
  );


  const nameKana =
    document.getElementById(
      "memoHistoryNameKana"
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
   MEMO LIST
======================================== */

function renderMemoList() {

  const container =
    document.getElementById(
      "memoHistoryList"
    );


  if (!container) {
    return;
  }


  if (
    memoLogs.length === 0
  ) {

    container.innerHTML = `

      <div class="memo-history-empty">

        <i class="fa-regular fa-note-sticky"></i>

        <p>
          メモはありません
        </p>

      </div>

    `;

    return;

  }


  container.innerHTML =
    memoLogs
      .map(
        memo =>
          createMemoItemHtml(
            memo
          )
      )
      .join("");

}


/* ========================================
   MEMO ITEM
======================================== */

function createMemoItemHtml(
  memo
) {

  return `

    <article class="memo-history-item">

      <div class="memo-history-item-content">

        <p>${escapeHtml(memo.content)}</p>

        <time>
          ${formatMemoDate(
            memo.created_at
          )}
        </time>

      </div>


      <button
        type="button"
        class="memo-history-menu"
        data-memo-id="${escapeHtml(
          memo.id
        )}"
        aria-label="メモを編集"
      >
        <i class="fa-solid fa-ellipsis-vertical"></i>
      </button>

    </article>

  `;

}


/* ========================================
   BACK LINK
======================================== */

function setupBackLink() {

  const backLink =
    document.getElementById(
      "memoHistoryBack"
    );


  if (
    !backLink ||
    !currentPerson
  ) {
    return;
  }


  backLink.href =
    `people_detail.html?id=${
      encodeURIComponent(
        currentPerson.id
      )
    }`;

}


/* ========================================
   MEMO ADD
======================================== */

function setupMemoAdd() {

  const openButton =
    document.getElementById(
      "memoHistoryAddButton"
    );


  const form =
    document.getElementById(
      "memoHistoryAddForm"
    );


  if (
    !openButton ||
    !form
  ) {
    return;
  }


  openButton.addEventListener(
    "click",
    openMemoAddModal
  );


  setupModalClose(
    "memoHistoryAddModal",
    "memoHistoryAddClose",
    "memoHistoryAddCancel"
  );


  form.addEventListener(
    "submit",
    async event => {

      event.preventDefault();

      await saveNewMemo();

    }
  );

}


/* ========================================
   OPEN ADD MODAL
======================================== */

function openMemoAddModal() {

  const input =
    document.getElementById(
      "memoHistoryAddContent"
    );


  const message =
    document.getElementById(
      "memoHistoryAddMessage"
    );


  input.value = "";

  message.textContent = "";

  message.className =
    "memo-history-message";


  openModal(
    "memoHistoryAddModal"
  );


  input.focus();

}


/* ========================================
   SAVE NEW MEMO
======================================== */

async function saveNewMemo() {

  const input =
    document.getElementById(
      "memoHistoryAddContent"
    );


  const message =
    document.getElementById(
      "memoHistoryAddMessage"
    );


  const saveButton =
    document.getElementById(
      "memoHistoryAddSave"
    );


  const content =
    input.value.trim();


  if (!content) {

    message.textContent =
      "メモを入力してください。";


    message.className =
      "memo-history-message error";


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
      "memo-history-message error";


    resetMemoAddButton();

    return;

  }


  memoLogs.unshift(
    data
  );


  renderMemoList();


  message.textContent =
    "メモを追加しました。";


  message.className =
    "memo-history-message success";


  resetMemoAddButton();


  setTimeout(
    () => {

      closeModal(
        "memoHistoryAddModal"
      );

    },
    400
  );

}


/* ========================================
   RESET ADD BUTTON
======================================== */

function resetMemoAddButton() {

  const saveButton =
    document.getElementById(
      "memoHistoryAddSave"
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
      "memoHistoryList"
    );


  const form =
    document.getElementById(
      "memoHistoryEditForm"
    );


  if (
    !memoList ||
    !form
  ) {
    return;
  }


  memoList.addEventListener(
    "click",
    event => {

      const menuButton =
        event.target.closest(
          ".memo-history-menu"
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


  setupModalClose(
    "memoHistoryEditModal",
    "memoHistoryEditClose",
    "memoHistoryEditCancel"
  );


  form.addEventListener(
    "submit",
    async event => {

      event.preventDefault();

      await saveEditedMemo();

    }
  );

}


/* ========================================
   OPEN EDIT MODAL
======================================== */

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
      "memoHistoryEditContent"
    );


  const message =
    document.getElementById(
      "memoHistoryEditMessage"
    );


  input.value =
    memo.content ?? "";


  message.textContent = "";

  message.className =
    "memo-history-message";


  openModal(
    "memoHistoryEditModal"
  );


  input.focus();

}


/* ========================================
   SAVE EDITED MEMO
======================================== */

async function saveEditedMemo() {

  if (!editingMemoId) {
    return;
  }


  const input =
    document.getElementById(
      "memoHistoryEditContent"
    );


  const message =
    document.getElementById(
      "memoHistoryEditMessage"
    );


  const saveButton =
    document.getElementById(
      "memoHistoryEditSave"
    );


  const content =
    input.value.trim();


  if (!content) {

    message.textContent =
      "メモを入力してください。";


    message.className =
      "memo-history-message error";


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
      "memo-history-message error";


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
    "memo-history-message success";


  resetMemoEditButton();


  setTimeout(
    () => {

      closeModal(
        "memoHistoryEditModal"
      );


      editingMemoId =
        null;

    },
    400
  );

}


/* ========================================
   RESET EDIT BUTTON
======================================== */

function resetMemoEditButton() {

  const saveButton =
    document.getElementById(
      "memoHistoryEditSave"
    );


  saveButton.disabled =
    false;


  saveButton.textContent =
    "保存";

}


/* ========================================
   DATE
======================================== */

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
   ERROR
======================================== */

function showError() {

  const loading =
    document.getElementById(
      "memoHistoryLoading"
    );


  const content =
    document.getElementById(
      "memoHistoryContent"
    );


  const error =
    document.getElementById(
      "memoHistoryError"
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