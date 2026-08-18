import { supabase } from "./supabase.js";


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


    /*
      新規登録時点では
      お返し済み = false
    */
    const returnDone =
      false;


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

      memo:
        memo || null,

      need_return:
        needReturn,

      return_done:
        returnDone

    };


    /* -------------------------
       SAVE
    ------------------------- */

    submitButton.disabled =
      true;

    submitButton.textContent =
      "保存中...";


    let error;


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


      error =
        result.error;

    } else {

      const result =
        await supabase
          .from("Gifts")
          .insert([
            giftData
          ]);


      error =
        result.error;

    }


    if (error) {

      console.error(
        "プレゼント登録エラー:",
        error
      );

      showMessage(
        "保存に失敗しました。",
        "error"
      );

      submitButton.disabled =
        false;

      submitButton.textContent =
        "保存する";

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


  /* メモ */

  memoInput.value =
    data.memo ?? "";


  /* お返し */

  needReturnInput.checked =
    data.need_return === true;


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