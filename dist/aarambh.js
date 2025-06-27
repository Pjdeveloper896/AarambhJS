// aarambh.js (global + CommonJS + AMD support, no export)

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof exports === 'object' && typeof module !== 'undefined') {
    module.exports = factory();
  } else {
    root.Aarambh = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {

  function createElement(type, props = {}, ...children) {
    const flatChildren = children.flat();
    const { style, className, ref, ...rest } = props || {};

    const processedProps = {
      ...rest,
      ...(style ? { style: Object.entries(style).map(([k, v]) => `${k}:${v}`).join(';') } : {}),
    };
    if (className) processedProps.class = className;
    if (ref) processedProps.ref = ref;

    return { type, props: processedProps, children: flatChildren };
  }

  function render(vnode) {
    if (typeof vnode === 'string' || typeof vnode === 'number') {
      return document.createTextNode(vnode);
    }

    if (typeof vnode.type === 'function') {
      return render(vnode.type({ ...vnode.props }));
    }

    const $el = document.createElement(vnode.type);
    for (const [key, value] of Object.entries(vnode.props || {})) {
      if (key === 'ref' && typeof value === 'function') {
        value($el);
      } else if (key === 'onMount' || key === 'onUnmount') {
        continue;
      } else if (key.startsWith('on') && typeof value === 'function') {
        $el.addEventListener(key.slice(2).toLowerCase(), value);
      } else {
        $el.setAttribute(key, value);
      }
    }

    vnode.children.map(render).forEach(child => $el.appendChild(child));
    if (typeof vnode.props?.onMount === 'function') {
      requestAnimationFrame(() => vnode.props.onMount($el));
    }

    return $el;
  }

  function changed(node1, node2) {
    return (
      typeof node1 !== typeof node2 ||
      (typeof node1 === 'string' && node1 !== node2) ||
      node1.type !== node2.type ||
      (node1.props?.key !== node2.props?.key)
    );
  }

  function updateElement($parent, newVNode, oldVNode, index = 0) {
    const $child = $parent.childNodes[index];

    if (!oldVNode) {
      $parent.appendChild(render(newVNode));
    } else if (!newVNode) {
      if (typeof oldVNode.props?.onUnmount === 'function') {
        oldVNode.props.onUnmount($child);
      }
      $parent.removeChild($child);
    } else if (changed(newVNode, oldVNode)) {
      $parent.replaceChild(render(newVNode), $child);
    } else if (newVNode.type) {
      const newLen = newVNode.children.length;
      const oldLen = oldVNode.children.length;
      for (let i = 0; i < newLen || i < oldLen; i++) {
        updateElement($child, newVNode.children[i], oldVNode.children[i], i);
      }
    }
  }

  function createRouter(routes, rootElementId) {
    let oldVNode = null;
    const root = document.getElementById(rootElementId);

    function parsePath(path) {
      const [pathname, query = ''] = path.split('?');
      const queryParams = Object.fromEntries(new URLSearchParams(query));
      return { pathname, queryParams };
    }

    function matchRoute(pathname) {
      for (const route in routes) {
        if (route === '*') continue;
        const paramNames = [];
        const regexPath = route.replace(/:[^\/]+/g, match => {
          paramNames.push(match.slice(1));
          return '([^/]+)';
        });

        const match = pathname.match(new RegExp(`^${regexPath}$`));
        if (match) {
          const params = paramNames.reduce((acc, name, i) => {
            acc[name] = match[i + 1];
            return acc;
          }, {});
          return { component: routes[route], params };
        }
      }

      return {
        component: routes['*'] || (() => createElement('div', null, 'Not Found')),
        params: {}
      };
    }

    function getCurrentHash() {
      return window.location.hash.slice(1) || '/';
    }

    function renderRoute() {
      const hash = getCurrentHash();
      const { pathname, queryParams } = parsePath(hash);
      const { component, params } = matchRoute(pathname);
      const newVNode = component({ params, query: queryParams });
      updateElement(root, newVNode, oldVNode);
      oldVNode = newVNode;
    }

    window.addEventListener('hashchange', renderRoute);

    function navigate(path) {
      window.location.hash = path;
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
