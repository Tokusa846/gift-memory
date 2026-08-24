/* Import */
import { supabase } from "./supabase.js";


/* ========================================
   STATE
======================================== */

let currentPerson = null;

let giftLogs = [];

let selectedOccasion = "";

let selectedBudget = "";


/* ========================================
   INITIALIZE
======================================== */

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    setupBackButton();

    setupOccasionOptions();

    setupBudgetOptions();

    setupCustomInputs();

    setupForm();


    const personId =
      getPersonIdFromUrl();


    /*
      person_idがない場合は
      一般的なAI相談画面として表示する
    */
    if (!personId) {

      renderGeneralConsultation();

      showContent();

      return;

    }


    await loadPerson(
      personId
    );


    if (!currentPerson) {

      showError(
        "人物情報を取得できませんでした。"
      );

      return;

    }


    await loadGiftLogs(
      personId
    );


    renderPersonInformation();

    showContent();

  }
);


/* ========================================
   URL PARAMETERS
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
   BACK BUTTON
======================================== */

function setupBackButton() {

  const button =
    document.getElementById(
      "aiTalkBackButton"
    );


  if (!button) {
    return;
  }


  const params =
    new URLSearchParams(
      window.location.search
    );


  const returnTo =
    params.get(
      "return_to"
    );


  if (!returnTo) {

    button.href =
      "people_manage.html";

    return;

  }


  const safeReturnUrl =
    getSafeReturnUrl(
      returnTo
    );


  button.href =
    safeReturnUrl ||
    "people_manage.html";

}


/* ========================================
   SAFE RETURN URL
======================================== */

