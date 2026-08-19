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