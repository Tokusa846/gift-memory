/* ========================================
   NAVIGATION UTILITIES
======================================== */

/**
 * URLパラメータから戻り先を取得する
 *
 * return_to が存在しない場合や、
 * 外部サイトが指定されている場合は null を返す。
 */
export function getReturnUrl() {

  const params =
    new URLSearchParams(window.location.search);

  const returnTo =
    params.get("return_to");

  if (!returnTo) {
    return null;
  }

  try {

    const url =
      new URL(returnTo, window.location.href);

    // 外部サイトへの遷移を防止
    if (url.origin !== window.location.origin) {
      return null;
    }

    // アプリ内のHTML画面のみ許可
    if (!url.pathname.endsWith(".html")) {
      return null;
    }

    return url.href;

  } catch (error) {

    console.warn(
      "戻り先URLが不正です:",
      error
    );

    return null;

  }

}


/**
 * 戻るボタンのリンク先を設定する
 *
 * return_to がない場合は、
 * HTMLに設定された既存のhrefを維持する。
 */
export function setupBackLink(selector) {

  const backLink =
    document.querySelector(selector);

  if (!backLink) {
    return;
  }

  const returnUrl =
    getReturnUrl();

  if (!returnUrl) {
    return;
  }

  backLink.href = returnUrl;

}


/**
 * 遷移先URLに戻り先を追加する
 *
 * @param {string} destinationUrl 遷移先URL
 * @param {string} returnUrl 戻り先URL
 */
export function buildUrlWithReturnTo(
  destinationUrl,
  returnUrl
) {

  const url =
    new URL(destinationUrl, window.location.href);

  url.searchParams.set(
    "return_to",
    returnUrl
  );

  return url.href;

}