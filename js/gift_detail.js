import {
  supabase
} from "./supabase.js";


/* ========================================
   CONSTANTS
======================================== */

const GIFT_IMAGE_BUCKET =
  "gift-images";


/* ========================================
   STATE
======================================== */

let currentGift = null;


/* ========================================
   URL PARAMS
======================================== */

const urlParams =
  new URLSearchParams(
    window.location.search
  );


const giftId =
  urlParams.get(
    "gift_id"
  );


const returnTo =
  getSafeReturnTo(
    urlParams.get(
      "return_to"
    )
  );


/* ========================================
   INITIALIZE
======================================== */

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    setupReturnNavigation();

    setupActionMenu();

    setupEditButton();


    if (!giftId) {

      showGiftError(
        "プレゼントが指定されていません。"
      );

      return;

    }


    await loadGiftDetail(
      giftId
    );


    if (!currentGift) {
      return;
    }


    renderGiftDetail();

  }
);


/* ========================================
   LOAD GIFT
======================================== */

async function loadGiftDetail(
  selectedGiftId
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
        product_url,
        image_path,
        memo,
        need_return,
        return_done,
        people (
          name
        )
      `)
      .eq(
        "id",
        selectedGiftId
      )
      .maybeSingle();


  if (
    error ||
    !data
  ) {

    console.error(
      "プレゼント情報の取得に失敗しました:",
      error
    );


    showGiftError(
      "プレゼント情報を取得できませんでした。"
    );

    return;

  }


  currentGift =
    data;

}


/* ========================================
   RENDER
======================================== */

function renderGiftDetail() {

  renderDirection();

  renderPerson();

  renderImage();

  renderProductUrl();

  renderReturnStatus();


  setText(
    "giftDetailsItemName",
    currentGift.item_name ||
      "名称未登録"
  );


  setText(
    "giftDetailsDate",
    formatGiftDate(
      currentGift.gift_date
    )
  );


  setText(
    "giftDetailsOccasion",
    currentGift.occasion ||
      "未登録"
  );


  setText(
    "giftDetailsPrice",
    formatPrice(
      currentGift.price
    )
  );


  setText(
    "giftDetailsMemo",
    currentGift.memo ||
      "メモは登録されていません"
  );


  const loading =
    document.getElementById(
      "giftDetailsLoading"
    );


  const content =
    document.getElementById(
      "giftDetailsContent"
    );


  loading?.classList.add(
    "hidden"
  );


  content?.classList.remove(
    "hidden"
  );

}


/* ========================================
   DIRECTION
======================================== */

function renderDirection() {

  const element =
    document.getElementById(
      "giftDetailsDirection"
    );


  if (!element) {
    return;
  }


  const isReceived =
    currentGift.direction ===
    "received";


  element.textContent =
    isReceived
      ? "もらった"
      : "あげた";


  element.classList.remove(
    "received",
    "given"
  );


  element.classList.add(
    isReceived
      ? "received"
      : "given"
  );

}


/* ========================================
   PERSON
======================================== */

function renderPerson() {

  const personName =
    currentGift.people?.name ||
    "人物未登録";


  const formattedName =
    formatPersonName(
      personName
    );


  const relationshipText =
    currentGift.direction ===
      "received"
      ? `${formattedName}からもらったプレゼント`
      : `${formattedName}にあげたプレゼント`;


  setText(
    "giftDetailsPerson",
    relationshipText
  );


  setText(
    "giftDetailsPersonValue",
    formattedName
  );

}


/* ========================================
   IMAGE
======================================== */

function renderImage() {

    const container =
    document.getElementById(
      "giftDetailsPhoto"
    );


  const buttonText =
    document.getElementById(
      "giftDetailsPhotoButtonText"
    );


  const deleteButton =
    document.getElementById(
      "giftDetailsPhotoDeleteButton"
    );


  if (!container) {
    return;
  }


  if (
    !currentGift.image_path
  ) {

    container.innerHTML = `

      <i class="fa-solid fa-gift"></i>

      <span>
        写真が登録されていません
      </span>

    `;


    if (buttonText) {

      buttonText.textContent =
        "写真を登録";

    }


    deleteButton?.classList.add(
      "hidden"
    );


    return;

  }


  const { data } =
    supabase
      .storage
      .from(
        GIFT_IMAGE_BUCKET
      )
      .getPublicUrl(
        currentGift.image_path
      );

    console.log(
        "画像公開URL:",
        data.publicUrl
    );


  container.innerHTML = `

    <img
      src="${escapeHtml(
        data.publicUrl
      )}"
      alt="${escapeHtml(
        currentGift.item_name ||
        "プレゼント"
      )}の写真"
    >

  `;


  if (buttonText) {

    buttonText.textContent =
      "写真を変更";

  }


  deleteButton?.classList.remove(
    "hidden"
  );

}


/* ========================================
   PRODUCT URL
======================================== */

function renderProductUrl() {

  const link =
    document.getElementById(
      "giftDetailsProductUrl"
    );


  const linkText =
    document.getElementById(
      "giftDetailsProductUrlText"
    );


  const emptyText =
    document.getElementById(
      "giftDetailsNoProductUrl"
    );


  if (
    !link ||
    !linkText ||
    !emptyText
  ) {
    return;
  }


  if (
    !currentGift.product_url
  ) {

    link.classList.add(
      "hidden"
    );


    emptyText.classList.remove(
      "hidden"
    );


    return;

  }


  link.href =
    currentGift.product_url;


  linkText.textContent =
    currentGift.product_url;


  link.classList.remove(
    "hidden"
  );


  emptyText.classList.add(
    "hidden"
  );

}


/* ========================================
   RETURN STATUS
======================================== */

function renderReturnStatus() {

  const status =
    document.getElementById(
      "giftDetailsReturnStatus"
    );


  const icon =
    document.getElementById(
      "giftDetailsReturnIcon"
    );


  const toggleButton =
    document.getElementById(
      "giftDetailsReturnToggleButton"
    );


  if (
    !status ||
    !icon ||
    !toggleButton
  ) {
    return;
  }


  icon.classList.remove(
    "pending",
    "completed"
  );


  /*
    あげたプレゼント
  */

  if (
    currentGift.direction !==
    "received"
  ) {

    status.textContent =
      "お返し対象外";


    icon.innerHTML = `
      <i class="fa-solid fa-minus"></i>
    `;


    toggleButton.classList.add(
      "hidden"
    );


    return;

  }


  /*
    お返し不要
  */

  if (
    currentGift.need_return !==
    true
  ) {

    status.textContent =
      "お返し不要";


    icon.innerHTML = `
      <i class="fa-solid fa-minus"></i>
    `;


    toggleButton.classList.add(
      "hidden"
    );


    return;

  }


  /*
    お返し完了
  */

  if (
    currentGift.return_done ===
    true
  ) {

    status.textContent =
      "お返し完了";


    icon.innerHTML = `
      <i class="fa-solid fa-check"></i>
    `;


    icon.classList.add(
      "completed"
    );


    toggleButton.textContent =
      "未完了に戻す";


    toggleButton.classList.remove(
      "hidden"
    );


    return;

  }


  /*
    お返し未完了
  */

  status.textContent =
    "お返し未完了";


  icon.innerHTML = `
    <i class="fa-regular fa-clock"></i>
  `;


  icon.classList.add(
    "pending"
  );


  toggleButton.textContent =
    "完了にする";


  toggleButton.classList.remove(
    "hidden"
  );

}


/* ========================================
   RETURN NAVIGATION
======================================== */

function setupReturnNavigation() {

  const backButton =
    document.getElementById(
      "giftDetailsBackButton"
    );


  const errorBack =
    document.getElementById(
      "giftDetailsErrorBack"
    );


  if (backButton) {

    backButton.href =
      returnTo;

  }


  if (errorBack) {

    errorBack.href =
      returnTo;

  }

}


/* ========================================
   ACTION MENU
======================================== */

function setupActionMenu() {

  const toggleButton =
    document.getElementById(
      "giftDetailsActionsToggle"
    );


  const menu =
    document.getElementById(
      "giftDetailsActionsMenu"
    );


  if (
    !toggleButton ||
    !menu
  ) {
    return;
  }


  toggleButton.addEventListener(
    "click",
    event => {

      event.stopPropagation();


      const willOpen =
        menu.classList.contains(
          "hidden"
        );


      menu.classList.toggle(
        "hidden",
        !willOpen
      );


      toggleButton.setAttribute(
        "aria-expanded",
        String(willOpen)
      );

    }
  );


  document.addEventListener(
    "click",
    event => {

      if (
        event.target.closest(
          ".gift-details-actions"
        )
      ) {
        return;
      }


      closeActionMenu();

    }
  );

}


function closeActionMenu() {

  const menu =
    document.getElementById(
      "giftDetailsActionsMenu"
    );


  const toggleButton =
    document.getElementById(
      "giftDetailsActionsToggle"
    );


  menu?.classList.add(
    "hidden"
  );


  toggleButton?.setAttribute(
    "aria-expanded",
    "false"
  );

}


/* ========================================
   EDIT
======================================== */

function setupEditButton() {

  const editButton =
    document.getElementById(
      "giftDetailsEditButton"
    );


  if (!editButton) {
    return;
  }


  editButton.addEventListener(
    "click",
    () => {

      if (!giftId) {
        return;
      }


      const detailUrl =
        createCurrentDetailUrl();


      window.location.href =
        `gifts.html?gift_id=${
          encodeURIComponent(
            giftId
          )
        }&return_to=${
          encodeURIComponent(
            detailUrl
          )
        }`;

    }
  );

}


function createCurrentDetailUrl() {

  return (
    `gift_detail.html?gift_id=${
      encodeURIComponent(
        giftId
      )
    }`
    +
    `&return_to=${
      encodeURIComponent(
        returnTo
      )
    }`
  );

}


/* ========================================
   ERROR
======================================== */

function showGiftError(
  message
) {

  const loading =
    document.getElementById(
      "giftDetailsLoading"
    );


  const content =
    document.getElementById(
      "giftDetailsContent"
    );


  const error =
    document.getElementById(
      "giftDetailsError"
    );


  const errorText =
    error?.querySelector(
      "p"
    );


  loading?.classList.add(
    "hidden"
  );


  content?.classList.add(
    "hidden"
  );


  if (errorText) {

    errorText.textContent =
      message;

  }


  error?.classList.remove(
    "hidden"
  );

}


/* ========================================
   FORMATTERS
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


function formatGiftDate(
  dateString
) {

  if (!dateString) {
    return "未登録";
  }


  const date =
    new Date(
      `${dateString}T00:00:00`
    );


  return (
    `${date.getFullYear()}年`
    +
    `${date.getMonth() + 1}月`
    +
    `${date.getDate()}日`
  );

}


function formatPrice(
  price
) {

  if (
    price === null ||
    price === undefined ||
    price === ""
  ) {

    return "未登録";

  }


  return (
    `${Number(price).toLocaleString(
      "ja-JP"
    )}円`
  );

}


/* ========================================
   SAFE RETURN URL
======================================== */

function getSafeReturnTo(
  value
) {

  if (!value) {
    return "index.html";
  }


  const trimmedValue =
    value.trim();


  if (
    trimmedValue.startsWith("//") ||
    /^[a-z][a-z\d+.-]*:/i.test(
      trimmedValue
    )
  ) {

    return "index.html";

  }


  return trimmedValue;

}


/* ========================================
   HELPERS
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