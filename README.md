# kaffe
Build dead simple web apps with JSON-like structure only. Developed for educational purposes.

Try this in your browser (ESM only atm).

```javascript
import run from "https://cdn.jsdelivr.net/gh/kaffejs/kaffe/dist/lib.js";

// State shared with all elements.
let state = {
  count: 0
};

// This is how you setup your app, the rest is magic.
let appData = {
  button: {
    text: {
      value: state => state.count
    },
    click: (set) => set(state => state.count++)
  }
};

// Run the application, assumes that div#app exists.
run("app", appData, state);
```
