/* インデント
    - export function openModal() {}
    - export function closeModal() {}
    - export function setupModalClose() {}
    - export function setupModalEscape() {}


*/



/* ========================================
   MODAL COMMON
======================================== */

export function openModal(
  modalId
) {

  const modal =
    document.getElementById(
      modalId
    );


  if (!modal) {
    return;
  }


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


export function closeModal(
  modalId
) {

  const modal =
    document.getElementById(
      modalId
    );


  if (!modal) {
    return;
  }


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
   MODAL CLOSE SETUP
======================================== */

export function setupModalClose(
  modalId,
  closeButtonId,
  cancelButtonId
) {

  const modal =
    document.getElementById(
      modalId
    );


  const closeButton =
    document.getElementById(
      closeButtonId
    );


  const cancelButton =
    document.getElementById(
      cancelButtonId
    );


  if (!modal) {
    return;
  }


  /* ×ボタン */

  if (closeButton) {

    closeButton.addEventListener(
      "click",
      () => {

        closeModal(
          modalId
        );

      }
    );

  }


  /* キャンセル */

  if (cancelButton) {

    cancelButton.addEventListener(
      "click",
      () => {

        closeModal(
          modalId
        );

      }
    );

  }


  /* 背景クリック */

  modal.addEventListener(
    "click",
    event => {

      if (
        event.target === modal
      ) {

        closeModal(
          modalId
        );

      }

    }
  );

}

/* ========================================
   MODAL ESCAPE
======================================== */

export function setupModalEscape() {

  document.addEventListener(
    "keydown",
    event => {

      if (
        event.key !==
        "Escape"
      ) {
        return;
      }


      const openedModal =
        document.querySelector(
          ".person-edit-overlay:not(.hidden)"
        );


      if (!openedModal) {
        return;
      }


      closeModal(
        openedModal.id
      );

    }
  );

}

/* 日付詳細カード共通描画（TOP・予定画面） */
const DAY_TYPES = {
  birthday: 
    ["誕生日", "fa-solid fa-cake-candles"],
  anniversary: 
    ["記念日", "fa-solid fa-heart"],
  celebration: 
    ["お祝い", "fa-solid fa-champagne-glasses"],
  gift: 
    ["プレゼント予定", "fa-solid fa-gift"],
  other: 
    ["その他", "fa-solid fa-star"],
  given: 
    ["あげたプレゼント", "fa-solid fa-gift"],
  received: 
    ["もらったプレゼント", "fa-solid fa-gift"]
};

/** items: [{type, title, personName, href}] */
export function renderDateDetailCards(container, items) {
  if (
    !container
  ) return;
  
  container.replaceChildren();

  if (
    !items.length
  ) {
    const empty = 
      document.createElement("div");
    empty.className = "gm-day-empty";

    const icon = 
      document.createElement("i");
    icon.className = "fa-regular fa-calendar";

    const message = 
      document.createElement("span");
    message.textContent = "表示する予定・履歴がありません";
    empty.append(icon, message);

    container.appendChild(empty);

    return;

  }

  for (
    const item of items
  ) {
    const type = 
      Object.hasOwn(DAY_TYPES, item.type) ? item.type : "other";
    const [label, iconName] = DAY_TYPES[type];
    const card = document.createElement("a");
    card.className = `gm-day-card ${type}`;
    card.href = item.href || "#";
    const iconBox = document.createElement("span");
    iconBox.className = "gm-day-card-icon";
    const icon = document.createElement("i");
    icon.className = iconName;
    iconBox.append(icon);
    const body = document.createElement("span");
    body.className = "gm-day-card-body";
    const meta = document.createElement("span");
    meta.className = "gm-day-card-meta";
    const typeLabel = document.createElement("span");
    typeLabel.className = "gm-day-card-type";
    typeLabel.textContent = label;
    meta.append(typeLabel);

    // 誕生日はタイトルに人物名が含まれるため、別表示しない
    if (type !== "birthday" && item.personName) {
      const person = document.createElement("span");
      person.className = "gm-day-card-person";
      person.textContent = item.personName;
      meta.append(person);
    }
    const title = document.createElement("span");
    title.className = "gm-day-card-title";
    title.textContent = item.title || "イベント";
    body.append(meta, title);
    const arrow = document.createElement("span");
    arrow.className = "gm-day-card-arrow";
    const arrowIcon = document.createElement("i");
    arrowIcon.className = "fa-solid fa-chevron-right";
    arrow.append(arrowIcon);
    card.append(iconBox, body, arrow);
    container.append(card);
  }
}
