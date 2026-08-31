import { supabase } from "./supabase.js";

const GIFT_IMAGE_BUCKET =
  "gift-images";

/* ========================================
   ELEMENTS
======================================== */

const giftForm =
  document.getElementById("giftForm");

const directionInputs =
  document.querySelectorAll(
    'input[name="direction"]'
  );

const personSelect =
  document.getElementById("personSelect");

const personSelectLabel =
  document.getElementById("personSelectLabel");

const itemNameInput =
  document.getElementById("itemName");

const giftDateInput =
  document.getElementById("giftDate");

const occasionSelect =
  document.getElementById("occasion");

const priceInput =
  document.getElementById("price");

const productUrlInput =
  document.getElementById(
    "productUrl"
  );


const giftImageInput =
  document.getElementById(
    "giftImage"
  );


const giftImagePreview =
  document.getElementById(
    "giftImagePreview"
  );


const giftImageClearButton =
  document.getElementById(
    "giftImageClearButton"
  );

const returnField =
  document.getElementById("returnField");

const needReturnInput =
  document.getElementById("needReturn");

const memoInput =
  document.getElementById("memo");

const message =
  document.getElementById("giftMessage");

const submitButton =
  document.getElementById("giftSubmitButton");

const backButton =
  document.getElementById(
    "giftBackButton"
  );

const closeButton =
  document.getElementById(
    "giftCloseButton"
  );


/* ========================================
   IMAGE STATE
======================================== */

let selectedImageFile = null;

let currentImagePath = null;

let shouldRemoveCurrentImage = false;

let previewObjectUrl = null;

let currentReturnDone = false;

/* ========================================
   URL PARAMS
======================================== */

const urlParams =
  new URLSearchParams(
    window.location.search
  );


const presetPersonId =
  urlParams.get(
    "person_id"
  );

const giftId =
  urlParams.get(
    "gift_id"
  );

const returnTo =
  urlParams.get(
    "return_to"
  );


/* ========================================
   INITIALIZE
======================================== */

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    setToday();

    setupDirectionSwitch();

    setupGiftImage();

    setupReturnNavigation();

    await loadPeople();

    if (giftId) {
      await loadGiftForEdit(
        giftId
      );

    }else{
      applyPresetPerson();
    }
  }
);

/* ========================================
   GIFT IMAGE
======================================== */

function setupGiftImage() {

  if (
    !giftImageInput ||
    !giftImagePreview ||
    !giftImageClearButton
  ) {
    return;
  }


  giftImageInput.addEventListener(
    "change",
    () => {

      const file =
        giftImageInput.files?.[0];


      if (!file) {
        return;
      }


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


        giftImageInput.value = "";

        return;

      }


      const maxFileSize =
        5 * 1024 * 1024;


      if (
        file.size > maxFileSize
      ) {

        window.alert(
          "5MB以下の画像を選択してください。"
        );


        giftImageInput.value = "";

        return;

      }


      selectedImageFile =
        file;


      shouldRemoveCurrentImage =
        false;


      showLocalImagePreview(
        file
      );

    }
  );


  giftImageClearButton.addEventListener(
    "click",
    () => {

      selectedImageFile =
        null;


      giftImageInput.value =
        "";


      if (currentImagePath) {

        shouldRemoveCurrentImage =
          true;

      }


      showEmptyImagePreview();

    }
  );

}

function showLocalImagePreview(
  file
) {

  if (previewObjectUrl) {

    URL.revokeObjectURL(
      previewObjectUrl
    );

  }


  previewObjectUrl =
    URL.createObjectURL(
      file
    );


  giftImagePreview.innerHTML = `

    <img
      src="${previewObjectUrl}"
      alt="選択したプレゼント写真"
    >

  `;


  giftImageClearButton.classList.remove(
    "hidden"
  );

}

function showStoredImagePreview(
  imagePath
) {

  const { data } =
    supabase
      .storage
      .from(GIFT_IMAGE_BUCKET)
      .getPublicUrl(
        imagePath
      );


  const imageUrl =
    data.publicUrl;


  giftImagePreview.innerHTML = `

    <img
      src="${imageUrl}"
      alt="登録済みのプレゼント写真"
    >

  `;


  giftImageClearButton
    .classList
    .remove(
      "hidden"
    );

}

