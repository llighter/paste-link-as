/* Paste Link As: paste a URL as a titled link, then pick a format from the menu under it: keep, mention, or card.
   - Pages are read directly from the pasted site (no third-party service). Thumbnails and favicons are
     saved into the vault, so cards keep working when the original image goes away.
   - Output is plain Markdown: a link, or a [!link] callout. Notes stay readable without this plugin;
     only the look (styles.css) goes away.
   - The format menu borrows Obsidian's suggestion styles but is opened by the plugin itself:
     EditorSuggest opens while typing, so it isn't guaranteed to open right after a paste. */
"use strict";
const { Plugin, PluginSettingTab, Setting, Modal, Notice, TFile, normalizePath, requestUrl, getLanguage } = require("obsidian");

const DEFAULTS = { folder: "" };   // "" = Obsidian's attachment location
const UA = { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36", "Accept-Language": "ko,en;q=0.8" };
const ICON_EXT = { "image/png": "png", "image/svg+xml": "svg", "image/jpeg": "jpg", "image/webp": "webp", "image/gif": "gif" };
const THUMB_EXT = { "image/png": "png", "image/webp": "webp", "image/gif": "gif", "image/svg+xml": "svg" };   // anything else: jpg
const ICON_EXTS = ["png", "svg", "jpg", "jpeg", "webp", "gif"];
const THUMB_EXTS = ["jpg", "png", "webp", "gif", "svg"];

// ── UI text in Obsidian's language: the exact code, then its base language (zh-TW → zh), then English.
//    A string missing from a translation falls back to English. Keys are lowercase language codes. ──
const TEXT = {
  en: {
    keep: "Keep", keepNote: "Titled link",
    mention: "Mention", mentionNote: "Favicon, site name and title in one line",
    card: "Card", cardNote: "Thumbnail, description and domain",
    toCard: "Turn link into card", toMention: "Turn link into mention",
    ask: "Link address", noUrl: "No link address found.",
    noTitle: "Couldn't fetch the title", failed: "Couldn't convert the link", lost: "the pasted link is gone",
    makingCard: "Making card…", makingMention: "Making mention…",
    folder: "Image folder",
    folderDesc: "Where thumbnails and favicons are saved. Leave empty to use the attachment location from Obsidian's settings.",
  },
  ko: {
    keep: "그대로", keepNote: "제목 링크",
    mention: "멘션", mentionNote: "파비콘 · 사이트명 · 제목 한 줄",
    card: "카드", cardNote: "썸네일 · 설명 · 도메인",
    toCard: "주소를 카드로", toMention: "주소를 멘션으로",
    ask: "링크 주소", noUrl: "링크 주소를 찾지 못함",
    noTitle: "제목을 가져오지 못함", failed: "바꾸지 못함", lost: "넣은 자리를 찾지 못함",
    makingCard: "카드 만드는 중…", makingMention: "멘션 만드는 중…",
    folder: "이미지 폴더",
    folderDesc: "썸네일과 파비콘을 저장할 폴더. 비워 두면 Obsidian 설정의 첨부파일 위치를 쓴다.",
  },
  zh: {
    keep: "保持", keepNote: "带标题的链接",
    mention: "提及", mentionNote: "图标、网站名称和标题显示在一行",
    card: "卡片", cardNote: "缩略图、描述和域名",
    toCard: "将链接转为卡片", toMention: "将链接转为提及",
    ask: "链接地址", noUrl: "未找到链接地址。",
    noTitle: "无法获取标题", failed: "无法转换链接", lost: "找不到粘贴的链接",
    makingCard: "正在生成卡片…", makingMention: "正在生成提及…",
    folder: "图片文件夹",
    folderDesc: "缩略图和网站图标的保存位置。留空则使用 Obsidian 设置中的附件位置。",
  },
  ja: {
    keep: "そのまま", keepNote: "タイトル付きリンク",
    mention: "メンション", mentionNote: "ファビコン・サイト名・タイトルを1行で",
    card: "カード", cardNote: "サムネイル・説明・ドメイン",
    toCard: "リンクをカードに変換", toMention: "リンクをメンションに変換",
    ask: "リンクのURL", noUrl: "リンクのURLが見つかりません。",
    noTitle: "タイトルを取得できませんでした", failed: "リンクを変換できませんでした", lost: "貼り付けたリンクが見つかりません",
    makingCard: "カードを作成中…", makingMention: "メンションを作成中…",
    folder: "画像フォルダ",
    folderDesc: "サムネイルとファビコンの保存先です。空欄にすると、Obsidian の設定にある添付ファイルの場所を使います。",
  },
  es: {
    keep: "Mantener", keepNote: "Enlace con título",
    mention: "Mención", mentionNote: "Favicon, nombre del sitio y título en una línea",
    card: "Tarjeta", cardNote: "Miniatura, descripción y dominio",
    toCard: "Convertir enlace en tarjeta", toMention: "Convertir enlace en mención",
    ask: "Dirección del enlace", noUrl: "No se encontró ninguna dirección de enlace.",
    noTitle: "No se pudo obtener el título", failed: "No se pudo convertir el enlace", lost: "el enlace pegado ya no está",
    makingCard: "Creando tarjeta…", makingMention: "Creando mención…",
    folder: "Carpeta de imágenes",
    folderDesc: "Dónde se guardan las miniaturas y los favicons. Déjala vacía para usar la ubicación de los archivos adjuntos de la configuración de Obsidian.",
  },
  fr: {
    keep: "Garder", keepNote: "Lien avec titre",
    mention: "Mention", mentionNote: "Favicon, nom du site et titre sur une ligne",
    card: "Carte", cardNote: "Miniature, description et domaine",
    toCard: "Transformer le lien en carte", toMention: "Transformer le lien en mention",
    ask: "Adresse du lien", noUrl: "Aucune adresse de lien trouvée.",
    noTitle: "Impossible de récupérer le titre", failed: "Impossible de convertir le lien", lost: "le lien collé est introuvable",
    makingCard: "Création de la carte…", makingMention: "Création de la mention…",
    folder: "Dossier des images",
    folderDesc: "Emplacement des miniatures et des favicons. Laissez vide pour utiliser l'emplacement des pièces jointes défini dans les paramètres d'Obsidian.",
  },
};
const LANG = String((typeof getLanguage === "function" && getLanguage()) || "en").toLowerCase();   // Obsidian's display language
const T = Object.assign({}, TEXT.en, TEXT[LANG.split("-")[0]], TEXT[LANG]);

// ── Text helpers ──
const clean = s => String(s ?? "").replace(/\s+/g, " ").trim();
const escLink = s => s.replace(/([\[\]])/g, "\\$1");          // link and card titles
const escMention = s => s.replace(/([\[\]*_])/g, "\\$1");     // mentions: keep the site name's *italics* intact
const header = (res, k) => (Object.entries(res.headers || {}).find(([h]) => h.toLowerCase() === k) || [])[1] || "";
const absUrl = (u, base) => { try { return u ? new URL(u, base).href : ""; } catch (e) { return ""; } };
const isOnlyUrl = s => /^https?:\/\/[^\s<>]+$/i.test(s);
const isImageUrl = s => /\.(png|jpe?g|gif|webp|svg|bmp|avif|ico)([?#].*)?$/i.test(s);
const folderOf = s => { const f = clean(s); return f && f !== "/" ? normalizePath(f) : ""; };
const join = (folder, name) => normalizePath(folder ? `${folder}/${name}` : name);

// Find a URL: keep balanced parentheses (Wikipedia), drop the closing one of [title](url)
function findUrl(s) {
  let u = (String(s ?? "").match(/https?:\/\/[^\s<>\]]+/) || [])[0];
  while (u && u.endsWith(")") && (u.match(/\(/g) || []).length < (u.match(/\)/g) || []).length) u = u.slice(0, -1);
  return u;
}

// ── Output formats ──
const linkText = p => `[${escLink(p.title)}](${p.url})`;
const mentionText = (p, favicon) => `[${favicon ? `![|16](${favicon}) ` : ""}*${escMention(p.site)}* ${escMention(p.title)}](${p.url})`;
function cardLines(p, favicon, thumb) {
  const lines = [`> [!link] [${escLink(p.title)}](${p.url})`];
  if (thumb) lines.push(`> ![[${thumb}]]`, ">");                          // thumbnail, description and domain as separate paragraphs
  if (p.desc) lines.push(`> ${escLink(p.desc).replace(/^([#>\-])/, "\\$1")}`, ">");
  lines.push(`> ${favicon ? `![[${favicon}|16]] ` : ""}${p.url}`);        // last line: favicon + link address
  return lines;
}

// ── Reading a page, straight from the site ──
async function readPage(url) {
  const res = await requestUrl({ url, headers: UA });
  let html = new TextDecoder("utf-8").decode(res.arrayBuffer);
  const cs = (header(res, "content-type").match(/charset=([\w-]+)/i) || html.match(/<meta[^>]+charset=["']?([\w-]+)/i) || [])[1];
  if (cs && !/utf-?8/i.test(cs)) { try { html = new TextDecoder(cs).decode(res.arrayBuffer); } catch (e) { /* unknown label: keep utf-8 */ } }   // legacy encodings such as euc-kr
  const doc = new DOMParser().parseFromString(html, "text/html");
  const meta = (...ns) => { for (const n of ns) { const v = doc.querySelector(`meta[property="${n}"], meta[name="${n}"]`)?.content?.trim(); if (v) return v; } return ""; };
  const host = new URL(url).hostname.replace(/^www\./, "");
  let desc = clean(meta("og:description", "twitter:description", "description")).split(/[-=_~*]{5,}/)[0].trim();   // stop at a divider line (-----)
  if (desc.length > 160) desc = desc.slice(0, 159) + "…";
  const icon = ['link[rel="apple-touch-icon"]', 'link[rel~="icon"][sizes="32x32"]', 'link[rel~="icon"]'].map(s => doc.querySelector(s)).find(Boolean);
  return {
    url, host, desc,
    title: clean(meta("og:title", "twitter:title") || doc.title || url),
    // Site name: news outlet (og:article:author) → YouTube channel → site name → domain
    site: clean(meta("og:article:author") || doc.querySelector('[itemprop="author"] [itemprop="name"]')?.getAttribute("content")
      || meta("og:site_name", "application-name") || host),
    iconUrl: absUrl(icon?.getAttribute("href") || "/favicon.ico", url),
    imageUrl: absUrl(meta("og:image", "og:image:url", "twitter:image"), url),
  };
}

// Convert formats Obsidian can't show as images (.ico and the like) to PNG
async function toPng(buf, type) {
  const u = URL.createObjectURL(new Blob([buf], { type: type || "image/x-icon" }));
  try {
    const im = await new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => no(new Error("unreadable image")); i.src = u; });
    const s = Math.max(16, Math.min(im.naturalWidth || 32, 64));
    const c = document.createElement("canvas"); c.width = c.height = s;
    c.getContext("2d").drawImage(im, 0, 0, s, s);
    return await (await new Promise(r => c.toBlob(r, "image/png"))).arrayBuffer();
  } finally { URL.revokeObjectURL(u); }
}

// ── Where a paste lands ──
// Leave pastes alone inside a link target, after a quote or bracket, in code, and in properties.
// Inside lists, quotes and tables, offer no card (a card is a multi-line callout).
function pasteContext(editor, pos) {
  const line = editor.getLine(pos.line);
  const before = line.slice(0, pos.ch);
  let skip = /(\]\(|["'<\[])$/.test(before)                   // [..]( , HTML attribute, <url>, right after [
    || (before.match(/`/g) || []).length % 2 === 1;             // inline code
  if (!skip) {                                                  // fenced code block
    let fence = false;
    for (let i = 0; i < pos.line; i++) if (/^\s*(```|~~~)/.test(editor.getLine(i))) fence = !fence;
    skip = fence;
  }
  if (!skip && pos.line > 0 && editor.getLine(0).trim() === "---") {   // properties (frontmatter)
    for (let i = 1; i < editor.lineCount(); i++) if (editor.getLine(i).trim() === "---") { skip = pos.line <= i; break; }
  } else if (!skip && pos.line === 0 && line.trim() === "---") skip = true;
  const card = !/^\s*([-*+]|\d+[.)])\s|^\s*>|^\s*\|/.test(line);
  return { skip, card };
}

// Where the inserted text is now: the copy closest to where it was put (survives edits around it)
function locate(editor, text, near) {
  if (!text) return null;
  const doc = editor.getValue();
  let best = -1;
  for (let i = doc.indexOf(text); i !== -1; i = doc.indexOf(text, i + 1))
    if (best === -1 || Math.abs(i - near) < Math.abs(best - near)) best = i;
  return best === -1 ? null : { from: editor.offsetToPos(best), to: editor.offsetToPos(best + text.length) };
}

// A card is a paragraph of its own: split off text on the same line and keep a blank line after it
function cardBlock(editor, r, lines) {
  const before = editor.getLine(r.from.line).slice(0, r.from.ch);
  const after = editor.getLine(r.to.line).slice(r.to.ch);
  const next = r.to.line < editor.lastLine() ? editor.getLine(r.to.line + 1) : null;
  const lead = before.trim() ? "\n\n" : "";
  const trail = after.trim() ? "\n\n" : (next === null || next.trim() ? "\n" : "");
  return lead + lines.join("\n") + trail;
}

class PasteLinkAsPlugin extends Plugin {
  async onload() {
    this.settings = Object.assign({}, DEFAULTS, await this.loadData());
    this.pages = new Map();   // url → page info (Promise), so turning a titled link into a card doesn't fetch again
    this.icons = new Map();   // folder|host → favicon being saved (Promise), so quick pastes from one site fetch once
    this.menu = null;
    this.addSettingTab(new PasteLinkAsSettingTab(this.app, this));
    this.registerEvent(this.app.workspace.on("editor-paste", (evt, editor, info) => this.onPaste(evt, editor, info)));
    this.registerEvent(this.app.workspace.on("active-leaf-change", () => this.closeMenu()));
    this.register(() => this.closeMenu());
    this.addCommand({ id: "url-to-card", name: T.toCard, editorCallback: (editor, info) => this.fromCommand(editor, info, "card") });
    this.addCommand({ id: "url-to-mention", name: T.toMention, editorCallback: (editor, info) => this.fromCommand(editor, info, "mention") });
  }

  // ── Paste: only a lone URL is taken over; everything else goes to the default paste ──
  onPaste(evt, editor, info) {
    if (evt.defaultPrevented || !evt.clipboardData || !navigator.onLine) return;
    const url = evt.clipboardData.getData("text/plain").trim();
    if (!isOnlyUrl(url) || isImageUrl(url) || editor.listSelections().length > 1) return;
    const from = editor.getCursor("from");
    const where = pasteContext(editor, from);
    if (where.skip) return;
    evt.preventDefault();
    const sel = editor.getSelection();
    if (sel && !sel.includes("\n") && !findUrl(sel)) {           // pasting over text links that text
      editor.replaceSelection(`[${escLink(sel)}](${url})`);
      return;
    }
    editor.replaceSelection(url);                                 // put the URL in first, without waiting for the site
    const slot = { editor, info, path: info?.file?.path ?? "", url, text: url, at: editor.posToOffset(from), card: where.card };
    this.openMenu(slot);
    void this.fetchTitle(slot);
  }

  async fetchTitle(slot) {
    try {
      const p = await this.page(slot.url);
      if (!slot.busy) this.put(slot, linkText(p));                // default result: [title](url)
    } catch (e) {
      if (!slot.busy) { this.closeMenu(slot); new Notice(`${T.noTitle}: ${e.message ?? e}`); }
    }
  }

  // ── Commands: turn the selected URL (else ask for one) into a card or a mention ──
  async fromCommand(editor, info, kind) {
    const text = editor.getSelection().replace(/\s+$/, "");       // keep trailing spaces and line breaks
    const url = findUrl(text) || findUrl(await this.ask(T.ask));
    if (!url) { new Notice(T.noUrl); return; }
    const at = editor.posToOffset(editor.getCursor("from"));
    if (!text) editor.replaceSelection(url);                      // nothing selected: insert the URL, then replace it
    await this.convert({ editor, info, path: info?.file?.path ?? "", url, text: text || url, at, card: true }, kind);
  }

  async convert(slot, kind) {
    slot.busy = true;                                             // skip the pending titled-link replacement
    const notice = new Notice(kind === "card" ? T.makingCard : T.makingMention, 0);
    try {
      const p = await this.page(slot.url);
      const folder = await this.imageFolder(slot.path);
      const favicon = await this.favicon(p, folder);
      let out = mentionText(p, favicon);
      if (kind === "card") {
        const thumb = await this.thumb(p, folder);
        const r = locate(slot.editor, slot.text, slot.at);
        if (!r) throw new Error(T.lost);
        out = cardBlock(slot.editor, r, cardLines(p, favicon, thumb));
      }
      if (!this.put(slot, out)) throw new Error(T.lost);
      slot.editor.focus();
    } catch (e) {
      new Notice(`${T.failed}: ${e.message ?? e}`);
    } finally { notice.hide(); }
  }

  // Replace the inserted text. Leave it alone if the note changed or the text is gone.
  put(slot, out) {
    if ((slot.info?.file?.path ?? "") !== slot.path) return false;
    const r = locate(slot.editor, slot.text, slot.at);
    if (!r) return false;
    slot.editor.replaceRange(out, r.from, r.to);
    slot.text = out;
    slot.at = slot.editor.posToOffset(r.from);
    return true;
  }

  page(url) {
    if (!this.pages.has(url)) {
      this.pages.set(url, (async () => {
        try { return await readPage(url); }
        catch (e) { this.pages.delete(url); throw e; }            // don't remember failures
      })());
      if (this.pages.size > 50) this.pages.delete(this.pages.keys().next().value);
    }
    return this.pages.get(url);
  }

  // Image folder: the setting, else the attachment location Obsidian would use for this note
  async imageFolder(sourcePath) {
    const set = folderOf(this.settings.folder);
    if (set) {
      if (!this.app.vault.getAbstractFileByPath(set)) {
        try { await this.app.vault.createFolder(set); } catch (e) { /* created meanwhile */ }
      }
      return set;
    }
    const fm = this.app.fileManager;
    if (typeof fm.getAvailablePathForAttachment !== "function") return "";
    const path = await fm.getAvailablePathForAttachment("link-image.png", sourcePath);
    return path.includes("/") ? path.slice(0, path.lastIndexOf("/")) : "";
  }

  findFile(folder, stem, exts) {
    for (const ext of exts) {
      const f = this.app.vault.getAbstractFileByPath(join(folder, `${stem}.${ext}`));
      if (f instanceof TFile) return f;
    }
    return null;
  }

  // Favicon: favicon-<domain>.<ext>, one per domain and folder; reused when it exists
  favicon(p, folder) {
    const key = `${folder}|${p.host}`;
    if (!this.icons.has(key)) {
      this.icons.set(key, (async () => {
        try { return await this.saveFavicon(p, folder); }
        finally { this.icons.delete(key); }
      })());
    }
    return this.icons.get(key);
  }
  async saveFavicon(p, folder) {
    const stem = `favicon-${p.host}`;
    const have = this.findFile(folder, stem, ICON_EXTS);
    if (have) return have.name;
    try {
      const res = await requestUrl({ url: p.iconUrl, headers: UA });
      const type = header(res, "content-type").split(";")[0].trim();
      let ext = ICON_EXT[type], data = res.arrayBuffer;
      if (!ext) { data = await toPng(data, type); ext = "png"; }    // .ico and others become PNG
      await this.app.vault.createBinary(join(folder, `${stem}.${ext}`), data);
      return `${stem}.${ext}`;
    } catch (e) {
      return this.findFile(folder, stem, ICON_EXTS)?.name || "";  // go on without a favicon
    }
  }

  // Thumbnail: link-<domain>-<hash>.<ext>; the same image URL reuses the saved file
  async thumb(p, folder) {
    if (!p.imageUrl) return "";
    let h = 5381; for (const c of p.imageUrl) h = ((h << 5) + h + c.charCodeAt(0)) >>> 0;
    const stem = `link-${p.host}-${h.toString(36)}`;
    const have = this.findFile(folder, stem, THUMB_EXTS);
    if (have) return have.name;
    try {
      const res = await requestUrl({ url: p.imageUrl, headers: UA });
      const name = `${stem}.${THUMB_EXT[header(res, "content-type").split(";")[0].trim()] || "jpg"}`;
      if (!this.app.vault.getAbstractFileByPath(join(folder, name))) await this.app.vault.createBinary(join(folder, name), res.arrayBuffer);
      return name;
    } catch (e) { return ""; }                                    // go on without a thumbnail
  }

  ask(label) {
    return new Promise(done => {
      const m = new Modal(this.app);
      let value = null;
      m.titleEl.setText(label);
      const input = m.contentEl.createEl("input", { type: "text", cls: "paste-link-as-input" });
      input.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); value = input.value; m.close(); } });
      m.onClose = () => done(value);
      m.open();
      input.focus();
    });
  }

  // ── Format menu under the link: ↑↓ to choose, Enter or Tab to convert, Esc to close ──
  // On "Keep", Enter and any other key close the menu and go on to the editor (new line, keep typing).
  openMenu(slot) {
    this.closeMenu();
    const items = [
      { kind: "keep", title: T.keep, note: T.keepNote },
      { kind: "mention", title: T.mention, note: T.mentionNote },
    ];
    if (slot.card) items.push({ kind: "card", title: T.card, note: T.cardNote });

    const box = document.createElement("div");
    box.className = "suggestion-container paste-link-as-menu is-placing";
    const list = box.appendChild(document.createElement("div"));
    list.className = "suggestion";
    let index = 0;
    const select = i => { index = (i + items.length) % items.length; rows.forEach((r, k) => r.classList.toggle("is-selected", k === index)); };
    const pick = i => {
      this.closeMenu();
      if (items[i].kind === "keep") slot.editor.focus();
      else void this.convert(slot, items[i].kind);
    };
    const rows = items.map((it, i) => {
      const row = list.appendChild(document.createElement("div"));
      row.className = "suggestion-item mod-complex";
      const content = row.appendChild(document.createElement("div"));
      content.className = "suggestion-content";
      const title = content.appendChild(document.createElement("div"));
      title.className = "suggestion-title";
      title.textContent = it.title;
      const note = content.appendChild(document.createElement("div"));
      note.className = "suggestion-note";
      note.textContent = it.note;
      row.addEventListener("mousemove", () => select(i));
      row.addEventListener("mousedown", e => e.preventDefault());   // keep the editor focused
      row.addEventListener("click", () => pick(i));
      return row;
    });
    select(0);

    const stop = e => { e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation(); };
    const onKey = e => {
      if (["Shift", "Control", "Alt", "Meta", "CapsLock"].includes(e.key)) return;
      const plain = !e.metaKey && !e.ctrlKey && !e.altKey && !e.isComposing;
      if (plain && (e.key === "ArrowDown" || e.key === "ArrowUp")) { stop(e); select(index + (e.key === "ArrowDown" ? 1 : -1)); return; }
      if (plain && e.key === "Escape") { stop(e); this.closeMenu(); return; }
      if (plain && !e.shiftKey && (e.key === "Enter" || e.key === "Tab") && items[index].kind !== "keep") { stop(e); pick(index); return; }
      this.closeMenu();
    };
    const onDown = e => { if (!box.contains(e.target)) this.closeMenu(); };
    const onScroll = e => { if (!box.contains(e.target) && !this.place(box, slot)) this.closeMenu(); };
    document.addEventListener("keydown", onKey, true);
    document.addEventListener("pointerdown", onDown, true);
    document.addEventListener("scroll", onScroll, true);
    document.body.appendChild(box);
    this.menu = {
      slot,
      close: () => {
        document.removeEventListener("keydown", onKey, true);
        document.removeEventListener("pointerdown", onDown, true);
        document.removeEventListener("scroll", onScroll, true);
        box.remove();
      },
    };
    requestAnimationFrame(() => {                                 // place it once the pasted text is drawn
      if (this.menu?.slot !== slot) return;
      if (this.place(box, slot)) box.classList.remove("is-placing");
      else this.closeMenu(slot);
    });
  }

  // Right under the start of the link; above it when there is no room below
  place(box, slot) {
    const cm = slot.editor.cm;                                    // CodeMirror 6 view behind Obsidian's editor (not public API)
    let c = null;
    if (cm?.coordsAtPos) c = cm.coordsAtPos(Math.min(slot.at, cm.state.doc.length));
    else { const sel = window.getSelection(); if (sel?.rangeCount) c = sel.getRangeAt(0).getBoundingClientRect(); }
    if (!c) return false;
    const h = box.offsetHeight, w = box.offsetWidth, gap = 4;
    box.style.left = `${Math.max(8, Math.min(c.left, window.innerWidth - w - 8))}px`;
    box.style.top = `${c.bottom + gap + h <= window.innerHeight ? c.bottom + gap : c.top - gap - h}px`;
    return true;
  }

  closeMenu(slot) {
    if (!this.menu || (slot && this.menu.slot !== slot)) return;
    this.menu.close();
    this.menu = null;
  }
}

class PasteLinkAsSettingTab extends PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    this.containerEl.empty();
    new Setting(this.containerEl)
      .setName(T.folder)
      .setDesc(T.folderDesc)
      .addText(text => text
        .setPlaceholder("attachments")
        .setValue(this.plugin.settings.folder)
        .onChange(async value => {
          this.plugin.settings.folder = value.trim();
          await this.plugin.saveData(this.plugin.settings);
        }));
  }
}

module.exports = PasteLinkAsPlugin;
