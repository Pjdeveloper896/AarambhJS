// Dispatcher object holding hook state and logic
const HookDispatcher = {
  hooks: [],          // store hook states (for state, effects, etc)
  hookIndex: 0,       // current hook call index
  renderFn: null,     // function to rerender your component

  // useState hook implementation
  useState(initialValue) {
    const idx = this.hookIndex++;

    if (this.hooks.length <= idx) {
      this.hooks.push(initialValue);
    }

    const setState = (newValue) => {
      const value = typeof newValue === 'function' ? newValue(this.hooks[idx]) : newValue;
      this.hooks[idx] = value;
      this.scheduleUpdate();
    };

    return [this.hooks[idx], setState];
  },

  // useEffect implementation with dependency tracking
  useEffect(callback, deps) {
    const idx = this.hookIndex++;
    const oldHook = this.hooks[idx];

    let hasChanged = true;
    if (oldHook) {
      const [oldDeps] = oldHook;
      hasChanged = !deps || deps.some((d, i) => d !== oldDeps[i]);
    }

    if (hasChanged) {
      if (oldHook && oldHook[1]) oldHook[1]();

      const cleanup = callback();
      this.hooks[idx] = [deps, cleanup];
    } else {
      this.hooks[idx] = oldHook;
    }
  },

  scheduleUpdate() {
    this.hookIndex = 0;
    if (this.renderFn) this.renderFn();
  }
};

function resolveDispatcher() {
  return HookDispatcher;
}

// Named ES exports
export function spaceState(initialState) {
  return resolveDispatcher().useState(initialState);
}

export function spaceEffect(effect, deps) {
  return resolveDispatcher().useEffect(effect, deps);
}

export function setRenderFunction(renderFn) {
  HookDispatcher.renderFn = renderFn;
}

// Optional default export for the full dispatcher (for advanced usage)
export default HookDispatcher;