function showEmptyImagePreview() {

  if (previewObjectUrl) {

    URL.revokeObjectURL(
      previewObjectUrl
    );


    previewObjectUrl =
      null;

  }


  giftImagePreview.innerHTML = `

    <i class="fa-solid fa-gift"></i>

    <span>
      写真が選択されていません
    </span>

  `;


  giftImageClearButton.classList.add(
    "hidden"
  );

}

/* ========================================
   IMAGE STORAGE
======================================== */

async function syncGiftImage(
  savedGiftId
) {

  /*
    写真に変更がない場合
  */

  if (
    !selectedImageFile &&
    !shouldRemoveCurrentImage
  ) {
    return;
  }


  const previousImagePath =
    currentImagePath;


  let nextImagePath =
    previousImagePath;


  let uploadedImagePath =
    null;


  /*
    新しい写真をアップロード
  */

  if (selectedImageFile) {

    const extension =
      getImageExtension(
        selectedImageFile.type
      );


    const randomName =
      createRandomFileName();


    uploadedImagePath =
      `${savedGiftId}/${randomName}.${extension}`;


    const { error: uploadError } =
      await supabase
        .storage
        .from(GIFT_IMAGE_BUCKET)
        .upload(
          uploadedImagePath,
          selectedImageFile,
          {
            cacheControl: "3600",
            upsert: false,
            contentType:
              selectedImageFile.type
          }
        );


    if (uploadError) {
      throw uploadError;
    }


    nextImagePath =
      uploadedImagePath;

  } else if (
    shouldRemoveCurrentImage
  ) {

    nextImagePath =
      null;

  }


  /*
    Giftsテーブルを更新
  */

  const { error: updateError } =
    await supabase
      .from("Gifts")
      .update({
        image_path:
          nextImagePath
      })
      .eq(
        "id",
        savedGiftId
      );


  if (updateError) {

    /*
      DB更新に失敗した場合、
      今回アップロードした画像を削除
    */

    if (uploadedImagePath) {

      await supabase
        .storage
        .from(GIFT_IMAGE_BUCKET)
        .remove([
          uploadedImagePath
        ]);

    }


    throw updateError;

  }


  /*
    古い写真を削除
  */

  if (
    previousImagePath &&
    previousImagePath !==
      nextImagePath
  ) {

    const { error: removeError } =
      await supabase
        .storage
        .from(GIFT_IMAGE_BUCKET)
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


  currentImagePath =
    nextImagePath;


  selectedImageFile =
    null;


  shouldRemoveCurrentImage =
    false;

}

function getImageExtension(
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


function createRandomFileName() {

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
   TODAY
======================================== */

function setToday() {

  const today = new Date();

  const year =
    today.getFullYear();

  const month =
    String(
      today.getMonth() + 1
    ).padStart(2, "0");

  const day =
    String(
      today.getDate()
    ).padStart(2, "0");

  giftDateInput.value =
    `${year}-${month}-${day}`;

}


/* ========================================
   LOAD PEOPLE
======================================== */

async function loadPeople() {

  const { data, error } =
    await supabase
      .from("people")
      .select("id, name")
      .order("name", {
        ascending: true
      });


  if (error) {

    console.error(
      "人物情報の取得に失敗しました:",
      error
    );

    showMessage(
      "人物情報を取得できませんでした。",
      "error"
    );

    return;
  }


  personSelect.innerHTML = `
    <option value="">
      人物を選択してください
    </option>
  `;


  data.forEach(person => {

    const option =
      document.createElement("option");

    option.value =
      person.id;

    option.textContent =
      person.name;

    personSelect.appendChild(
      option
    );

  });

}


/* ========================================
   DIRECTION SWITCH
======================================== */

function setupDirectionSwitch() {

  directionInputs.forEach(input => {

    input.addEventListener(
      "change",
      () => {

        updateDirectionUI();

      }
    );

  });


  updateDirectionUI();

}


/* ========================================
   UPDATE DIRECTION UI
======================================== */

function updateDirectionUI() {

  const direction =
    getSelectedDirection();


  if (direction === "received") {

    personSelectLabel.textContent =
      "プレゼントをもらった相手";

    returnField.classList.remove(
      "hidden"
    );

  } else {

    personSelectLabel.textContent =
      "プレゼントをあげた相手";

    returnField.classList.add(
      "hidden"
    );

    /*
      「あげた」に切り替えた場合は
      お返し不要として扱う
    */
    needReturnInput.checked =
      false;

  }

}


/* ========================================
   GET DIRECTION
======================================== */

function getSelectedDirection() {

  const checkedInput =
    document.querySelector(
      'input[name="direction"]:checked'
    );

  return checkedInput.value;

}


/* ========================================
   SUBMIT
======================================== */

giftForm.addEventListener(
  "submit",
  async event => {

    event.preventDefault();


    clearMessage();


    const direction =
      getSelectedDirection();

    const personId =
      personSelect.value;

    const itemName =
      itemNameInput.value.trim();

    const giftDate =
      giftDateInput.value;

    const occasion =
      occasionSelect.value;

    const price =
      priceInput.value;

    const productUrl =
      productUrlInput.value.trim();

    const memo =
      memoInput.value.trim();


    /* -------------------------
       VALIDATION
    ------------------------- */

    if (!personId) {

      showMessage(
        "人物を選択してください。",
        "error"
      );

      return;
    }


    if (!itemName) {

      showMessage(
        "プレゼント内容を入力してください。",
        "error"
      );

      return;
    }


    if (!giftDate) {

      showMessage(
        "日付を入力してください。",
        "error"
      );

      return;
    }


    /* -------------------------
       RETURN STATUS
    ------------------------- */

    const needReturn =
      direction === "received"
        ? needReturnInput.checked
        : false;


    /*　新規登録時は未完了。
  　　　編集時は現在の完了状態を維持する。
    */
    const returnDone =
      giftId
        ? currentReturnDone
        : false;


    /* -------------------------
       DATA
    ------------------------- */

    const giftData = {

      person_id:
        personId,

      direction:
        direction,

      gift_date:
        giftDate,

      occasion:
        occasion,

      item_name:
        itemName,

      price:
        price
          ? Number(price)
          : null,
      
      product_url:
        productUrl || null,

      memo:
        memo || null,

      need_return:
        needReturn,

      return_done:
        returnDone

    };

    if (
      productUrl &&
      !isValidProductUrl(
        productUrl
      )
    ) {

      showMessage(
        "商品URLはhttp://またはhttps://から入力してください。",
        "error"
      );

      return;

    }


    /* -------------------------
      SAVE
    ------------------------- */

    submitButton.disabled =
      true;


    submitButton.textContent =
      giftId
        ? "更新中..."
        : "保存中...";


    let savedGiftId =
      giftId;


    let isNewGift =
      !giftId;


    let databaseError =
      null;


    /*
      ギフト情報を保存
    */

    if (giftId) {

      const result =
        await supabase
          .from("Gifts")
          .update(
            giftData
          )
          .eq(
            "id",
            giftId
          );


      databaseError =
        result.error;

    } else {

      const result =
        await supabase
          .from("Gifts")
          .insert([
            giftData
          ])
          .select("id")
          .single();


      databaseError =
        result.error;


      savedGiftId =
        result.data?.id ?? null;

    }


    /*
      ギフト保存エラー
    */

    if (
      databaseError ||
      !savedGiftId
    ) {

      console.error(
        "プレゼント登録エラー:",
        databaseError
      );


      showMessage(
        "保存に失敗しました。",
        "error"
      );


      resetGiftSubmitButton();

      return;

    }


    /*
      写真を保存
    */

    try {

      await syncGiftImage(
        savedGiftId
      );

    } catch (imageError) {

      console.error(
        "プレゼント写真の保存に失敗しました:",
        imageError
      );


      /*
        新規登録時に画像保存まで完了しなかった場合、
        作成したギフト行を削除して重複登録を防ぐ
      */

      if (isNewGift) {

        const { error: rollbackError } =
          await supabase
            .from("Gifts")
            .delete()
            .eq(
              "id",
              savedGiftId
            );


        if (rollbackError) {

          console.error(
            "ギフト登録の取り消しに失敗しました:",
            rollbackError
          );

        }

      }


      showMessage(
        "写真を保存できませんでした。Storageの設定を確認してください。",
        "error"
      );


      resetGiftSubmitButton();

      return;

    }


    /* -------------------------
       SUCCESS
    ------------------------- */

    showMessage(
      giftId
        ? "プレゼントを更新しました。"
        : "プレゼントを登録しました。",
      "success"
    );


    submitButton.textContent =
      giftId
        ? "更新しました"
        : "保存しました";


    /*
      少しだけ完了表示を見せてから
      TOPへ戻る
    */
    setTimeout(
      () => {

        window.location.href =
          returnTo ||
          "index.html";

      },
      700
    );

  }
);


/* ========================================
   MESSAGE
======================================== */

function showMessage(
  text,
  type
) {

  message.textContent =
    text;

  message.className =
    `gift-form-message ${type}`;

}


function clearMessage() {

  message.textContent =
    "";

  message.className =
    "gift-form-message";

}

function resetGiftSubmitButton() {

  submitButton.disabled =
    false;


  submitButton.textContent =
    giftId
      ? "変更を保存"
      : "保存する";

}

/* ========================================
   PRODUCT URL VALIDATION
======================================== */

function isValidProductUrl(
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
   PRESET PERSON
======================================== */

function applyPresetPerson() {

  if (!presetPersonId) {
    return;
  }


  const optionExists =
    [
      ...personSelect.options
    ]
      .some(
        option =>
          option.value ===
          presetPersonId
      );


  if (!optionExists) {
    return;
  }


  personSelect.value =
    presetPersonId;

}

/* ========================================
   LOAD GIFT FOR EDIT
======================================== */

async function loadGiftForEdit(
  giftId
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
        return_done
      `)
      .eq(
        "id",
        giftId
      )
      .single();


  if (error) {

    console.error(
      "プレゼント情報の取得に失敗しました:",
      error
    );


    showMessage(
      "プレゼント情報を取得できませんでした。",
      "error"
    );


    return;

  }


  /* 区分 */
  const directionInput =
    document.querySelector(
      `input[name="direction"][value="${data.direction}"]`
    );


  if (directionInput) {

    directionInput.checked =
      true;

  }


  /* 人物 */
  personSelect.value =
    data.person_id ?? "";


  /* 品名 */
  itemNameInput.value =
    data.item_name ?? "";


  /* 日付 */
  giftDateInput.value =
    data.gift_date ?? "";


  /* 名目 */
  occasionSelect.value =
    data.occasion ?? "その他";


  /* 金額 */
  priceInput.value =
    data.price ?? "";


  /* 商品URL */
  productUrlInput.value =
    data.product_url ?? "";


  /* メモ */
  memoInput.value =
    data.memo ?? "";


  /* お返し */
  needReturnInput.checked =
    data.need_return === true;


  /* お返し完了状態 */
  currentReturnDone =
    data.return_done === true;


  /* 既存写真 */
  currentImagePath =
    data.image_path ?? null;


  if (currentImagePath) {

    showStoredImagePreview(
      currentImagePath
    );

  } else {

    showEmptyImagePreview();

  }


  /* 区分に合わせてUI更新 */
  updateDirectionUI();


  /* 見出し */
  const pageTitle =
    document.querySelector(
      ".gift-page-header h1"
    );


  if (pageTitle) {

    pageTitle.textContent =
      "プレゼントログを編集";

  }


  submitButton.textContent =
    "変更を保存";

}

/* ========================================
   RETURN NAVIGATION
======================================== */

function setupReturnNavigation() {

  const destination =
    returnTo ||
    "index.html";


  if (backButton) {

    backButton.href =
      destination;

  }


  if (closeButton) {

    closeButton.href =
      destination;

  }

}
