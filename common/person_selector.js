
/**
 * 人物選択モーダル（Supabaseには依存しない共通UI）
 * createPersonSelector({ people, selectedId, onSelect })
 *   people: [{ id, name, furigana? }]
 *   onSelect: ({ id, name } | null) => void
 */
export function createPersonSelector({ people = [], selectedId = null, onSelect = () => {} } = {}) {
  const normalizedPeople = people.map(person => ({
    ...person,
    id: String(person.id),
    name: String(person.name ?? ""),
    furigana: String(person.furigana ?? "")
  }));
  let currentId = selectedId == null || selectedId === "" ? null : String(selectedId);
  let previousFocus = null;

  const overlay = document.createElement("div");
  overlay.className = "person-selector-overlay";
  overlay.hidden = true;
  overlay.innerHTML = `
    <section class="person-selector-dialog" role="dialog" aria-modal="true" aria-labelledby="personSelectorTitle">
      <header class="person-selector-header">
        <h2 id="personSelectorTitle">人物を選択</h2>
        <button type="button" class="person-selector-close" aria-label="閉じる">×</button>
      </header>
      <div class="person-selector-search-wrap">
        <input type="search" class="person-selector-search" placeholder="名前・ふりがなで検索" aria-label="名前・ふりがなで検索" autocomplete="off">
      </div>
      <div class="person-selector-results" role="listbox" aria-label="人物一覧"></div>
      <footer class="person-selector-footer">
        <button type="button" class="person-selector-clear">人物を選択しない</button>
      </footer>
    </section>`;
  document.body.appendChild(overlay);

  const dialog = overlay.querySelector(".person-selector-dialog");
  const search = overlay.querySelector(".person-selector-search");
  const results = overlay.querySelector(".person-selector-results");
  const closeButton = overlay.querySelector(".person-selector-close");
  const clearButton = overlay.querySelector(".person-selector-clear");

  const normalize = value => String(value ?? "").normalize("NFKC").toLocaleLowerCase("ja-JP").replace(/\s+/g, "");

  function render() {
    const keyword = normalize(search.value);
    const matched = normalizedPeople.filter(person =>
      normalize(person.name).includes(keyword) || normalize(person.furigana).includes(keyword)
    );
    results.replaceChildren();
    if (!matched.length) {
      const empty = document.createElement("p");
      empty.className = "person-selector-empty";
      empty.textContent = "該当する人物がいません";
      results.appendChild(empty);
      return;
    }
    for (const person of matched) {
      const option = document.createElement("button");
      option.type = "button";
      option.className = "person-selector-option";
      option.setAttribute("role", "option");
      option.setAttribute("aria-selected", String(person.id === currentId));
      const avatar = document.createElement("span");
      avatar.className = "person-selector-avatar";
      avatar.setAttribute("aria-hidden", "true");
      avatar.textContent = "人";
      const text = document.createElement("span");
      text.className = "person-selector-person-text";
      const name = document.createElement("span");
      name.className = "person-selector-name";
      name.textContent = person.name;
      text.appendChild(name);
      if (person.furigana) {
        const reading = document.createElement("span");
        reading.className = "person-selector-reading";
        reading.textContent = person.furigana;
        text.appendChild(reading);
      }
      option.append(avatar, text);
      option.addEventListener("click", () => {
        currentId = person.id;
        onSelect({ id: person.id, name: person.name });
        close();
      });
      results.appendChild(option);
    }
  }

  function open() {
    if (!overlay.hidden) return;
    previousFocus = document.activeElement;
    search.value = "";
    render();
    overlay.hidden = false;
    document.body.classList.add("person-selector-open");
    search.focus();
  }

  function close() {
    if (overlay.hidden) return;
    overlay.hidden = true;
    document.body.classList.remove("person-selector-open");
    if (previousFocus?.isConnected) previousFocus.focus();
  }

  function handleKeydown(event) {
    if (overlay.hidden) return;
    if (event.key === "Escape") {
      event.preventDefault();
      close();
    } else if (event.key === "Tab") {
      const focusables = [...dialog.querySelectorAll('button:not([disabled]), input:not([disabled])')];
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  }

  search.addEventListener("input", render);
  closeButton.addEventListener("click", close);
  clearButton.addEventListener("click", () => {
    currentId = null;
    onSelect(null);
    close();
  });
  overlay.addEventListener("click", event => {
    if (event.target === overlay) close();
  });
  document.addEventListener("keydown", handleKeydown);

  return {
    open,
    close,
    setSelectedId(id) {
      currentId = id == null || id === "" ? null : String(id);
    },
    setPeople(people) {
      normalizedPeople.splice(0, normalizedPeople.length, ...people.map(person => ({
        ...person,
        id: String(person.id),
        name: String(person.name ?? ""),
        furigana: String(person.furigana ?? "")
      })));
      if (!overlay.hidden) render();
    },
    destroy() {
      close();
      document.removeEventListener("keydown", handleKeydown);
      overlay.remove();
    }
  };
}
