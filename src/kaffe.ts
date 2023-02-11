export default function run(elementId: string, nodeSetup: { [key:string]: any }, state: { [key:string]: any }): Kaffi {
  let kaffi = new Kaffi(document.getElementById(elementId)!);
  // add renderers
  kaffi.useRenderer(button);
  kaffi.useRenderer(div);
  kaffi.useRenderer(text);

  // Set global state
  kaffi.useState(state);

  // render all nodes
  kaffi.render(nodeSetup);

  return kaffi;
}

export function createApp(elementId: string): Kaffi {
  let kaffi = new Kaffi(document.getElementById(elementId)!);
  // add renderers
  kaffi.useRenderer(button);
  kaffi.useRenderer(div);
  kaffi.useRenderer(text);

  return kaffi;
}


export function button(props: any): HTMLButtonElement {
  let e = document.createElement("button");
  
  for (const [key, value] of Object.entries(props)) {
    if (key == "onUpdate") continue;

    if (key == "click" && typeof value == "function") {
      e.addEventListener("click", () => value(set));
    } else {
      if (typeof value == "string") e.setAttribute(key, value);
    }
  }

  return e;
}

export function div(props: any): HTMLDivElement {
  let e = document.createElement("div");

  for (const [key, value] of Object.entries(props)) {
    if (key == "onUpdate") continue;

    if (key == "click" && typeof value == "function") {
      e.addEventListener("click", () => value(e));
    } else {
      if (typeof value == "string") e.setAttribute(key, value);
    }
  }

  return e;
}

export function text(props: any): HTMLSpanElement {
  let e = document.createElement("span");

  for (const [key, value] of Object.entries(props)) {
    if (key == "onUpdate") continue;

    if (key == "value" && typeof value != "function") {
      e.innerHTML = props.value;
    };

    if (key == "click" && typeof value == "function") {
      e.addEventListener("click", () => value((state: any) => console.log(state)));
    } else {
      if (typeof value == "string") e.setAttribute(key, value);
    }
  }

  return e;
}

function set(stateFunc: (state: any) => void) {
  stateFunc(window.KaffiState);
  window.KaffiApp.updateState();
}

export type Renderer = (props: any) => HTMLElement;

class Kaffi {
  renderers: Map<string, Renderer> = new Map();
  appContainer: HTMLElement;
  textElements: { element: HTMLSpanElement, stateFunc: (state: any) => any; }[] = [];
  listeners: { element: HTMLElement, stateFunc: (state: any, element: HTMLElement) => void; }[] = [];

  constructor(appContainer: HTMLElement) {
    this.appContainer = appContainer;
    window.KaffiApp = this;
  }

  useRenderer(r: Renderer) {
    this.renderers.set(r.name, r);
  }

  render(node: { [key:string]: any }) {
    this.appContainer.append(this.renderNode("div", node));
    this.updateState();
  }

  renderNode(name: string, node: { [key:string]: any }): HTMLElement {
    let renderer = this.renderers.get(name);
    if (!renderer) renderer = this.renderers.get("div")!;
  
    let el = renderer(this.getNodeProps(node));
    let nodeChildren = this.getNodeChildren(node);

    if (this.containsOnUpdate(node)) {
      let updateObj = this.getNodeProps(node).onUpdate!
      
      if (typeof updateObj == "function") {
        this.listeners.push({
          element: el,
          stateFunc: updateObj
        });
      }
    }

    if (this.containsText(node)) {
      let textObj = nodeChildren.find(([k, _]) => k == "text");
      let textEl = this.renderNode("text", textObj![1]);
      
      if (typeof textObj![1].value == "function") {
        this.textElements.push({
          element: textEl,
          stateFunc: textObj![1].value
        });
      }

      el.append(textEl);
    } else {
      this.getNodeChildren(node).forEach(([k, v]) => {
        el.appendChild(this.renderNode(k, v));
      });
    }

    return el;
  }

  getNodeProps(node: { [key:string]: any }) {
    return Object.fromEntries(Object.entries(node).filter(([_, v]) => typeof v != "object"));
  }

  getNodeChildren(node: { [key:string]: any }) {
    return Object.entries(node).filter(([_, v]) => typeof v == "object");
  }

  containsText(node: { [key:string]: any }): boolean {
    return Object.keys(node).some(k => k == "text");
  }

  containsOnUpdate(node: { [key:string]: any }): boolean {
    return Object.keys(node).some(k => k == "onUpdate");
  }

  useState(state: any) {
    window.KaffiState = state;
  }

  updateState() {
    this.textElements.forEach(obj => {
      obj.element.innerHTML = obj.stateFunc(window.KaffiState);
    });

    this.listeners.forEach(obj => {
      obj.stateFunc(window.KaffiState, obj.element);
    });
  }
}

declare global {
  interface Window { KaffiState: any; KaffiApp: Kaffi }
}