// snapui.js

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD
    define([], factory);
  } else if (typeof exports === 'object' && typeof module !== 'undefined') {
    // CommonJS / Node
    module.exports = factory();
  } else {
    // Browser global
    root.SnapUI = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {

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

  return {
    createElement,
    render,
    updateElement,
    createRouter,
  };
}));

// Also export for ES modules if possible
export const createElement = (type, props = {}, ...children) => ({ type, props, children: children.flat() });

export function render(vnode) {
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

export function changed(node1, node2) {
  return (
    typeof node1 !== typeof node2 ||
    (typeof node1 === 'string' && node1 !== node2) ||
    node1.type !== node2.type
  );
}

export function updateElement($parent, newVNode, oldVNode, index = 0) {
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

export function createRouter(routes, rootElementId) {
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
