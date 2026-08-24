/* Import */
import { supabase } from "./supabase.js";


/* ========================================
   STATE
======================================== */

let currentPerson = null;

let giftLogs = [];

let selectedOccasion = "";

let selectedBudget = "";

let consultationMode =
  "general";

let recipientType = "";

let peopleOptions = [];


/* ========================================
   INITIALIZE
======================================== */

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    setupBackButton();

    setupBackButton();

    setupRecipientSelection();

    setupOccasionOptions();

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

      consultationMode =
        "general";


      await loadPeopleOptions();


      renderGeneralConsultation();

      showContent();

      return;

    }


    consultationMode =
      "personal";


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

    const informationTitle =
    document.getElementById(
      "personInformationTitle"
    );

    const container =
    document.getElementById(
      "aiTalkPersonInfo"
    );


  if (
    !container ||
    !currentPerson
  ) {
    return;
  }

  if (informationTitle) {

    informationTitle.textContent =
      `${currentPerson.name}さんの記録情報`;

  }


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


    addGiftHistoryReference(
    container
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
   ADD GIFT HISTORY REFERENCE
======================================== */

function addGiftHistoryReference(
  container
) {

  if (
    giftLogs.length === 0
  ) {
    return;
  }


  const receivedGifts =
    giftLogs.filter(
      gift =>
        gift.direction ===
        "received"
    );


  const givenGifts =
    giftLogs.filter(
      gift =>
        gift.direction ===
        "given"
    );


  const wrapper =
    document.createElement(
      "div"
    );


  wrapper.className =
    "ai-talk-person-row ai-talk-gift-history";


  const label =
    document.createElement(
      "span"
    );


  label.className =
    "ai-talk-person-label";


  label.textContent =
    "過去の贈り物";


  const groups =
    document.createElement(
      "div"
    );


  groups.className =
    "ai-talk-gift-history-groups";


  /*
    もらったプレゼントを上に表示
  */
  if (
    receivedGifts.length > 0
  ) {

    groups.appendChild(
      createGiftHistoryReferenceGroup(
        receivedGifts,
        "received"
      )
    );

  }


  /*
    贈ったプレゼントを下に表示
  */
  if (
    givenGifts.length > 0
  ) {

    groups.appendChild(
      createGiftHistoryReferenceGroup(
        givenGifts,
        "given"
      )
    );

  }


  wrapper.appendChild(
    label
  );


  wrapper.appendChild(
    groups
  );


  container.appendChild(
    wrapper
  );

}


/* ========================================
   CREATE GIFT HISTORY REFERENCE GROUP
======================================== */

function createGiftHistoryReferenceGroup(
  gifts,
  direction
) {

  const group =
    document.createElement(
      "div"
    );


  group.className =
    "ai-talk-gift-history-group";


  const icon =
    document.createElement(
      "span"
    );


  icon.className =
    `ai-talk-gift-history-icon ${direction}`;


  const iconElement =
    document.createElement(
      "i"
    );


  iconElement.className =
    "fa-solid fa-gift";


  icon.appendChild(
    iconElement
  );


  const text =
    document.createElement(
      "p"
    );


  text.className =
    "ai-talk-gift-history-text";


  text.textContent =
    gifts
      .map(
        gift =>
          formatGiftHistoryReferenceItem(
            gift
          )
      )
      .join("、");


  group.appendChild(
    icon
  );


  group.appendChild(
    text
  );


  return group;

}


/* ========================================
   FORMAT GIFT HISTORY REFERENCE ITEM
======================================== */

function formatGiftHistoryReferenceItem(
  gift
) {

  const itemName =
    gift.item_name ||
    "内容未登録";


  const occasion =
    gift.occasion
      ? `（${gift.occasion}）`
      : "";


  return (
    `${itemName}${occasion}`
  );

}


/* ========================================
   GENERAL CONSULTATION
======================================== */

function renderGeneralConsultation() {

  const title =
    document.getElementById(
      "aiTalkPersonTitle"
    );


  const recipientSection =
    document.getElementById(
      "recipientSelectionSection"
    );


  const personSection =
    document.getElementById(
      "personInformationSection"
    );


  if (title) {

    title.textContent =
      "プレゼントを一緒に考えます";

  }


  recipientSection?.classList.remove(
    "hidden"
  );


  personSection?.classList.add(
    "hidden"
  );


  renderPeopleOptions();

}

/* ========================================
   LOAD PEOPLE OPTIONS
======================================== */

async function loadPeopleOptions() {

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


    peopleOptions = [];

    return;

  }


  peopleOptions =
    data ?? [];

}


/* ========================================
   RENDER PEOPLE OPTIONS
======================================== */

