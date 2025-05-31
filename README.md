
# AarambhJS  
### *"From Hello World to Real Apps – Effortlessly."*

**AarambhJS** is a beginner-friendly JavaScript UI framework that supports Virtual DOM rendering, JSX-like syntax, and simple client-side routing — all in one lightweight script.

---

## ✨ Features

- ⚛️ Virtual DOM Rendering  
- 🔧 JSX-like `createElement` Syntax  
- 🧩 Component-Based UI  
- 🚦 Client-Side Routing  
- 📦 Zero Dependencies  
- 🌐 CDN-Ready for Browser Use  

---

## 🚀 Getting Started

### Include via CDN

```html
<script src="https://cdn.jsdelivr.net/gh/pjdeveloper896/AarambhJS/dist/Index.js"></script>
````

### Access Core Functions

```js
const { createElement, render, updateElement, createRouter } = AarambhJS;
```

---

## 🧪 Example Usage

### 1. Rendering a Simple Element

```js
const title = createElement('h1', { id: 'main' }, 'Hello from AarambhJS!');
document.body.appendChild(render(title));
```

---

### 2. Interactive Component

```js
function ButtonComponent() {
  return createElement(
    'button',
    { onClick: () => alert('Button Clicked!') },
    'Click Me'
  );
}

document.getElementById('root').appendChild(render(ButtonComponent()));
```

---

### 3. Basic Routing

```js
const routes = {
  '/': () => createElement('div', null, 'Welcome to Home Page'),
  '/about': () => createElement('div', null, 'About AarambhJS'),
};

const router = createRouter(routes, 'root');

// Optional: router.navigate('/about') for programmatic routing
```

---

## 🔗 Live Example

```html
<body>
  <nav>
    <a href="/" onclick="event.preventDefault(); router.navigate('/')">Home</a>
    <a href="/about" onclick="event.preventDefault(); router.navigate('/about')">About</a>
  </nav>
  <div id="root"></div>

  <script src="https://cdn.jsdelivr.net/gh/pjdeveloper896/AarambhJS/dist/Index.js"></script>
  <script>
    const { createElement, createRouter } = AarambhJS;

    const routes = {
      '/': () => createElement('h2', null, 'Home Page'),
      '/about': () => createElement('h2', null, 'About Page'),
    };

    const router = createRouter(routes, 'root');
  </script>
</body>
```

---

## ❤️ Credits

Built with love using plain JavaScript
to help beginners understand how frontend frameworks work under the hood.

---

> Aarambh (आरंभ) means “beginning” in Sanskrit — a perfect name for developers starting their journey.
