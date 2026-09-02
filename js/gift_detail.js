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

    setupReturnStatusToggle();

    setupProductUrlEdit();

    setupDetailImage();

    setupDeleteButton();


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
   RESTORE FROM BROWSER CACHE
======================================== */

window.addEventListener(
  "pageshow",
  async event => {

    if (
      !event.persisted ||
      !giftId
    ) {
      return;
    }


    await loadGiftDetail(
      giftId
    );


    if (currentGift) {

      renderGiftDetail();

    }

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

  const summary =
    document.querySelector(
      ".gift-details-summary"
    );


  summary?.classList.remove(
    "received",
    "given"
  );


  summary?.classList.add(
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

  const editButton =
    document.getElementById(
      "giftDetailsUrlEditButton"
    );


  if (
    !link ||
    !linkText ||
    !emptyText ||
    !editButton
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

    editButton.textContent =
      "追加";


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

  editButton.textContent =
    "変更";

}


/* ========================================
   RETURN STATUS
======================================== */

function renderReturnStatus() {

  const section =
  document.getElementById(
    "giftDetailsReturnSection"
  );

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
    !section ||
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


  /* あげたプレゼントはお返し状況を表示しない */

  if (
    currentGift.direction !==
    "received"
  ) {

    section.classList.add(
      "hidden"
    );

    return;

  }

  section.classList.remove(
    "hidden"
  );


  /* お返し不要 */

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


  /* お返し完了 */

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
      "未完了にする";


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
   UPDATE RETURN STATUS
======================================== */

function setupReturnStatusToggle() {

  const button =
    document.getElementById(
      "giftDetailsReturnToggleButton"
    );


  if (!button) {
    return;
  }


  button.addEventListener(
    "click",
    async () => {

      if (
        !currentGift ||
        currentGift.direction !==
          "received" ||
        currentGift.need_return !== true
      ) {
        return;
      }


      const nextReturnDone =
        !currentGift.return_done;


      button.disabled =
        true;


      button.textContent =
        "更新中...";


      const { error } =
        await supabase
          .from("Gifts")
          .update({
            return_done:
              nextReturnDone
          })
          .eq(
            "id",
            currentGift.id
          );


      if (error) {

        console.error(
          "お返し状態の更新に失敗しました:",
          error
        );


        showDetailMessage(
          "giftDetailsReturnMessage",
          "お返し状態を更新できませんでした。",
          "error"
        );


        button.disabled =
          false;


        renderReturnStatus();

        return;

      }


      currentGift.return_done =
        nextReturnDone;


      showDetailMessage(
        "giftDetailsReturnMessage",
        nextReturnDone
          ? "お返し完了に変更しました。"
          : "お返し未完了に戻しました。",
        "success"
      );


      button.disabled =
        false;


      renderReturnStatus();

    }
  );

}

/* ========================================
   PRODUCT URL EDIT
======================================== */

function setupProductUrlEdit() {

  const editButton =
    document.getElementById(
      "giftDetailsUrlEditButton"
    );


  const form =
    document.getElementById(
      "giftDetailsUrlForm"
    );


  const display =
    document.getElementById(
      "giftDetailsUrlDisplay"
    );


  const input =
    document.getElementById(
      "giftDetailsUrlInput"
    );


  const saveButton =
    document.getElementById(
      "giftDetailsUrlSaveButton"
    );


  const cancelButton =
    document.getElementById(
      "giftDetailsUrlCancelButton"
    );

  const normalView =
    document.getElementById(
      "giftDetailsUrlNormalView"
    );


  if (
    !editButton ||
    !form ||
    !display ||
    !normalView ||
    !input ||
    !saveButton ||
    !cancelButton
  ) {
    return;
  }


  editButton.addEventListener(
    "click",
    () => {

      input.value =
        currentGift?.product_url ??
        "";


      clearDetailMessage(
        "giftDetailsUrlMessage"
      );


      normalView.classList.add(
        "hidden"
      );


      form.classList.remove(
        "hidden"
      );


      input.focus();

    }
  );


  cancelButton.addEventListener(
    "click",
    () => {

      form.classList.add(
        "hidden"
      );


      normalView.classList.remove(
        "hidden"
      );


      clearDetailMessage(
        "giftDetailsUrlMessage"
      );

    }
  );


  saveButton.addEventListener(
    "click",
    async () => {

      if (!currentGift) {
        return;
      }


      const productUrl =
        input.value.trim();


      if (
        productUrl &&
        !isValidHttpUrl(
          productUrl
        )
      ) {

        showDetailMessage(
          "giftDetailsUrlMessage",
          "http://またはhttps://から始まるURLを入力してください。",
          "error"
        );

        return;

      }


      saveButton.disabled =
        true;


      cancelButton.disabled =
        true;


      saveButton.textContent =
        "保存中...";


      const { error } =
        await supabase
          .from("Gifts")
          .update({
            product_url:
              productUrl || null
          })
          .eq(
            "id",
            currentGift.id
          );


      if (error) {

        console.error(
          "商品URLの更新に失敗しました:",
          error
        );


        showDetailMessage(
          "giftDetailsUrlMessage",
          "商品URLを保存できませんでした。",
          "error"
        );


        resetUrlEditButtons(
          saveButton,
          cancelButton
        );

        return;

      }


      currentGift.product_url =
        productUrl || null;


      renderProductUrl();


      form.classList.add(
        "hidden"
      );


      display.classList.remove(
        "hidden"
      );


      resetUrlEditButtons(
        saveButton,
        cancelButton
      );

    }
  );

}


function resetUrlEditButtons(
  saveButton,
  cancelButton
) {

  saveButton.disabled =
    false;


  cancelButton.disabled =
    false;


  saveButton.textContent =
    "保存";

}


function isValidHttpUrl(
  value
) {

  try {

    const url =
      new URL(value);


    return (
      url.protocol === "http:" ||
      url.protocol === "https:"
    );

  } catch {

    return false;

  }

}

/* ========================================
   DETAIL IMAGE
======================================== */

function setupDetailImage() {

  const input =
    document.getElementById(
      "giftDetailsImageInput"
    );


  const deleteButton =
    document.getElementById(
      "giftDetailsPhotoDeleteButton"
    );


  if (
    !input ||
    !deleteButton
  ) {
    return;
  }


  input.addEventListener(
    "change",
    async () => {

      const file =
        input.files?.[0];


      if (!file) {
        return;
      }


      if (
        !validateDetailImage(
          file
        )
      ) {

        input.value = "";

        return;

      }


      await saveDetailImage(
        file
      );


      input.value = "";

    }
  );


  deleteButton.addEventListener(
    "click",
    async () => {

      if (
        !currentGift?.image_path
      ) {
        return;
      }


      const shouldDelete =
        window.confirm(
          "登録済みの写真を削除しますか？"
        );


      if (!shouldDelete) {
        return;
      }


      await deleteDetailImage(
        deleteButton
      );

    }
  );

}


function validateDetailImage(
  file
) {

  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp"
  ];


  if (
    !allowedTypes.includes(
      file.type
    )
  ) {

    window.alert(
      "JPEG・PNG・WebP形式の画像を選択してください。"
    );

    return false;

  }


  const maxSize =
    5 * 1024 * 1024;


  if (
    file.size > maxSize
  ) {

    window.alert(
      "5MB以下の画像を選択してください。"
    );

    return false;

  }


  return true;

}

async function saveDetailImage(
  file
) {

  if (!currentGift) {
    return;
  }


  const buttonText =
    document.getElementById(
      "giftDetailsPhotoButtonText"
    );


  const previousButtonText =
    buttonText?.textContent ??
    "写真を登録";


  if (buttonText) {

    buttonText.textContent =
      "保存中...";

  }


  const previousImagePath =
    currentGift.image_path;


  const extension =
    getDetailImageExtension(
      file.type
    );


  const newImagePath =
    `${currentGift.id}/${
      createDetailImageName()
    }.${extension}`;


  const { error: uploadError } =
    await supabase
      .storage
      .from(
        GIFT_IMAGE_BUCKET
      )
      .upload(
        newImagePath,
        file,
        {
          cacheControl:
            "3600",

          upsert:
            false,

          contentType:
            file.type
        }
      );


  if (uploadError) {

    console.error(
      "写真のアップロードに失敗しました:",
      uploadError
    );


    window.alert(
      "写真を保存できませんでした。"
    );


    if (buttonText) {

      buttonText.textContent =
        previousButtonText;

    }


    return;

  }


  const { error: updateError } =
    await supabase
      .from("Gifts")
      .update({
        image_path:
          newImagePath
      })
      .eq(
        "id",
        currentGift.id
      );


  if (updateError) {

    console.error(
      "画像パスの更新に失敗しました:",
      updateError
    );


    await supabase
      .storage
      .from(
        GIFT_IMAGE_BUCKET
      )
      .remove([
        newImagePath
      ]);


    window.alert(
      "写真情報を保存できませんでした。"
    );


    if (buttonText) {

      buttonText.textContent =
        previousButtonText;

    }


    return;

  }


  currentGift.image_path =
    newImagePath;


  renderImage();


  /*
    新しい写真の保存完了後に
    古い写真を削除
  */

  if (
    previousImagePath &&
    previousImagePath !==
      newImagePath
  ) {

    const { error: removeError } =
      await supabase
        .storage
        .from(
          GIFT_IMAGE_BUCKET
        )
        .remove([
          previousImagePath
        ]);


    if (removeError) {

      console.warn(
        "古い写真を削除できませんでした:",
        removeError
      );

    }

  }

}

async function deleteDetailImage(
  deleteButton
) {

  const imagePath =
    currentGift.image_path;


  deleteButton.disabled =
    true;


  deleteButton.textContent =
    "削除中...";


  /*
    先にDBから画像との関連を解除
  */

  const { error: updateError } =
    await supabase
      .from("Gifts")
      .update({
        image_path:
          null
      })
      .eq(
        "id",
        currentGift.id
      );


  if (updateError) {

    console.error(
      "画像情報の削除に失敗しました:",
      updateError
    );


    window.alert(
      "写真を削除できませんでした。"
    );


    deleteButton.disabled =
      false;


    deleteButton.textContent =
      "写真を削除";


    return;

  }


  const { error: removeError } =
    await supabase
      .storage
      .from(
        GIFT_IMAGE_BUCKET
      )
      .remove([
        imagePath
      ]);


  if (removeError) {

    console.warn(
      "Storageの写真を削除できませんでした:",
      removeError
    );

  }


  currentGift.image_path =
    null;


  deleteButton.disabled =
    false;


  deleteButton.textContent =
    "写真を削除";


  renderImage();

}


function getDetailImageExtension(
  mimeType
) {

  const extensionMap = {

    "image/jpeg":
      "jpg",

    "image/png":
      "png",

    "image/webp":
      "webp"

  };


  return (
    extensionMap[mimeType] ||
    "jpg"
  );

}


function createDetailImageName() {

  if (
    window.crypto?.randomUUID
  ) {

    return crypto.randomUUID();

  }


  return (
    `${Date.now()}-`
    +
    Math.random()
      .toString(36)
      .slice(2)
  );

}

/* ========================================
   DELETE GIFT
======================================== */

function setupDeleteButton() {

  const deleteButton =
    document.getElementById(
      "giftDetailsDeleteButton"
    );


  if (!deleteButton) {
    return;
  }


  deleteButton.addEventListener(
    "click",
    async () => {

      if (!currentGift) {
        return;
      }


      closeActionMenu();


      const shouldDelete =
        window.confirm(
          `「${
            currentGift.item_name ||
            "このプレゼント"
          }」を削除しますか？\n`
          +
          "この操作は取り消せません。"
        );


      if (!shouldDelete) {
        return;
      }


      await deleteCurrentGift(
        deleteButton
      );

    }
  );

}


async function deleteCurrentGift(
  deleteButton
) {

  const imagePath =
    currentGift.image_path;


  deleteButton.disabled =
    true;


  deleteButton.innerHTML = `

    <i class="fa-solid fa-spinner fa-spin"></i>

    <span>
      削除中...
    </span>

  `;


  /*
    先にGiftsテーブルから削除
  */

  const {
    data: deletedGift,
    error: deleteError
  } =
    await supabase
      .from("Gifts")
      .delete()
      .eq(
        "id",
        currentGift.id
      )
      .select("id")
      .maybeSingle();


  if (
    deleteError ||
    !deletedGift
  ) {

    console.error(
      "プレゼントの削除に失敗しました:",
      deleteError
    );


    window.alert(
      "プレゼントを削除できませんでした。"
    );


    deleteButton.disabled =
      false;


    deleteButton.innerHTML = `

      <i class="fa-regular fa-trash-can"></i>

      <span>
        削除
      </span>

    `;


    return;

  }


  /*
    登録写真も削除
  */

  if (imagePath) {

    const { error: imageError } =
      await supabase
        .storage
        .from(
          GIFT_IMAGE_BUCKET
        )
        .remove([
          imagePath
        ]);


    if (imageError) {

      console.warn(
        "プレゼント写真を削除できませんでした:",
        imageError
      );

    }

  }


  window.alert(
    "プレゼントを削除しました。"
  );


  window.location.href =
    returnTo;

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
    +
    `&refresh=${
      Date.now()
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

function showDetailMessage(
  elementId,
  message,
  type
) {

  const element =
    document.getElementById(
      elementId
    );


  if (!element) {
    return;
  }


  element.textContent =
    message;


  element.className =
    `gift-details-message ${type}`;

}


function clearDetailMessage(
  elementId
) {

  const element =
    document.getElementById(
      elementId
    );


  if (!element) {
    return;
  }


  element.textContent =
    "";


  element.className =
    "gift-details-message";

}