function renderPeopleOptions() {

  const select =
    document.getElementById(
      "registeredPersonSelect"
    );


  const message =
    document.getElementById(
      "registeredPersonMessage"
    );


  if (!select) {
    return;
  }


  select.innerHTML = "";


  const defaultOption =
    document.createElement(
      "option"
    );


  defaultOption.value = "";

  defaultOption.textContent =
    "選択してください";


  select.appendChild(
    defaultOption
  );


  peopleOptions.forEach(
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


  if (
    message &&
    peopleOptions.length === 0
  ) {

    message.textContent =
      "登録済みの人物がいません。";

  } else if (message) {

    message.textContent = "";

  }

}


/* ========================================
   SETUP RECIPIENT SELECTION
======================================== */

function setupRecipientSelection() {

  const typeButtons =
    document.querySelectorAll(
      ".ai-talk-recipient-type-button"
    );


  const personSelect =
    document.getElementById(
      "registeredPersonSelect"
    );


  const relationshipInput =
    document.getElementById(
      "recipientRelationship"
    );


  typeButtons.forEach(
    button => {

      button.addEventListener(
        "click",
        () => {

          selectRecipientType(
            button.dataset.recipientType || ""
          );

        }
      );

    }
  );


  personSelect?.addEventListener(
    "change",
    async event => {

      await selectRegisteredPerson(
        event.target.value
      );

    }
  );


  relationshipInput?.addEventListener(
    "input",
    updateSubmitButton
  );

}


/* ========================================
   SELECT RECIPIENT TYPE
======================================== */

function selectRecipientType(
  type
) {

  recipientType =
    type;


  const buttons =
    document.querySelectorAll(
      ".ai-talk-recipient-type-button"
    );


  const registeredField =
    document.getElementById(
      "registeredRecipientField"
    );


  const unregisteredField =
    document.getElementById(
      "unregisteredRecipientField"
    );


  const personSection =
    document.getElementById(
      "personInformationSection"
    );


  buttons.forEach(
    button => {

      const isSelected =
        button.dataset.recipientType ===
        type;


      button.classList.toggle(
        "selected",
        isSelected
      );


      button.setAttribute(
        "aria-pressed",
        String(isSelected)
      );

    }
  );


  registeredField?.classList.toggle(
    "hidden",
    type !== "registered"
  );


  unregisteredField?.classList.toggle(
    "hidden",
    type !== "unregistered"
  );


  /*
    相手の種類を切り替えたら
    選択済み人物を一度解除
  */
  currentPerson = null;

  giftLogs = [];


  const personSelect =
    document.getElementById(
      "registeredPersonSelect"
    );


  if (personSelect) {

    personSelect.value = "";

  }


  personSection?.classList.add(
    "hidden"
  );


  resetGeneralConsultationTitle();

  updateSubmitButton();

}


/* ========================================
   SELECT REGISTERED PERSON
======================================== */

async function selectRegisteredPerson(
  personId
) {

  const personSection =
    document.getElementById(
      "personInformationSection"
    );


  if (!personId) {

    currentPerson = null;

    giftLogs = [];


    personSection?.classList.add(
      "hidden"
    );


    resetGeneralConsultationTitle();

    updateSubmitButton();

    return;

  }


  currentPerson =
    peopleOptions.find(
      person =>
        String(person.id) ===
        String(personId)
    ) || null;


  if (!currentPerson) {

    personSection?.classList.add(
      "hidden"
    );


    updateSubmitButton();

    return;

  }


  await loadGiftLogs(
    currentPerson.id
  );


  renderPersonInformation();


  personSection?.classList.remove(
    "hidden"
  );


  updateSubmitButton();

}


/* ========================================
   RESET GENERAL TITLE
======================================== */

function resetGeneralConsultationTitle() {

  const title =
    document.getElementById(
      "aiTalkPersonTitle"
    );


  if (title) {

    title.textContent =
      "プレゼントを一緒に考えます";

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


  const relationship =
    document.getElementById(
      "recipientRelationship"
    )?.value || "";


  /*
    贈る相手の入力確認
  */
  let recipientIsValid = false;


  if (
    consultationMode ===
    "personal"
  ) {

    recipientIsValid =
      currentPerson !== null;

  } else if (
    recipientType ===
    "registered"
  ) {

    recipientIsValid =
      currentPerson !== null;

  } else if (
    recipientType ===
    "unregistered"
  ) {

    recipientIsValid =
      relationship !== "";

  }


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
      recipientIsValid &&
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


  /*
    一般相談：相手の種類
  */
  if (
    consultationMode === "general" &&
    !recipientType
  ) {

    if (message) {

      message.textContent =
        "贈る相手を選択してください。";

    }


    return false;

  }


  /*
    一般相談：登録済み人物
  */
  if (
    consultationMode === "general" &&
    recipientType === "registered" &&
    !currentPerson
  ) {

    if (message) {

      message.textContent =
        "登録済みの人物を選択してください。";

    }


    return false;

  }


  /*
    一般相談：登録なし
  */
  const relationship =
    document.getElementById(
      "recipientRelationship"
    )?.value || "";


  if (
    consultationMode === "general" &&
    recipientType === "unregistered" &&
    !relationship
  ) {

    if (message) {

      message.textContent =
        "相手との関係を選択してください。";

    }


    return false;

  }


  /*
    贈る目的
  */
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


  /*
    自由入力の予算
  */
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


  const relationship =
    document.getElementById(
      "recipientRelationship"
    )?.value || "";


  const ageGroup =
    document.getElementById(
      "recipientAgeGroup"
    )?.value || "";


  const likes =
    document.getElementById(
      "recipientLikes"
    )?.value
      .trim() || "";


  const avoid =
    document.getElementById(
      "recipientAvoid"
    )?.value
      .trim() || "";


  /*
    登録していない相手の情報
  */
  const unregisteredRecipient =
    (
      consultationMode === "general" &&
      recipientType === "unregistered"
    )
      ? {
          relationship:
            relationship,

          ageGroup:
            ageGroup,

          likes:
            likes,

          avoid:
            avoid
        }
      : null;


  return {

    mode:
      consultationMode,

    recipientType:
      consultationMode === "personal"
        ? "registered"
        : recipientType,

    person:
      currentPerson,

    unregisteredRecipient:
      unregisteredRecipient,

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