(function(global) {
  // === SnapUI Core ===

  function createElement(type, props = {}, ...children) {
    return { type, props, children: children.flat() };
  }

  function render(vnode) {
    if (typeof vnode === 'string' || typeof vnode === 'number') {
      return document.createTextNode(vnode);
    }

    const $el = document.createElement(vnode.type);

    for (const [key, value] of Object.entries(vnode.props || {})) {
      if (key.startsWith('on') && typeof value === 'function') {
        $el.addEventListener(key.slice(2).toLowerCase(), value);
      } else {
        $el.setAttribute(key, value);
      }
    }

    vnode.children.map(render).forEach(child => $el.appendChild(child));
    return $el;
  }

  function changed(node1, node2) {
    return (
      typeof node1 !== typeof node2 ||
      (typeof node1 === 'string' && node1 !== node2) ||
      node1.type !== node2.type
    );
  }

  function updateElement($parent, newVNode, oldVNode, index = 0) {
    if (!oldVNode) {
      $parent.appendChild(render(newVNode));
    } else if (!newVNode) {
      $parent.removeChild($parent.childNodes[index]);
    } else if (changed(newVNode, oldVNode)) {
      $parent.replaceChild(render(newVNode), $parent.childNodes[index]);
    } else if (newVNode.type) {
      const newLen = newVNode.children.length;
      const oldLen = oldVNode.children.length;
      for (let i = 0; i < newLen || i < oldLen; i++) {
        updateElement(
          $parent.childNodes[index],
          newVNode.children[i],
          oldVNode.children[i],
          i
        );
      }
    }
  }

  function createRouter(routes, rootElementId) {
    let oldVNode = null;
    const root = document.getElementById(rootElementId);

    function renderRoute() {
      const path = window.location.pathname;
      const routeComponent = routes[path] || routes['/'] || (() => createElement('div', null, 'Not Found'));
      const newVNode = routeComponent();
      updateElement(root, newVNode, oldVNode);
      oldVNode = newVNode;
    }

    window.addEventListener('popstate', renderRoute);

    function navigate(path) {
      window.history.pushState(null, null, path);
      renderRoute();
    }

    renderRoute();

    return { navigate, renderRoute };
  }

  // === SnapAnimate Module ===

  function animate({ from, to, duration = 1000, easing = 'linear', onUpdate, onComplete }) {
    const start = performance.now();

    const ease = {
      linear: t => t,
      easeInOut: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
    }[easing] || (t => t);

    function step(now) {
      const t = Math.min(1, (now - start) / duration);
      const value = from + (to - from) * ease(t);
      onUpdate?.(value);
      if (t < 1) requestAnimationFrame(step);
      else onComplete?.();
    }

    requestAnimationFrame(step);
  }

  function keyframes({ element, frames = [], duration = 1000, easing = 'linear', onComplete }) {
    const stepDuration = duration / (frames.length - 1);
    let i = 0;

    function parseValue(val) {
      if (typeof val === 'string' && val.endsWith('px')) {
        return { value: parseFloat(val), unit: 'px' };
      }
      return { value: parseFloat(val), unit: '' };
    }

    function runNext() {
      if (i >= frames.length - 1) {
        onComplete?.();
        return;
      }

      animate({
        from: 0,
        to: 1,
        duration: stepDuration,
        easing,
        onUpdate: t => {
          for (const prop in frames[i]) {
            const fromParsed = parseValue(frames[i][prop]);
            const toParsed = parseValue(frames[i + 1][prop]);
            const current = fromParsed.value + (toParsed.value - fromParsed.value) * t;
            element.style[prop] = current + (toParsed.unit || 'px');
          }
        },
        onComplete: () => {
          i++;
          runNext();
        }
      });
    }

    runNext();
  }

  // === Exporting All APIs ===

  global.SnapUI = {
    createElement,
    render,
    updateElement,
    createRouter
  };

  global.SnapAnimate = {
    animate,
    keyframes
  };

})(window);