function getSafeReturnUrl(
  returnTo
) {

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
   LOAD GIFT LOGS
======================================== */

async function loadGiftLogs(
  personId
) {

  const { data, error } =
    await supabase
      .from("Gifts")
      .select(`
        id,
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
   RENDER PERSON INFORMATION
======================================== */

function renderPersonInformation() {

  const title =
    document.getElementById(
      "aiTalkPersonTitle"
    );


  const container =
    document.getElementById(
      "aiTalkPersonInfo"
    );


  if (
    !title ||
    !container ||
    !currentPerson
  ) {
    return;
  }


  title.textContent =
    `${currentPerson.name}さんへのプレゼント相談`;


  container.innerHTML = "";


  addPersonInfoRow(
    container,
    "関係性",
    currentPerson.relationship
  );


  addPersonInfoRow(
    container,
    "好きなもの",
    currentPerson.likes
  );


  addPersonInfoRow(
    container,
    "苦手なもの",
    currentPerson.dislikes
  );


  addPersonInfoRow(
    container,
    "アレルギー",
    currentPerson.allergies
  );


  addPersonInfoRow(
    container,
    "メモ",
    currentPerson.memo
  );


  const giftHistoryText =
    createGiftHistoryText();


  addPersonInfoRow(
    container,
    "過去の贈り物",
    giftHistoryText
  );


  /*
    表示できる登録情報がない場合
  */
  if (
    container.children.length === 0
  ) {

    const message =
      document.createElement(
        "p"
      );


    message.className =
      "ai-talk-no-person-info";


    message.textContent =
      "参考にできる登録情報はまだありません。";


    container.appendChild(
      message
    );

  }

}


/* ========================================
   ADD PERSON INFORMATION ROW
======================================== */

function addPersonInfoRow(
  container,
  label,
  value
) {

  if (
    value === null ||
    value === undefined ||
    String(value).trim() === ""
  ) {
    return;
  }


  const row =
    document.createElement(
      "div"
    );


  row.className =
    "ai-talk-person-row";


  const labelElement =
    document.createElement(
      "span"
    );


  labelElement.className =
    "ai-talk-person-label";


  labelElement.textContent =
    label;


  const valueElement =
    document.createElement(
      "p"
    );


  valueElement.className =
    "ai-talk-person-value";


  valueElement.textContent =
    String(value);


  row.appendChild(
    labelElement
  );


  row.appendChild(
    valueElement
  );


  container.appendChild(
    row
  );

}


/* ========================================
   CREATE GIFT HISTORY TEXT
======================================== */

function createGiftHistoryText() {

  if (
    giftLogs.length === 0
  ) {

    return "";

  }


  return giftLogs
    .slice(
      0,
      5
    )
    .map(
      gift => {

        const direction =
          gift.direction === "received"
            ? "もらった"
            : "贈った";


        const itemName =
          gift.item_name ||
          "内容未登録";


        const occasion =
          gift.occasion
            ? `（${gift.occasion}）`
            : "";


        return (
          `${direction}：` +
          `${itemName}` +
          `${occasion}`
        );

      }
    )
    .join("、");

}


/* ========================================
   GENERAL CONSULTATION
======================================== */

function renderGeneralConsultation() {

  const title =
    document.getElementById(
      "aiTalkPersonTitle"
    );


  const personInfo =
    document.getElementById(
      "aiTalkPersonInfo"
    );


  if (title) {

    title.textContent =
      "プレゼントを一緒に考えます";

  }


  /*
    人物IDがない場合は、
    人物情報カードを非表示にする
  */
  const personSection =
    personInfo?.closest(
      ".ai-talk-section"
    );


  if (personSection) {

    personSection.classList.add(
      "hidden"
    );

  }

}


/* ========================================
   OCCASION OPTIONS
======================================== */

function setupOccasionOptions() {

  const buttons =
    document.querySelectorAll(
      ".ai-talk-option-button"
    );


  buttons.forEach(
    button => {

      button.addEventListener(
        "click",
        () => {

          buttons.forEach(
            target => {

              target.classList.remove(
                "selected"
              );

              target.setAttribute(
                "aria-pressed",
                "false"
              );

            }
          );


          button.classList.add(
            "selected"
          );


          button.setAttribute(
            "aria-pressed",
            "true"
          );


          selectedOccasion =
            button.dataset.occasion || "";


          const hiddenInput =
            document.getElementById(
              "selectedOccasion"
            );


          if (hiddenInput) {

            hiddenInput.value =
              selectedOccasion;

          }


          toggleOtherOccasionField();

          updateSubmitButton();

        }
      );

    }
  );

}


/* ========================================
   OTHER OCCASION FIELD
======================================== */

function toggleOtherOccasionField() {

  const field =
    document.getElementById(
      "otherOccasionField"
    );


  const input =
    document.getElementById(
      "otherOccasion"
    );


  if (
    !field ||
    !input
  ) {
    return;
  }


  const shouldShow =
    selectedOccasion ===
    "その他";


  field.classList.toggle(
    "hidden",
    !shouldShow
  );


  input.required =
    shouldShow;


  if (shouldShow) {

    input.focus();

  } else {

    input.value = "";

  }

}


/* ========================================
   BUDGET OPTIONS
======================================== */

function setupBudgetOptions() {

  const buttons =
    document.querySelectorAll(
      ".ai-talk-budget-button"
    );


  buttons.forEach(
    button => {

      button.addEventListener(
        "click",
        () => {

          buttons.forEach(
            target => {

              target.classList.remove(
                "selected"
              );

              target.setAttribute(
                "aria-pressed",
                "false"
              );

            }
          );


          button.classList.add(
            "selected"
          );


          button.setAttribute(
            "aria-pressed",
            "true"
          );


          selectedBudget =
            button.dataset.budget || "";


          const hiddenInput =
            document.getElementById(
              "selectedBudget"
            );


          if (hiddenInput) {

            hiddenInput.value =
              selectedBudget;

          }


          toggleCustomBudgetField();

          updateSubmitButton();

        }
      );

    }
  );

}


/* ========================================
   CUSTOM BUDGET FIELD
======================================== */

function toggleCustomBudgetField() {

  const field =
    document.getElementById(
      "customBudgetField"
    );


  const input =
    document.getElementById(
      "customBudget"
    );


  if (
    !field ||
    !input
  ) {
    return;
  }


  const shouldShow =
    selectedBudget ===
    "自由入力";


  field.classList.toggle(
    "hidden",
    !shouldShow
  );


  input.required =
    shouldShow;


  if (shouldShow) {

    input.focus();

  } else {

    input.value = "";

  }

}


/* ========================================
   CUSTOM INPUT EVENTS
======================================== */

function setupCustomInputs() {

  const otherOccasion =
    document.getElementById(
      "otherOccasion"
    );


  const customBudget =
    document.getElementById(
      "customBudget"
    );


  otherOccasion?.addEventListener(
    "input",
    updateSubmitButton
  );


  customBudget?.addEventListener(
    "input",
    updateSubmitButton
  );

}


/* ========================================
   UPDATE SUBMIT BUTTON
======================================== */

function updateSubmitButton() {

  const submitButton =
    document.getElementById(
      "aiTalkSubmitButton"
    );


  if (!submitButton) {
    return;
  }


  const otherOccasion =
    document.getElementById(
      "otherOccasion"
    )?.value
      .trim() || "";


  const customBudget =
    document.getElementById(
      "customBudget"
    )?.value || "";


  const occasionIsValid =
    selectedOccasion !== "" &&
    (
      selectedOccasion !== "その他" ||
      otherOccasion !== ""
    );


  const budgetIsValid =
    selectedBudget !== "" &&
    (
      selectedBudget !== "自由入力" ||
      (
        customBudget !== "" &&
        Number(customBudget) > 0
      )
    );


  submitButton.disabled =
    !(
      occasionIsValid &&
      budgetIsValid
    );

}


/* ========================================
   FORM
======================================== */

function setupForm() {

  const form =
    document.getElementById(
      "aiTalkForm"
    );


  form?.addEventListener(
    "submit",
    event => {

      event.preventDefault();


      if (!validateForm()) {
        return;
      }


      const consultationData =
        createConsultationData();


      /*
        次の工程で、このデータを
        Supabase Edge Functionへ送信する
      */
      console.log(
        "AI相談データ:",
        consultationData
      );


      showTemporaryResult(
        consultationData
      );

    }
  );

}


/* ========================================
   VALIDATE FORM
======================================== */

function validateForm() {

  const message =
    document.getElementById(
      "aiTalkFormMessage"
    );


  if (message) {

    message.textContent = "";

  }


  if (
    !selectedOccasion ||
    !selectedBudget
  ) {

    if (message) {

      message.textContent =
        "贈る目的と予算を選択してください。";

    }


    return false;

  }


  if (
    selectedOccasion === "その他" &&
    !document
      .getElementById(
        "otherOccasion"
      )
      ?.value
      .trim()
  ) {

    if (message) {

      message.textContent =
        "贈る目的を入力してください。";

    }


    return false;

  }


  const customBudget =
    document.getElementById(
      "customBudget"
    )?.value;


  if (
    selectedBudget === "自由入力" &&
    (
      !customBudget ||
      Number(customBudget) <= 0
    )
  ) {

    if (message) {

      message.textContent =
        "予算を入力してください。";

    }


    return false;

  }


  return true;

}


/* ========================================
   CREATE CONSULTATION DATA
======================================== */

function createConsultationData() {

  const otherOccasion =
    document.getElementById(
      "otherOccasion"
    )?.value
      .trim() || "";


  const customBudget =
    document.getElementById(
      "customBudget"
    )?.value || "";


  const additionalRequest =
    document.getElementById(
      "additionalRequest"
    )?.value
      .trim() || "";


  return {

    person:
      currentPerson,

    giftHistory:
      giftLogs,

    occasion:
      selectedOccasion === "その他"
        ? otherOccasion
        : selectedOccasion,

    budget:
      selectedBudget === "自由入力"
        ? `${customBudget}円`
        : selectedBudget,

    additionalRequest:
      additionalRequest

  };

}


/* ========================================
   TEMPORARY RESULT
======================================== */

function showTemporaryResult(
  consultationData
) {

  const result =
    document.getElementById(
      "aiTalkResult"
    );


  const list =
    document.getElementById(
      "aiTalkSuggestionList"
    );


  if (
    !result ||
    !list
  ) {
    return;
  }


  list.innerHTML = "";


  const card =
    document.createElement(
      "article"
    );


  card.className =
    "ai-talk-suggestion-card";


  const heading =
    document.createElement(
      "h3"
    );


  heading.textContent =
    "相談条件を確認しました";


  const budget =
    document.createElement(
      "span"
    );


  budget.className =
    "ai-talk-suggestion-budget";


  budget.textContent =
    consultationData.budget;


  const description =
    document.createElement(
      "p"
    );


  description.textContent =
    "画面の入力処理は正常に動作しています。" +
    "次の工程でAIからプレゼント候補を取得する処理を接続します。";


  card.appendChild(
    heading
  );


  card.appendChild(
    budget
  );


  card.appendChild(
    description
  );


  list.appendChild(
    card
  );


  result.classList.remove(
    "hidden"
  );


  result.scrollIntoView(
    {
      behavior: "smooth",
      block: "start"
    }
  );

}


/* ========================================
   DISPLAY CONTROL
======================================== */

function showContent() {

  document
    .getElementById(
      "aiTalkLoading"
    )
    ?.classList
    .add(
      "hidden"
    );


  document
    .getElementById(
      "aiTalkError"
    )
    ?.classList
    .add(
      "hidden"
    );


  document
    .getElementById(
      "aiTalkContent"
    )
    ?.classList
    .remove(
      "hidden"
    );

}


/* ========================================
   SHOW ERROR
======================================== */

function showError(
  errorMessage
) {

  document
    .getElementById(
      "aiTalkLoading"
    )
    ?.classList
    .add(
      "hidden"
    );


  document
    .getElementById(
      "aiTalkContent"
    )
    ?.classList
    .add(
      "hidden"
    );


  const error =
    document.getElementById(
      "aiTalkError"
    );


  const message =
    document.getElementById(
      "aiTalkErrorMessage"
    );


  if (message) {

    message.textContent =
      errorMessage;

  }


  error?.classList.remove(
    "hidden"
  );

}