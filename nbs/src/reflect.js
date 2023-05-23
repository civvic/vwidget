function getAncestorByClassName(el, className) {
  while ((el = el.parentElement) && !el.classList.contains(className));
  return el;
}

class Reflect {
  constructor(view) {
    this.view = view;
    this.el = null;
  }

  toggle_show() {
    this.el.style.display = this.view.model.get("ui") ? "block" : "none";
  }
  
  reflect() {
    const view = this.view;
    const ancestor = getAncestorByClassName(view.el, "output");
    const s = ancestor.outerHTML;
    view.model.set("_html", s);
    view.model.save_changes();
  }
  
  perform_query() {
    const view = this.view;
    let query = view.model.get("query");
    if (Object.keys(query).length === 0 || query.result || query.hasOwnProperty("result")) {
      return;
    }
    query = {...view.model.get("query")};
    const doc = view.el.getRootNode();
    const out = view.el.closest(".output");
    let { id = undefined, tag = undefined, selector = undefined, kind = undefined } = query;
    if (!id && !tag && !selector) {
      selector = `#${this.el.id}`;
    }
    let el, result;
    if (selector) {
      el = out.querySelector(selector);
    } else if (id) {
      el = doc.getElementById(id);
    } else if (tag) {
      els = out.getElementsByTagName(tag)[0];
      if (els.length > 0) {
        el = els[0];
      }
    }
    kind = kind || 'method';
    el = el || out;
    if (kind === "method") {
      result = el[query.method]();
    } else if (kind === "text") {
      result = el.innerText;
    } else if (kind === "html") {
      result = el.outerHTML;
    } else if (kind === "attr") {
      result = el.getAttribute(query.attr);
    } else if (kind === "style") {
      result = window.getComputedStyle(el).getPropertyValue(query.prop);
    }
    query.rid = this.el.id;
    query.result = result;
    view.model.set('query', query)
    view.model.save_changes()
  }
}

export function render(view) {
  let div = document.createElement("div");
  div.classList.add("reflect-div");
  const rid = view.model.get("_rid");
  div.id = rid;
  div.innerHTML = `reflect ${rid}`;
  const ui = view.model.get("ui");
  if (!ui) {
    div.style.display = "none";
  }
  const qrr = new Reflect(view);
  div.addEventListener("click", () => {
    qrr.reflect();
  });
  // view.model.on("change:value", () => {
  //   qrr.reflect();
  // });
  view.model.on("change:ui", () => {
    qrr.toggle_show();
  });
  view.model.on("change:query", () => {
    qrr.perform_query();
  });
  view.el.appendChild(div);
  qrr.el = div;
  // wait for next tick before reflecting
  setTimeout(() => {
    qrr.reflect();
    qrr.perform_query();
  }, "0");
}
