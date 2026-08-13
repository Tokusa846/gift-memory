import { supabase } from "./supabase.js";


/* ========================================
   ELEMENTS
======================================== */

const personForm =
  document.getElementById("person-form");

const nameInput =
  document.getElementById("name");

const birthdayInput =
  document.getElementById("birthday");

const relationshipInput =
  document.getElementById("relationship");

const likesInput =
  document.getElementById("likes");

const dislikesInput =
  document.getElementById("dislikes");

const allergiesInput =
  document.getElementById("allergies");

const memoInput =
  document.getElementById("memo");

const message =
  document.getElementById("message");


/* ========================================
   SUBMIT
======================================== */

personForm.addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();

    message.textContent = "";


    /* -------------------------
       INPUT DATA
    ------------------------- */

    const name =
      nameInput.value.trim();

    const birthday =
      birthdayInput.value;

    const relationship =
      relationshipInput.value;

    const likes =
      likesInput.value.trim();

    const dislikes =
      dislikesInput.value.trim();

    const allergies =
      allergiesInput.value.trim();

    const memo =
      memoInput.value.trim();


    /* -------------------------
       VALIDATION
    ------------------------- */

    if (!name) {

      message.textContent =
        "名前を入力してください。";

      return;
    }


    /* -------------------------
       INSERT DATA
    ------------------------- */

    const personData = {

      name: name,

      birthday:
        birthday || null,

      relationship:
        relationship || null,

      likes:
        likes || null,

      dislikes:
        dislikes || null,

      allergies:
        allergies || null,

      memo:
        memo || null

    };


    /* -------------------------
       SAVE TO SUPABASE
    ------------------------- */

    const { data, error } =
      await supabase
        .from("people")
        .insert([
          personData
        ])
        .select();


    /* -------------------------
       ERROR
    ------------------------- */

    if (error) {

      console.error(
        "人物登録エラー:",
        error
      );

      message.textContent =
        "人物の登録に失敗しました。";

      return;
    }


    /* -------------------------
       SUCCESS
    ------------------------- */

    console.log(
      "登録成功:",
      data
    );

    message.textContent =
      "人物を登録しました。";


    personForm.reset();

  }
);