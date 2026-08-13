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
   INITIALIZE
======================================== */

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    setToday();

    setupDirectionSwitch();

    await loadPeople();

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


    const { error } =
      await supabase
        .from("Gifts")
        .insert([
          giftData
        ]);


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
      "プレゼントを登録しました。",
      "success"
    );


    submitButton.textContent =
      "保存しました";


    /*
      少しだけ完了表示を見せてから
      TOPへ戻る
    */
    setTimeout(
      () => {

        window.location.href =
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