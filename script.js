(function () {
  /* ---------------- Menús (SHOP / COLLECTION) ---------------- */
  const header = document.getElementById('siteHeader');
  const items = Array.from(document.querySelectorAll('.has-menu'));
  const timers = new WeakMap();
  let intent = null;

  function anyOpen() { return items.some((i) => i.classList.contains('is-open')); }

  function open(item) {
    clearTimeout(timers.get(item));
    items.forEach((other) => { if (other !== item) close(other); });
    item.classList.add('is-open');
    header.classList.add('is-open');
    item.querySelector('.nav-link').setAttribute('aria-expanded', 'true');
  }
  function close(item) {
    item.classList.remove('is-open');
    item.querySelector('.nav-link').setAttribute('aria-expanded', 'false');
    if (!anyOpen()) header.classList.remove('is-open');
  }
  function closeSoon(item) {
    clearTimeout(timers.get(item));
    timers.set(item, setTimeout(() => close(item), 250));
  }
  function closeAll() { items.forEach(close); }

  items.forEach((item) => {
    const link = item.querySelector('.nav-link');
    item.addEventListener('mouseenter', () => {
      clearTimeout(intent);
      if (anyOpen() && !item.classList.contains('is-open')) {
        intent = setTimeout(() => open(item), 200);   // si solo pasas por encima camino a la foto, no cambia de menú
      } else {
        open(item);
      }
    });
    item.addEventListener('mouseleave', () => { clearTimeout(intent); closeSoon(item); });
    item.addEventListener('focusin', () => open(item));
    item.addEventListener('focusout', (e) => { if (!item.contains(e.relatedTarget)) closeSoon(item); });
    link.addEventListener('click', (e) => {
      if (!item.classList.contains('is-open')) { e.preventDefault(); open(item); }
    });
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closeAll(); document.activeElement.blur(); }
  });
  document.addEventListener('click', (e) => {
    items.forEach((item) => { if (!item.contains(e.target)) close(item); });
  });

  /* ---------------- Productos (datos de ejemplo) ---------------- */
  // Nombre, precio, tipo y colección: cámbialos por los de tu tienda.
  // Fotos: ver buildCard (producto1-1.jpg, producto1-2.jpg ...). También puedes poner photo: 'mi-nombre' en un producto.
  // type: 'dress' = T-shirt, 'top' = Sportswear, 'bottom' = Board shorts
  //   (los nombres internos se quedaron igual para que los enlaces del HTML sigan funcionando;
  //    lo que se ve en pantalla sale de TITLES, más abajo)
  const SAMPLES = [
    { name: 'Classic White T-shirt', price: 25, type: 'dress',  col: 'dreamy-blooms',       isNew: true,  color: '#f1f1f1' },
    { name: 'Black Board Shorts',    price: 30, type: 'bottom', col: 'dreamy-blooms',       isNew: false, color: '#222222' },
    { name: 'Bulls Red T-shirt',     price: 28, type: 'dress',  col: 'heartfelt-petals',    isNew: false, color: '#b3202d' },
    { name: 'Sport Jersey Set',      price: 45, type: 'top',    col: 'heartfelt-petals',    isNew: true,  color: '#c33a45' },
    { name: 'Training Sport Top',    price: 26, type: 'top',    col: 'the-sparkling-touch', isNew: false, color: '#3a4a5c' },
    { name: 'Red Sport Set',         price: 48, type: 'top',    col: 'the-sparkling-touch', isNew: true,  color: '#a32030' },
    { name: 'White Board Shorts',    price: 30, type: 'bottom', col: 'dreamy-blooms',       isNew: false, color: '#ececec' },
    { name: 'Basic Black T-shirt',   price: 22, type: 'dress',  col: 'the-sparkling-touch', isNew: false, color: '#2b2b2b' },
  ].map((p, i) => Object.assign({ rank: i }, p));

  /* =====================================================
     CATÁLOGO AUTOMÁTICO: las fotos sueltas crean los productos
     -----------------------------------------------------
     Sección T-shirt:       tshirt1.jpg, tshirt2.jpg, tshirt3.jpg ...
     Sección Sportswear:    sportswear1.jpg, sportswear2.jpg ...
     Sección Board shorts:  boardshorts1.jpg, boardshorts2.jpg ...
     * Cada número es un producto. Numeración seguida, sin saltos.
     * Fotos extra del mismo producto (opcionales): tshirt1-2.jpg, tshirt1-3.jpg, tshirt1-4.jpg
     ===================================================== */
  const SECTIONS = [
    { prefix: 'tshirt',      type: 'dress',  label: 'T-shirt' },
    { prefix: 'sportswear',  type: 'top',    label: 'Sportswear' },
    { prefix: 'boardshorts', type: 'bottom', label: 'Board shorts' },
  ];
  /* COLECCIONES (menú COLLECTION). Cada foto con este nombre aparece SOLO en esa colección:
     dreamy-blooms1.jpg, dreamy-blooms2.jpg, dreamy-blooms3.jpg ...            -> DREAMY BLOOMS
     heartfelt-petals1.jpg, heartfelt-petals2.jpg ...                          -> HEARTFELT PETALS
     the-sparkling-touch1.jpg, the-sparkling-touch2.jpg ...                    -> THE SPARKLING TOUCH
     (fotos extra del mismo producto: dreamy-blooms1-2.jpg, dreamy-blooms1-3.jpg, dreamy-blooms1-4.jpg)
     La foto del MENÚ de SHOP es distinta: dreamy-blooms.jpg (sin número).
     Si quieres que un producto esté también en T-shirt/Sportswear, sube su foto también con ese nombre. */
  const COLLECTIONS = [
    { prefix: 'dreamy-blooms',       slug: 'dreamy-blooms',       title: 'Dreamy Blooms' },
    { prefix: 'heartfelt-petals',    slug: 'heartfelt-petals',    title: 'Heartfelt Petals' },
    { prefix: 'the-sparkling-touch', slug: 'the-sparkling-touch', title: 'The Sparkling Touch' },
  ];
  const MAX_PER_SECTION = 60;          // máximo de productos por sección
  const USE_SAMPLES_IF_EMPTY = true;   // si no hay ninguna foto con esos nombres, se muestran los de ejemplo

  // Opcional: nombre y precio de cada producto (la clave es el nombre de la foto, sin .jpg)
  const DETAILS = {
    // tshirt1:      { name: 'Champion White Set', price: 25 },
    // sportswear1:  { name: 'Bulls Red Set', price: 45, isNew: true },
    // boardshorts1: { name: 'Black Board Shorts', price: 30 },
  };

  const PRODUCTS = SAMPLES.slice();
  const shopList = () => PRODUCTS.filter((p) => !p.onlyCol);   // lo que se ve en All Items, categorías, buscador y destacados

  const TITLES = {
    'all-items': 'All Products', 'new-arrivals': 'New Arrivals', 'dress': 'T-shirt', 'top': 'Sportswear', 'bottom': 'Board shorts',
    'dreamy-blooms': 'Dreamy Blooms', 'heartfelt-petals': 'Heartfelt Petals', 'the-sparkling-touch': 'The Sparkling Touch',
  };

  // Forma de la silueta de reemplazo según la categoría
  const SHAPE = { dress: 'top', top: 'top', bottom: 'bottom', collection: 'top' };

  const home = document.getElementById('home');
  const listing = document.getElementById('products');
  const grid = document.getElementById('grid');
  const empty = document.getElementById('empty');
  const titleEl = document.getElementById('listTitle');
  const sortEl = document.getElementById('sort');
  const shopLink = document.getElementById('shopLink');
  let current = { kind: 'shop', slug: 'all-items' };

  /* Portada de la colección: al abrir una colección se ve primero la foto del menú
     (dreamy-blooms.jpg, o menu1.jpg si no existe), y debajo todas las fotos de la colección. */
  const COVER_FALLBACK = { 'dreamy-blooms': 'menu1.jpg', 'heartfelt-petals': 'menu2.jpg', 'the-sparkling-touch': 'menu3.jpg' };
  const cover = document.createElement('div');
  cover.style.cssText = 'display:none;justify-content:center;margin:6px 0 34px;';
  const coverImg = document.createElement('img');
  coverImg.alt = '';
  coverImg.style.cssText = 'display:block;width:min(560px,100%);height:auto;max-height:78vh;object-fit:contain;';
  cover.appendChild(coverImg);
  listing.insertBefore(cover, listing.querySelector('.sortbar'));
  let coverToken = 0;

  function showCover(slug) {
    const token = ++coverToken;
    cover.style.display = 'none';
    if (!slug) return;
    const tries = [slug + '.jpg', COVER_FALLBACK[slug]].filter(Boolean);
    (function next(n) {
      if (n >= tries.length) return;
      const probeImg = new Image();
      probeImg.onload = () => {
        if (token !== coverToken) return;          // el usuario ya cambió de página
        if (PRODUCTS.some((p) => p.col === slug && p.imgs && p.imgs.indexOf(tries[n]) !== -1)) return;   // ya sale en la cuadrícula
        coverImg.src = tries[n];
        coverImg.alt = TITLES[slug] || '';
        cover.style.display = 'flex';
      };
      probeImg.onerror = () => next(n + 1);
      probeImg.src = tries[n];
    })(0);
  }

  function filtered() {
    const { kind, slug } = current;
    let list = PRODUCTS.slice();
    if (kind === 'collection') {
      list = list.filter((p) => p.col === slug);
    } else {
      list = list.filter((p) => !p.onlyCol);
      if (slug === 'new-arrivals') list = list.filter((p) => p.isNew);
      else if (slug !== 'all-items') list = list.filter((p) => p.type === slug);
    }

    const s = sortEl.value;
    if (s === 'low') list.sort((a, b) => a.price - b.price);
    else if (s === 'high') list.sort((a, b) => b.price - a.price);
    else if (s === 'newest') list.sort((a, b) => Number(b.isNew) - Number(a.isNew) || a.rank - b.rank);
    else list.sort((a, b) => a.rank - b.rank);
    return list;
  }

  /* Tarjeta con galería: al pasar el cursor cambia de vista, las flechas navegan */
  const CHEV_L = '<svg viewBox="0 0 11 18"><path d="M9.500 1L1.500 9l8 8"/></svg>';
  const CHEV_R = '<svg viewBox="0 0 11 18"><path d="M1.500 1l8 8-8 8"/></svg>';

  function buildCard(p) {
    const art = document.createElement('article');
    art.className = 'card';
    // Primero se dibujan las 4 vistas de reemplazo (siluetas)
    const slides = [0, 1, 2, 3].map((v) => '<div class="slide"><div class="fig fig--' + (SHAPE[p.type] || p.type) + ' fig--v' + v + '" style="--c:' + p.color + '" role="img" aria-label="' + p.name + '"></div></div>');
    art.innerHTML =
      '<div class="card-img">' + slides.join('') +
        '<a class="card-hit" href="#" aria-label="' + p.name + '"></a>' +
        '<button class="arrow arrow--prev" type="button" aria-label="Previous image">' + CHEV_L + '</button>' +
        '<button class="arrow arrow--next" type="button" aria-label="Next image">' + CHEV_R + '</button>' +
      '</div>' +
      '<a class="card-meta" href="#"><span class="card-name">' + p.name + '</span>' +
      (p.price > 0 ? '<span class="card-price">$' + p.price.toFixed(0) + '</span>' : '') + '</a>';

    let els = art.querySelectorAll('.slide');
    const media = art.querySelector('.card-img');
    let i = 0;
    function show(n) {
      i = (n + els.length) % els.length;
      els.forEach((s, k) => s.classList.toggle('is-on', k === i));
    }
    show(0);
    media.addEventListener('mouseenter', () => { if (i === 0 && els.length > 1) show(1); });
    media.addEventListener('mouseleave', () => show(0));
    art.querySelector('.arrow--prev').addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); show(i - 1); });
    art.querySelector('.arrow--next').addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); show(i + 1); });

    /* Fotos reales sueltas junto a index.html:
       producto1-1.jpg, producto1-2.jpg, producto1-3.jpg, producto1-4.jpg  (producto 1)
       producto2-1.jpg ...                                                  (producto 2)
       El número es la posición del producto en la lista PRODUCTS.
       Usa las que existan (1 a 4). Si no hay ninguna, se queda la silueta. */
    const base = p.photo || ('producto' + (p.rank + 1));
    const files = (p.imgs && p.imgs.length) ? p.imgs : [1, 2, 3, 4].map((n) => base + '-' + n + '.jpg');
    const found = new Array(files.length);
    let pending = files.length;
    files.forEach((src, k) => {
      const img = new Image();
      const done = () => { if (--pending === 0) applyPhotos(); };
      img.onload = () => { found[k] = img; done(); };
      img.onerror = done;
      img.src = src;
    });
    function applyPhotos() {
      const ok = found.filter(Boolean);
      if (!ok.length) return;
      media.querySelectorAll('.slide').forEach((s) => s.remove());
      const hit = media.querySelector('.card-hit');
      ok.forEach((img) => { img.className = 'slide'; img.alt = p.name; media.insertBefore(img, hit); });
      els = media.querySelectorAll('.slide');
      show(0);
    }
    return art;
  }

  function renderGrid() {
    const list = filtered();
    grid.innerHTML = '';
    list.forEach((p) => grid.appendChild(buildCard(p)));
    empty.textContent = current.kind === 'collection' ? 'More photos coming soon.' : 'No products found.';
    empty.hidden = list.length > 0;
  }

  /* ---------------- Router por hash ---------------- */
  const login = document.getElementById('login');
  const cartView = document.getElementById('cart');
  const views = [home, listing, login, cartView];

  function show(view) { views.forEach((v) => { v.hidden = v !== view; }); }

  function route() {
    const parts = location.hash.replace(/^#\/?/, '').split('/');   // ["shop","dress"]
    const kind = parts[0], slug = parts[1];
    closeAll();

    if ((kind === 'shop' || kind === 'collection') && TITLES[slug]) {
      current = { kind, slug };
      titleEl.textContent = TITLES[slug];
      document.title = TITLES[slug] + ' – The Jungle Closet';
      sortEl.value = 'best';
      renderGrid();
      showCover(kind === 'collection' ? slug : null);
      show(listing);
      document.body.classList.add('is-products');
      shopLink.classList.remove('is-active');
    } else if (kind === 'cart') {
      document.title = 'Your cart – The Jungle Closet';
      show(cartView);
      document.body.classList.add('is-products');
      shopLink.classList.remove('is-active');
    } else if (kind === 'account' && slug === 'login') {
      document.title = 'Login – The Jungle Closet';
      show(login);
      document.body.classList.add('is-products');   // header blanco con línea
      shopLink.classList.remove('is-active');
    } else {
      show(home);
      document.body.classList.remove('is-products');
      shopLink.classList.add('is-active');
      document.title = 'The Jungle Closet – Rule your style';
    }
    window.scrollTo(0, 0);
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
  }

  sortEl.addEventListener('change', renderGrid);
  window.addEventListener('hashchange', route);

  /* ---------------- Formularios (demo, sin servidor) ---------------- */
  const okEmail = (v) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.trim());
  function say(id, text) { document.getElementById(id).textContent = text; }

  document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('lEmail').value;
    const pass = document.getElementById('lPass').value;
    if (!okEmail(email) || !pass) return say('loginMsg', 'Enter a valid email and your password.');
    say('loginMsg', 'Demo only: connect a store or backend to sign in.');
  });
  document.getElementById('contactForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const n = document.getElementById('cName').value.trim();
    const m = document.getElementById('cMsg').value.trim();
    if (!n || !okEmail(document.getElementById('cEmail').value) || !m) return say('contactMsg', 'Please fill in your name, a valid email and a message.');
    e.target.reset();
    say('contactMsg', 'Thanks! We will get back to you soon.');
  });
  document.getElementById('newsForm').addEventListener('submit', (e) => {
    e.preventDefault();
    if (!okEmail(document.getElementById('nEmail').value)) return say('newsMsg', 'Enter a valid email.');
    e.target.reset();
    say('newsMsg', 'Thanks for subscribing!');
  });

  // Los enlaces vacíos (#) no deben saltar al inicio
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href="#"]');
    if (a) e.preventDefault();
  });

  /* ---------------- Búsqueda (la lupa) ---------------- */
  const sOverlay = document.getElementById('searchOverlay');
  const sInput = document.getElementById('searchInput');
  const sSugg = document.getElementById('searchSugg');
  const sResults = document.getElementById('searchResults');
  const sBtn = document.getElementById('searchBtn');

  function searchProducts(q) {
    const tokens = q.toLowerCase().split(/\s+/).filter(Boolean);
    const hay = (p) => (p.name + ' ' + (TITLES[p.type] || p.type) + ' ' + p.col.replace(/-/g, ' ') + (p.isNew ? ' new' : '')).toLowerCase();
    const scored = shopList().map((p) => ({ p, s: tokens.reduce((n, t) => n + (hay(p).includes(t) ? 1 : 0), 0) }));
    const hits = scored.filter((x) => x.s > 0).sort((a, b) => b.s - a.s || a.p.rank - b.p.rank);
    if (hits.length) return hits.map((x) => x.p);
    // Sin coincidencias exactas: siempre se muestra algo (lo más parecido por letras)
    const letters = q.toLowerCase().replace(/\s+/g, '');
    return shopList().map((p) => ({ p, s: Array.from(new Set(letters)).filter((ch) => hay(p).includes(ch)).length }))
      .sort((a, b) => b.s - a.s || a.p.rank - b.p.rank).map((x) => x.p);
  }

  function updateSearch() {
    const q = sInput.value.trim();
    sOverlay.classList.toggle('has-query', !!q);
    sSugg.hidden = !q;
    sResults.innerHTML = '';
    if (!q) return;
    sSugg.innerHTML = 'Suggestions: ';
    [q, q + ' shorts'].forEach((text, n) => {
      const b = document.createElement('button');
      b.type = 'button';
      if (n === 1) { b.appendChild(document.createTextNode(q + ' ')); const d = document.createElement('span'); d.className = 'dim'; d.textContent = 'shorts'; b.appendChild(d); }
      else b.textContent = q;
      b.addEventListener('click', () => { sInput.value = text; updateSearch(); sInput.focus(); });
      sSugg.appendChild(b);
    });
    searchProducts(q).forEach((p) => sResults.appendChild(buildCard(p)));
  }

  function openSearch() {
    closeAll();
    sOverlay.hidden = false;
    document.documentElement.classList.add('search-open');
    sBtn.setAttribute('aria-expanded', 'true');
    sInput.focus();
  }
  function closeSearch() {
    if (sOverlay.hidden) return;
    sOverlay.hidden = true;
    document.documentElement.classList.remove('search-open');
    sBtn.setAttribute('aria-expanded', 'false');
    sInput.value = '';
    updateSearch();
    sBtn.focus();
  }

  sBtn.addEventListener('click', openSearch);
  document.getElementById('searchClose').addEventListener('click', closeSearch);
  sOverlay.addEventListener('click', (e) => { if (e.target === sOverlay) closeSearch(); });
  sInput.addEventListener('input', updateSearch);
  document.getElementById('searchForm').addEventListener('submit', (e) => { e.preventDefault(); updateSearch(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSearch(); });

  /* ---------------- Menú lateral móvil ---------------- */
  const drawer = document.getElementById('drawer');
  const scrim = document.getElementById('drawerScrim');
  const menuBtn = document.getElementById('menuBtn');
  const drawerBody = drawer.querySelector('.drawer-body');
  const panels = Array.from(drawer.querySelectorAll('.drawer-panel'));
  const feat = document.getElementById('featScroll');
  const thumb = document.getElementById('featThumb');

  function renderFeatured() {
    feat.innerHTML = '';
    shopList().slice(0, 6).forEach((p) => feat.appendChild(buildCard(p)));
    updateThumb();
  }
  renderFeatured();

  function showPanel(name) {
    panels.forEach((el) => { el.hidden = el.dataset.panel !== name; });
    drawerBody.scrollTop = 0;
  }
  function updateThumb() {
    const total = feat.scrollWidth, view = feat.clientWidth;
    if (!total || !view) return;
    const w = Math.min(1, view / total);
    const max = feat.scrollWidth - feat.clientWidth || 1;
    thumb.style.width = (w * 100) + '%';
    thumb.style.left = ((feat.scrollLeft / max) * (1 - w) * 100) + '%';
  }
  function openDrawer() {
    closeAll();
    showPanel('main');
    drawer.classList.add('is-open');
    scrim.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    menuBtn.setAttribute('aria-expanded', 'true');
    document.documentElement.classList.add('drawer-open');
    requestAnimationFrame(updateThumb);
    document.getElementById('drawerClose').focus();
  }
  function closeDrawer() {
    if (!drawer.classList.contains('is-open')) return;
    drawer.classList.remove('is-open');
    scrim.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    menuBtn.setAttribute('aria-expanded', 'false');
    document.documentElement.classList.remove('drawer-open');
    menuBtn.focus();
  }

  menuBtn.addEventListener('click', openDrawer);
  document.getElementById('drawerClose').addEventListener('click', closeDrawer);
  scrim.addEventListener('click', closeDrawer);
  drawer.addEventListener('click', (e) => {
    const sub = e.target.closest('[data-sub]');
    if (sub) return showPanel(sub.dataset.sub);
    if (e.target.closest('[data-back]')) return showPanel('main');
    if (e.target.closest('a')) closeDrawer();
  });
  feat.addEventListener('scroll', updateThumb, { passive: true });
  window.addEventListener('resize', updateThumb);
  window.addEventListener('hashchange', closeDrawer);
  window.matchMedia('(min-width: 961px)').addEventListener('change', (e) => { if (e.matches) closeDrawer(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDrawer(); });

  /* Insignia del carrito: JUBIN.setCartCount(1) la muestra */
  window.JUBIN = { setCartCount(n) {
    const b = document.getElementById('cartCount');
    b.textContent = n; b.hidden = !n;
  } };

  route();

  /* ---------------- Descubre los productos por el nombre de las fotos ---------------- */
  function probe(src) {
    return new Promise(function (resolve) {
      var img = new Image();
      img.onload = function () { resolve(true); };
      img.onerror = function () { resolve(false); };
      img.src = src;
    });
  }

  /* Busca tshirt1.jpg, tshirt2.jpg... hasta que falte uno; y sus fotos extra -2, -3, -4 */
  async function collect(prefix) {
    const out = [];
    for (let n = 1; n <= MAX_PER_SECTION; n++) {
      if (!(await probe(prefix + n + '.jpg'))) break;
      const key = prefix + n;
      const extra = await Promise.all([2, 3, 4].map((v) => probe(key + '-' + v + '.jpg')));
      const imgs = [key + '.jpg'];
      for (let v = 0; v < extra.length && extra[v]; v++) imgs.push(key + '-' + (v + 2) + '.jpg');
      out.push({ n: n, key: key, imgs: imgs });
    }
    return out;
  }

  async function discover() {
    const found = [];
    for (const sec of SECTIONS) {
      const list = await collect(sec.prefix);
      list.forEach(function (it) {
        const d = DETAILS[it.key] || {};
        found.push({
          name: d.name || (sec.label + ' ' + it.n),
          price: d.price != null ? d.price : 0,
          type: sec.type,
          col: d.col || '',
          isNew: d.isNew != null ? d.isNew : it.n === list.length,   // el último número de cada sección cuenta como nuevo
          color: '#dddddd',
          imgs: it.imgs,
        });
      });
    }
    for (const c of COLLECTIONS) {
      const list = await collect(c.prefix);
      list.forEach(function (it) {
        const d = DETAILS[it.key] || {};
        found.push({
          name: d.name || (c.title + ' ' + it.n),
          price: d.price != null ? d.price : 0,
          type: 'collection',
          col: c.slug,
          onlyCol: true,                                             // solo se ve dentro de su colección
          isNew: false,
          color: '#dddddd',
          imgs: it.imgs,
        });
      });
    }
    return found;
  }

  discover().then(function (found) {
    if (found.length) {
      PRODUCTS.length = 0;
      found.forEach((p, i) => PRODUCTS.push(Object.assign({ rank: i }, p)));
    } else if (!USE_SAMPLES_IF_EMPTY) {
      PRODUCTS.length = 0;
    } else {
      return;                                                  // se quedan los de ejemplo
    }
    renderFeatured();
    if (!listing.hidden) renderGrid();
  });
})();


/* =====================================================
   INICIO: video (con reemplazo) y fotos pasando
   ===================================================== */
(function () {
  /* Video: los .mp4 están sueltos junto a index.html.
     Cambia aquí los nombres si tus archivos se llaman distinto. */
  var VIDEO_PC = 'hero-pc.mp4';      // pantallas grandes (computadora)
  var VIDEO_MOBILE = 'hero.mp4';     // celular / tablet

  var box = document.getElementById('heroVideoBox');
  var video = document.getElementById('heroVideo');
  if (video) {
    var desktop = window.matchMedia('(min-width: 961px)');
    var current = null, triedOther = false;

    var load = function (file) {
      current = file;
      video.src = file;
      video.load();
      var p = video.play();
      if (p && p.catch) p.catch(function () { /* autoplay bloqueado: queda el reemplazo */ });
    };
    var choose = function () {
      triedOther = false;
      box.classList.remove('has-video');
      load(desktop.matches ? VIDEO_PC : VIDEO_MOBILE);
    };

    video.addEventListener('playing', function () { box.classList.add('has-video'); });
    video.addEventListener('error', function () {
      if (!triedOther) {                       // si falta uno, prueba con el otro
        triedOther = true;
        load(current === VIDEO_PC ? VIDEO_MOBILE : VIDEO_PC);
      } else {
        box.classList.remove('has-video');     // ninguno carga: se ve el fondo animado
      }
    });
    desktop.addEventListener('change', choose); // al cambiar de tamaño, cambia de video
    choose();
  }

  /* Fotos pasando */
  var show = document.getElementById('photoShow');
  if (!show) return;

  /* Las 5 fotos reales (sueltas junto a index.html).
     Cambia los nombres si tus archivos se llaman distinto.
     Si una foto no carga, esa pantalla muestra la silueta de reemplazo. */
  var PHOTOS = ['foto1.jpg', 'foto2.jpg', 'foto3.jpg', 'foto4.jpg', 'foto5.jpg'];
  Array.prototype.forEach.call(show.querySelectorAll('.show-item'), function (item, k) {
    if (!PHOTOS[k]) return;
    var img = new Image();
    img.className = 'show-img';
    img.alt = 'Photo ' + (k + 1);
    img.onload = function () {
      var fig = item.querySelector('.show-fig');
      if (fig) fig.remove();
      item.appendChild(img);
    };
    img.src = PHOTOS[k];
  });
  var items = Array.prototype.slice.call(show.querySelectorAll('.show-item'));
  var dots = Array.prototype.slice.call(show.querySelectorAll('.show-dots button'));
  var i = 0, timer = null;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function go(n) {
    i = (n + items.length) % items.length;
    items.forEach(function (el, k) { el.classList.toggle('is-on', k === i); });
    dots.forEach(function (d, k) { d.setAttribute('aria-selected', k === i ? 'true' : 'false'); });
  }
  function play() { if (reduce || timer) return; timer = setInterval(function () { go(i + 1); }, 4500); }
  function stop() { clearInterval(timer); timer = null; }

  show.querySelector('.show-arrow--prev').addEventListener('click', function () { go(i - 1); });
  show.querySelector('.show-arrow--next').addEventListener('click', function () { go(i + 1); });
  dots.forEach(function (d, k) { d.addEventListener('click', function () { go(k); }); });
  show.addEventListener('mouseenter', stop);
  show.addEventListener('mouseleave', play);
  show.addEventListener('focusin', stop);
  show.addEventListener('focusout', play);
  document.addEventListener('visibilitychange', function () { document.hidden ? stop() : play(); });

  var x0 = null;   // deslizar con el dedo
  show.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
  show.addEventListener('touchend', function (e) {
    if (x0 === null) return;
    var dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 40) go(i + (dx < 0 ? 1 : -1));
    x0 = null;
  });
  play();
})();

/* =====================================================
   MENÚ SHOP: la foto de cada tarjeta sale de LA MISMA foto de la colección.
   Un solo nombre sirve para todo:
     dreamy-blooms1.jpg  ->  sale en la tarjeta DREAMY BLOOMS del menú SHOP
                              y es el primer producto dentro de la colección.
   (dreamy-blooms2.jpg, dreamy-blooms3.jpg... salen solo dentro de la colección.)
   Orden en que se busca la foto de la tarjeta:
     1) dreamy-blooms.jpg   (foto exclusiva para el menú, opcional)
     2) menu1.jpg           (nombre anterior, sigue funcionando)
     3) dreamy-blooms1.jpg  (primera foto de la colección)
   Si no existe ninguna, la tarjeta conserva el color de reemplazo.
   ===================================================== */
(function () {
  Array.prototype.forEach.call(document.querySelectorAll('.mega-card'), function (card, k) {
    var shot = card.querySelector('.shot');
    if (!shot) return;
    var slug = (card.getAttribute('href') || '').split('/').pop();
    if (!slug) return;
    var candidates = [slug + '.jpg', 'menu' + (k + 1) + '.jpg', slug + '1.jpg'];

    (function tryNext(n) {
      if (n >= candidates.length) return;
      var img = new Image();
      img.alt = '';
      img.draggable = false;
      img.onload = function () {
        shot.style.background = 'none';
        shot.innerHTML = '';
        shot.appendChild(img);
      };
      img.onerror = function () { tryNext(n + 1); };
      img.src = candidates[n];
    })(0);
  });
})();

/* =====================================================
   CLIC FIRME en fotos y enlaces
   Los navegadores permiten "arrastrar" imágenes y enlaces. Si el mouse se mueve unos
   píxeles mientras haces clic, empieza un arrastre y el clic se cancela (parece que
   la foto "no hace nada"). Aquí se desactiva el arrastre para que el clic siempre cuente.
   ===================================================== */
document.addEventListener('dragstart', function (e) {
  if (e.target && e.target.closest && e.target.closest('a, img')) e.preventDefault();
});

/* =====================================================================
   THE JUNGLE CLOSET - extras.js
   Agrega, sin tocar script.js ni index.html:
     1) ABOUT US (página)                       -> #/about
     2) CREATE ACCOUNT (página de registro)     -> #/account/register
     3) Página de cada PRODUCTO al tocar su foto -> #/product/nombre-del-producto
     4) Carrito con productos (botón ADD TO CART)
   Se carga DESPUÉS de script.js.
   ===================================================================== */
(function () {
  'use strict';

  /* ---------------- Textos que puedes cambiar ---------------- */
  var ABOUT = {
    tag: 'BRAND STORY',
    title: 'Where Style Runs Wild',
    quote: '\u201CEvery piece is made to help you rule your style.\u201D',
  };
  var SIZES = ['S', 'M', 'L', 'XL', 'XXL'];                       // tallas que se muestran en cada producto
  var POLICY = [                                           // cuadro "EXCHANGE POLICY" de cada producto
    '<b>7-day exchange window</b> from the date you receive your order',
    'Items must be <b>unworn, unwashed</b>, and in original packaging with all tags',
    '<b>Customs Duties:</b> The postage and possible TAXES incurred by the return or exchange are fully borne by the customer',
    '<b>Exchange for a different size only</b> \u2014 return and reshipping fees are borne by the customer',
  ];
  var DESCRIPTION = function (p) {                         // texto de "Description" (puedes cambiarlo)
    return '<p>' + esc(p.name) + '. Designed for everyday comfort, made to last.</p>';
  };
  var CAT_TITLES = {
    'all-items': 'All Items', 'new-arrivals': 'New Arrivals', 'dress': 'T-shirt', 'top': 'Sportswear', 'bottom': 'Board shorts',
    'dreamy-blooms': 'Dreamy Blooms', 'heartfelt-petals': 'Heartfelt Petals', 'the-sparkling-touch': 'The Sparkling Touch',
  };

  /* ---------------- Utilidades ---------------- */
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function slug(s) { return String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
  function money(n) { return '$' + (n % 1 ? n.toFixed(2) : n.toFixed(0)); }
  var LS = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sin almacenamiento: sigue funcionando en esta visita */ } },
  };
  var CHEV_L = '<svg viewBox="0 0 11 18" aria-hidden="true"><path d="M9.5 1L1.5 9l8 8"/></svg>';
  var CHEV_R = '<svg viewBox="0 0 11 18" aria-hidden="true"><path d="M1.5 1l8 8-8 8"/></svg>';

  /* ---------------- Vistas nuevas ---------------- */
  var cart = $('#cart');
  var stage = $('.stage') || document.body;
  function make(html) { var d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstChild; }

  var aboutView = make(
    '<main class="about" id="aboutView" hidden>' +
      '<h1 class="list-title about-title">ABOUT US</h1>' +
      '<section class="about-card">' +
        '<p class="about-tag">' + esc(ABOUT.tag) + '</p>' +
        '<h2>' + esc(ABOUT.title) + '</h2>' +
        '<span class="about-line"></span>' +
        '<p class="about-quote">' + esc(ABOUT.quote) + '</p>' +
      '</section>' +
    '</main>');

  var regView = make(
    '<main class="login" id="registerView" hidden>' +
      '<h1 class="list-title">Create account</h1>' +
      '<form class="login-form" id="registerForm" novalidate>' +
        '<label for="rFirst">First name</label><input id="rFirst" type="text" autocomplete="given-name">' +
        '<label for="rLast">Last name</label><input id="rLast" type="text" autocomplete="family-name">' +
        '<label for="rEmail">Email</label><input id="rEmail" type="email" autocomplete="email">' +
        '<label for="rPass">Password</label><input id="rPass" type="password" autocomplete="new-password">' +
        '<p class="form-msg" id="registerMsg" role="status" aria-live="polite"></p>' +
        '<div class="login-actions"><button type="submit" class="btn">Create</button>' +
        '<a href="#/account/login" class="soft-link soft-link--lg">Return to login</a></div>' +
      '</form>' +
    '</main>');

  var prodView = make('<main class="product" id="productView" hidden></main>');

  var anchor = cart || stage.lastElementChild;
  if (anchor && anchor.parentNode) {
    anchor.parentNode.insertBefore(prodView, anchor.nextSibling);
    anchor.parentNode.insertBefore(regView, anchor.nextSibling);
    anchor.parentNode.insertBefore(aboutView, anchor.nextSibling);
  } else { stage.appendChild(aboutView); stage.appendChild(regView); stage.appendChild(prodView); }

  var theirViews = ['#home', '#products', '#login', '#cart'].map(function (s) { return $(s); }).filter(Boolean);
  var mine = [aboutView, regView, prodView];

  /* ---------------- Enlaces que ahora funcionan ---------------- */
  var aboutLinks = $$('a.nav-link, a.drawer-link, .legal a').filter(function (a) { return /^about us$/i.test(a.textContent.trim()); });
  aboutLinks.forEach(function (a) { a.setAttribute('href', '#/about'); });
  $$('.login-actions a').forEach(function (a) {
    if (/create account/i.test(a.textContent)) a.setAttribute('href', '#/account/register');
  });

  /* ---------------- Router (se suma al de script.js) ---------------- */
  var lastCtx = 'shop/all-items';

  function closeSearchIfOpen() {
    var so = $('#searchOverlay');
    if (so && !so.hidden) { var c = $('#searchClose'); if (c) c.click(); }
  }
  function showMine(view) {
    theirViews.forEach(function (v) { v.hidden = true; });
    mine.forEach(function (v) { v.hidden = v !== view; });
    document.body.classList.add('is-products');          // cabecera blanca con línea
    var sl = $('#shopLink'); if (sl) sl.classList.remove('is-active');
  }
  function hideMine() { mine.forEach(function (v) { v.hidden = true; }); }
  function setAboutActive(on) { aboutLinks.forEach(function (a) { a.classList.toggle('is-active', on); }); }

  function route() {
    var parts = location.hash.replace(/^#\/?/, '').split('/');
    var kind = parts[0], arg = parts.slice(1).join('/');
    if ((kind === 'shop' || kind === 'collection') && arg) lastCtx = kind + '/' + arg;
    setAboutActive(false);
    if (kind === 'about') {
      closeSearchIfOpen(); showMine(aboutView); setAboutActive(true);
      document.title = 'About us \u2013 The Jungle Closet'; window.scrollTo(0, 0);
    } else if (kind === 'account' && arg === 'register') {
      closeSearchIfOpen(); showMine(regView);
      document.title = 'Create account \u2013 The Jungle Closet'; window.scrollTo(0, 0);
    } else if (kind === 'product') {
      closeSearchIfOpen(); renderProduct(decodeURIComponent(arg)); window.scrollTo(0, 0);
    } else {
      hideMine();
      if (kind === 'cart') renderCart();
    }
  }
  window.addEventListener('hashchange', route);

  /* ---------------- Crear cuenta ---------------- */
  $('#registerForm', regView).addEventListener('submit', function (e) {
    e.preventDefault();
    var msg = $('#registerMsg');
    var first = $('#rFirst').value.trim(), last = $('#rLast').value.trim();
    var email = $('#rEmail').value.trim(), pass = $('#rPass').value;
    if (!first || !last) { msg.textContent = 'Enter your first and last name.'; return; }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { msg.textContent = 'Enter a valid email.'; return; }
    if (pass.length < 5) { msg.textContent = 'Your password needs at least 5 characters.'; return; }
    e.target.reset();
    msg.textContent = 'Demo only: connect a store or backend to create real accounts.';
  });

  /* ---------------- Al tocar la foto o el nombre de un producto ---------------- */
  function readCard(card) {
    var nameEl = $('.card-name', card);
    if (!nameEl) return null;
    var name = nameEl.textContent.trim();
    var priceEl = $('.card-price', card);
    var price = priceEl ? parseFloat(priceEl.textContent.replace(/[^0-9.]/g, '')) || 0 : 0;
    var imgs = $$('img.slide', card).map(function (i) { return i.getAttribute('src'); }).filter(Boolean);
    var fig = $('.fig', card), shape = 'top', color = '#dddddd';
    if (fig) {
      var m = /fig--(dress|top|bottom)/.exec(fig.className); if (m) shape = m[1];
      color = (fig.style.getPropertyValue('--c') || '#dddddd').trim();
    }
    return { id: slug(name), name: name, price: price, imgs: imgs, shape: shape, color: color, ctx: lastCtx };
  }

  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!t || !t.closest) return;
    if (t.closest('.arrow')) return;                       // las flechas de la tarjeta siguen funcionando
    var card = t.closest('.card');
    if (!card) return;
    var a = t.closest('a');
    if (!a || !(a.classList.contains('card-hit') || a.classList.contains('card-meta'))) return;
    var data = readCard(card);
    if (!data) return;
    e.preventDefault(); e.stopPropagation();
    // guardar este producto y los que están a su lado (para Previous / Next)
    var products = LS.get('jc_products', {}), ids = [];
    $$('.card', card.parentElement).forEach(function (c) {
      var d = readCard(c); if (!d) return;
      products[d.id] = d; ids.push(d.id);
    });
    products[data.id] = data;
    var lists = LS.get('jc_lists', {}); lists[data.ctx] = ids;
    LS.set('jc_products', products); LS.set('jc_lists', lists);
    location.hash = '#/product/' + data.id;
  }, true);

  /* ---------------- Página de producto ---------------- */
  function slideHTML(p, i) {
    if (p.imgs && p.imgs.length) return '<img src="' + esc(p.imgs[i]) + '" alt="' + esc(p.name) + '">';
    return '<div class="fig fig--' + esc(p.shape) + ' fig--v' + i + '" style="--c:' + esc(p.color) + '" role="img" aria-label="' + esc(p.name) + '"></div>';
  }

  function renderProduct(id) {
    var p = LS.get('jc_products', {})[id];
    showMine(prodView);
    if (!p) {
      prodView.innerHTML = '<p class="empty">We could not find this product. <a class="soft-link" href="#/shop/all-items">Back to shop</a></p>';
      return;
    }
    document.title = p.name + ' \u2013 The Jungle Closet';
    var ctx = p.ctx || 'shop/all-items', cparts = ctx.split('/');
    var catTitle = CAT_TITLES[cparts[1]] || 'All Items';
    var list = LS.get('jc_lists', {})[ctx] || [], at = list.indexOf(id);
    var prev = at > 0 ? list[at - 1] : null, next = at >= 0 && at < list.length - 1 ? list[at + 1] : null;
    var count = (p.imgs && p.imgs.length) ? p.imgs.length : 4;

    var slides = '', thumbs = '';
    for (var i = 0; i < count; i++) {
      slides += '<div class="gslide' + (i === 0 ? ' is-on' : '') + '">' + slideHTML(p, i) + '</div>';
      thumbs += '<button type="button" class="gthumb' + (i === 0 ? ' is-cur' : '') + '" aria-label="Photo ' + (i + 1) + '">' + slideHTML(p, i) + '</button>';
    }
    var sizes = SIZES.map(function (s) { return '<button type="button" class="size" data-size="' + esc(s) + '" aria-pressed="false">' + esc(s) + '</button>'; }).join('');

    prodView.innerHTML =
      '<nav class="crumbs" aria-label="Breadcrumb">' +
        '<div class="crumb-l"><a href="#/">Home</a><span class="sep">\u203A</span>' +
          '<a href="#/' + esc(ctx) + '">' + esc(catTitle) + '</a><span class="sep">\u203A</span><span class="cur">' + esc(p.name) + '</span></div>' +
        '<div class="crumb-r">' +
          (prev ? '<a href="#/product/' + esc(prev) + '">\u2039 Previous</a>' : '') +
          (next ? '<a href="#/product/' + esc(next) + '">Next \u203A</a>' : '') +
        '</div>' +
      '</nav>' +
      '<div class="pgrid">' +
        '<div class="gal">' +
          '<div class="gal-stage">' + slides +
            (count > 1 ? '<button type="button" class="gal-arrow gal-prev" aria-label="Previous photo">' + CHEV_L + '</button>' +
                         '<button type="button" class="gal-arrow gal-next" aria-label="Next photo">' + CHEV_R + '</button>' : '') +
          '</div>' +
          (count > 1 ? '<div class="gal-thumbs">' + thumbs + '</div>' : '') +
        '</div>' +
        '<div class="pinfo">' +
          '<h1 class="ptitle">' + esc(p.name) + '</h1>' +
          (p.price > 0 ? '<p class="pprice">' + money(p.price) + '</p>' : '') +
          '<p class="plabel">Size</p><div class="sizes" role="group" aria-label="Size">' + sizes + '</div>' +
          '<div class="policy" tabindex="0" aria-label="Exchange policy"><h3>EXCHANGE POLICY \u2014 AT A GLANCE</h3>' +
            POLICY.map(function (t) { return '<p>' + t + '</p>'; }).join('') + '</div>' +
          '<label class="accept"><input type="checkbox" id="acceptPolicy"><span>I accept that I have read and agree to the <b>Return, Refund, Cancellation and other applicable policies</b> presented during booking.</span></label>' +
          '<button type="button" class="atc" id="atcBtn">Add to cart</button>' +
          '<p class="form-msg" id="atcMsg" role="status" aria-live="polite"></p>' +
          '<div class="acc"><button type="button" class="acc-h" id="accBtn" aria-expanded="true">Description<span class="acc-i" aria-hidden="true"></span></button>' +
            '<div class="acc-b" id="accBody">' + DESCRIPTION(p) + '</div></div>' +
        '</div>' +
      '</div>';

    /* galería */
    var gSlides = $$('.gslide', prodView), gThumbs = $$('.gthumb', prodView), gi = 0;
    function go(n) {
      gi = (n + gSlides.length) % gSlides.length;
      gSlides.forEach(function (s, k) { s.classList.toggle('is-on', k === gi); });
      gThumbs.forEach(function (t, k) { t.classList.toggle('is-cur', k === gi); });
    }
    gThumbs.forEach(function (t, k) { t.addEventListener('click', function () { go(k); }); });
    var gp = $('.gal-prev', prodView), gn = $('.gal-next', prodView);
    if (gp) gp.addEventListener('click', function () { go(gi - 1); });
    if (gn) gn.addEventListener('click', function () { go(gi + 1); });

    /* tallas, política y botón */
    var size = '', accept = $('#acceptPolicy'), atc = $('#atcBtn'), msg = $('#atcMsg');
    $$('.size', prodView).forEach(function (b) {
      b.addEventListener('click', function () {
        size = b.getAttribute('data-size'); msg.textContent = '';
        $$('.size', prodView).forEach(function (o) { var on = o === b; o.classList.toggle('is-sel', on); o.setAttribute('aria-pressed', on ? 'true' : 'false'); });
      });
    });
    accept.addEventListener('change', function () { if (accept.checked && msg.textContent.indexOf('policy') !== -1) msg.textContent = ''; });
    var atcTimer = null;
    atc.addEventListener('click', function () {
      if (!size) { msg.textContent = 'Please select a size.'; return; }
      if (!accept.checked) { msg.textContent = 'Please accept the exchange policy to continue.'; return; }
      addToCart(p, size);
      msg.innerHTML = 'Added to your cart. <a class="soft-link" href="#/cart">View cart</a>';
      atc.textContent = 'Added \u2713';
      clearTimeout(atcTimer); atcTimer = setTimeout(function () { atc.textContent = 'Add to cart'; }, 1800);
    });
    var accBtn = $('#accBtn'), accBody = $('#accBody');
    accBtn.addEventListener('click', function () {
      var open = accBtn.getAttribute('aria-expanded') === 'true';
      accBtn.setAttribute('aria-expanded', open ? 'false' : 'true'); accBody.hidden = open;
    });
  }

  /* ---------------- Carrito ---------------- */
  var cartItems = LS.get('jc_cart', []);
  var emptyCartHTML = cart ? cart.innerHTML : '';

  function updateBadge() {
    var n = cartItems.reduce(function (s, x) { return s + x.qty; }, 0);
    if (window.JUBIN && window.JUBIN.setCartCount) window.JUBIN.setCartCount(n);
  }
  function addToCart(p, size) {
    var found = cartItems.filter(function (x) { return x.id === p.id && x.size === size; })[0];
    if (found) found.qty += 1;
    else cartItems.push({ id: p.id, name: p.name, price: p.price, size: size, qty: 1, img: (p.imgs && p.imgs[0]) || '', shape: p.shape, color: p.color });
    LS.set('jc_cart', cartItems); updateBadge();
  }

  function renderCart() {
    if (!cart) return;
    if (!cartItems.length) { cart.classList.remove('has-items'); cart.innerHTML = emptyCartHTML; return; }
    cart.classList.add('has-items');
    var total = 0;
    var rows = cartItems.map(function (it, k) {
      total += it.price * it.qty;
      var thumb = it.img ? '<img src="' + esc(it.img) + '" alt="">' :
        '<div class="fig fig--' + esc(it.shape) + '" style="--c:' + esc(it.color) + '"></div>';
      return '<li class="cart-row" data-k="' + k + '">' +
        '<a class="cart-thumb" href="#/product/' + esc(it.id) + '">' + thumb + '</a>' +
        '<div class="cart-info"><a class="cart-name" href="#/product/' + esc(it.id) + '">' + esc(it.name) + '</a><span class="cart-size">Size: ' + esc(it.size) + '</span></div>' +
        '<div class="qty"><button type="button" data-act="dec" aria-label="Less">\u2212</button><span>' + it.qty + '</span><button type="button" data-act="inc" aria-label="More">+</button></div>' +
        '<span class="cart-price">' + (it.price > 0 ? money(it.price * it.qty) : '') + '</span>' +
        '<button type="button" class="cart-del" data-act="del" aria-label="Remove">\u2715</button></li>';
    }).join('');
    cart.innerHTML =
      '<div class="cart-full"><h1>Your cart</h1><ul class="cart-list">' + rows + '</ul>' +
      (total > 0 ? '<div class="cart-total"><span>Subtotal</span><strong>' + money(total) + '</strong></div>' : '') +
      '<p class="form-msg" id="cartMsg" role="status" aria-live="polite"></p>' +
      '<div class="cart-actions"><button type="button" class="btn" id="checkoutBtn">Check out</button>' +
      '<a class="soft-link soft-link--lg" href="#/shop/all-items">Continue shopping</a></div></div>';
  }
  if (cart) cart.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('button') : null;
    if (!b) return;
    if (b.id === 'checkoutBtn') { var m = $('#cartMsg'); if (m) m.textContent = 'Demo only: connect a store or backend to check out.'; return; }
    var row = b.closest('.cart-row'); if (!row) return;
    var k = +row.getAttribute('data-k'), act = b.getAttribute('data-act'), it = cartItems[k];
    if (!it) return;
    if (act === 'inc') it.qty += 1;
    else if (act === 'dec') it.qty = Math.max(1, it.qty - 1);
    else if (act === 'del') cartItems.splice(k, 1);
    LS.set('jc_cart', cartItems); updateBadge(); renderCart();
  });

  updateBadge();
  if (window.JUBIN) window.JUBIN.clearCart = function () { cartItems.length = 0; LS.set('jc_cart', cartItems); updateBadge(); };
  route();
})();

/* =====================================================================
   SIZE GUIDE (hombres)  ->  #/size-guide
   FAVORITES (corazón en cada producto)  ->  #/favorites
   EXCHANGE POLICY  ->  #/exchange-policy
   ===================================================================== */
(function () {
  'use strict';

  /* ---------------- Lo que puedes cambiar ---------------- */
  var SOCIAL = {                                   // deja '' para ocultar la línea
    facebook: '',                                  // ej: 'https://www.facebook.com/tu-pagina'
    instagram: '',                                 // ej: 'https://www.instagram.com/tu-cuenta'
    email: 'contact@thejunglecloset.com',
  };
  var CHART = {                                    // medidas del cuerpo en PULGADAS (los cm se calculan solos)
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    chest: [36, 38, 40, 42, 44],
    waist: [30, 32, 34, 36, 38],
    hip:   [36, 38, 40, 42, 44],
  };
  var EXCHANGE = [
    '<b>7-day exchange window</b> from the date you receive your order.',
    'Items must be <b>unworn, unwashed</b>, and in original packaging with all tags.',
    '<b>Exchange for a different size only</b> \u2014 return and reshipping fees are borne by the customer.',
    'To start an exchange, contact us with your order number and the size you need.',
  ];

  /* ---------------- Utilidades ---------------- */
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function slug(s) { return String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
  function money(n) { return '$' + (n % 1 ? n.toFixed(2) : n.toFixed(0)); }
  function make(html) { var d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstChild; }
  var LS = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sin almacenamiento */ } },
  };
  var HEART = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>';

  /* ---------------- Size guide ---------------- */
  function cm(n) { return Math.round(n * 2.54); }
  function table(conv) {
    function row(label, arr) { return '<tr><th class="sg-l">' + label + '</th>' + arr.map(function (v) { return '<td>' + conv(v) + '</td>'; }).join('') + '</tr>'; }
    return '<table class="sg-table"><thead><tr><th class="sg-l">SIZE</th>' +
      CHART.sizes.map(function (s) { return '<th>' + esc(s) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      row('CHEST', CHART.chest) + row('WAIST', CHART.waist) + row('HIP', CHART.hip) + '</tbody></table>';
  }
  var FIGURE =
    '<svg class="sg-fig" viewBox="0 0 200 340" role="img" aria-label="Where to measure: chest, waist and hip" fill="none" stroke="#444" stroke-width="1">' +
      '<defs><g id="sgHalf">' +
        '<path d="M74 48 C62 50 48 52 42 62 C38 70 38 84 36 100 L30 146 L27 184 C27 190 34 190 35 184 L41 146 L46 104 C47 94 48 86 50 80"/>' +
        '<path d="M50 80 C52 100 54 118 56 130 C58 142 54 156 54 168"/>' +
        '<path d="M54 168 C54 196 56 230 56 262 L56 310 C56 316 64 316 66 310 L70 262 C72 230 76 200 80 176"/>' +
      '</g></defs>' +
      '<ellipse cx="80" cy="22" rx="12" ry="16"/><path d="M74 37 V48 M86 37 V48"/>' +
      '<use href="#sgHalf"/><use href="#sgHalf" transform="translate(160,0) scale(-1,1)"/>' +
      '<g stroke="#cf6f93"><path d="M52 84 H150"/><path d="M54 128 H150"/><path d="M54 170 H150"/></g>' +
      '<g fill="#cf6f93" stroke="none" font-family="Georgia, serif" font-size="13" letter-spacing=".5"><text x="152" y="82">CHEST</text><text x="152" y="126">WAIST</text><text x="152" y="168">HIP</text></g>' +
    '</svg>';

  var social = '';
  if (SOCIAL.facebook) social += '<p>Facebook: <a href="' + esc(SOCIAL.facebook) + '" target="_blank" rel="noopener">' + esc(SOCIAL.facebook) + '</a></p>';
  if (SOCIAL.instagram) social += '<p>Instagram: <a href="' + esc(SOCIAL.instagram) + '" target="_blank" rel="noopener">' + esc(SOCIAL.instagram) + '</a></p>';
  if (SOCIAL.email) social += '<p>You can also send message on website or email us at <a href="mailto:' + esc(SOCIAL.email) + '">' + esc(SOCIAL.email) + '</a></p>';

  var sizeView = make(
    '<main class="info-page" id="sizeView" hidden>' +
      '<h1 class="list-title">Size Guide</h1>' +
      '<div class="info-body"><p>This size chart will help you pick your size. For personal help with sizing, please contact us via our social media.</p>' + social + '</div>' +
      '<section class="sg-card" aria-label="Men\u2019s size chart">' +
        '<p class="sg-brand">THE JUNGLE CLOSET</p>' +
        '<h2 class="sg-title">SIZE CHART</h2>' +
        '<p class="sg-for">MEN</p>' +
        '<div class="sg-grid"><div class="sg-tables">' +
          table(function (v) { return v; }) + '<p class="sg-unit">( UNIT: Inch )</p>' +
          table(cm) + '<p class="sg-unit">( UNIT: Centimeters )</p>' +
        '</div><div class="sg-figure">' + FIGURE + '</div></div>' +
      '</section>' +
    '</main>');

  /* ---------------- Exchange policy ---------------- */
  var exchView = make(
    '<main class="info-page" id="exchView" hidden>' +
      '<h1 class="list-title">Exchange Policy</h1>' +
      '<div class="info-body"><p>We want you to love what you order. If the size is not right, we are happy to help.</p>' +
      '<ul class="info-list">' + EXCHANGE.map(function (t) { return '<li>' + t + '</li>'; }).join('') + '</ul>' +
      (SOCIAL.email ? '<p>Questions? Write to us at <a href="mailto:' + esc(SOCIAL.email) + '">' + esc(SOCIAL.email) + '</a></p>' : '') + '</div>' +
    '</main>');

  /* ---------------- Favorites (página) ---------------- */
  var favView = make(
    '<main class="listing" id="favView" hidden>' +
      '<h1 class="list-title">Favorites</h1>' +
      '<div class="grid fav-grid" id="favGrid"></div>' +
      '<div class="fav-empty" id="favEmpty" hidden>' +
        '<span class="fav-empty-ico">' + HEART + '</span>' +
        '<p>You have no favorites yet.</p><p class="fav-hint">Tap the heart on any product to save it here.</p>' +
        '<a class="btn" href="#/shop/all-items">Start shopping</a>' +
      '</div>' +
    '</main>');

  var anchor = $('#productView') || $('#cart') || $('.stage').lastElementChild;
  var parent = anchor.parentNode;
  [exchView, favView, sizeView].forEach(function (v) { parent.insertBefore(v, anchor.nextSibling); });

  /* ---------------- Corazones en las tarjetas ---------------- */
  function readLite(card) {
    var nameEl = $('.card-name', card); if (!nameEl) return null;
    var name = nameEl.textContent.trim(), priceEl = $('.card-price', card);
    var price = priceEl ? parseFloat(priceEl.textContent.replace(/[^0-9.]/g, '')) || 0 : 0;
    var imgs = $$('img.slide', card).map(function (i) { return i.getAttribute('src'); }).filter(Boolean);
    var fig = $('.fig', card), shape = 'top', color = '#dddddd';
    if (fig) { var m = /fig--(dress|top|bottom)/.exec(fig.className); if (m) shape = m[1]; color = (fig.style.getPropertyValue('--c') || '#dddddd').trim(); }
    return { id: slug(name), name: name, price: price, imgs: imgs, shape: shape, color: color, ctx: 'shop/all-items' };
  }
  function favs() { return LS.get('jc_favs', []); }
  function syncHearts() {
    var list = favs();
    $$('.fav-btn').forEach(function (b) {
      var on = list.indexOf(b.getAttribute('data-id')) !== -1;
      b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.setAttribute('aria-label', on ? 'Remove from favorites' : 'Add to favorites');
    });
  }
  function addHearts() {
    $$('.card:not([data-fav])').forEach(function (card) {
      var wrap = $('.card-img', card), d = readLite(card);
      card.setAttribute('data-fav', '1');
      if (!wrap || !d) return;
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'fav-btn'; b.setAttribute('data-id', d.id); b.innerHTML = HEART;
      wrap.appendChild(b);
    });
    syncHearts();
  }
  var pending = false;
  new MutationObserver(function () {
    if (pending) return; pending = true;
    requestAnimationFrame(function () { pending = false; addHearts(); });
  }).observe(document.body, { childList: true, subtree: true });

  document.addEventListener('click', function (e) {
    var btn = e.target.closest ? e.target.closest('.fav-btn') : null;
    if (!btn) return;
    e.preventDefault(); e.stopPropagation();
    var card = btn.closest('.card'), d = card && readLite(card); if (!d) return;
    var list = favs(), at = list.indexOf(d.id);
    if (at === -1) {
      list.push(d.id);
      var products = LS.get('jc_products', {}); if (!products[d.id]) { products[d.id] = d; LS.set('jc_products', products); }
    } else { list.splice(at, 1); }
    LS.set('jc_favs', list); syncHearts();
    if (!favView.hidden) renderFavs();
  }, true);

  function renderFavs() {
    var products = LS.get('jc_products', {}), grid = $('#favGrid'), empty = $('#favEmpty');
    var items = favs().map(function (id) { return products[id]; }).filter(Boolean);
    grid.innerHTML = items.map(function (d) {
      var media = (d.imgs && d.imgs.length)
        ? '<img class="slide is-on" src="' + esc(d.imgs[0]) + '" alt="' + esc(d.name) + '">'
        : '<div class="slide is-on"><div class="fig fig--' + esc(d.shape) + ' fig--v0" style="--c:' + esc(d.color) + '" role="img" aria-label="' + esc(d.name) + '"></div></div>';
      return '<article class="card"><div class="card-img">' + media + '<a class="card-hit" href="#" aria-label="' + esc(d.name) + '"></a></div>' +
        '<a class="card-meta" href="#"><span class="card-name">' + esc(d.name) + '</span>' + (d.price > 0 ? '<span class="card-price">' + money(d.price) + '</span>' : '') + '</a></article>';
    }).join('');
    empty.hidden = items.length > 0; grid.hidden = items.length === 0;
    addHearts();
  }

  /* ---------------- Router (se suma a los anteriores) ---------------- */
  var PAGES = { 'size-guide': sizeView, 'favorites': favView, 'exchange-policy': exchView };
  var TITLES = { 'size-guide': 'Size Guide', 'favorites': 'Favorites', 'exchange-policy': 'Exchange Policy' };
  var LINKTEXT = { 'size guide': 'size-guide', 'favorites': 'favorites', 'exchange policy': 'exchange-policy' };

  function route() {
    var kind = location.hash.replace(/^#\/?/, '').split('/')[0];
    var view = PAGES[kind];
    Object.keys(PAGES).forEach(function (k) { PAGES[k].hidden = PAGES[k] !== view; });
    $$('a.nav-link, a.drawer-link, .legal a').forEach(function (a) {
      var key = LINKTEXT[a.textContent.trim().toLowerCase()];
      if (key) a.classList.toggle('is-active', key === kind);
    });
    if (!view) return;
    var so = $('#searchOverlay'); if (so && !so.hidden) { var c = $('#searchClose'); if (c) c.click(); }
    ['#home', '#products', '#login', '#cart', '#aboutView', '#registerView', '#productView'].forEach(function (s) { var el = $(s); if (el) el.hidden = true; });
    document.body.classList.add('is-products');
    var sl = $('#shopLink'); if (sl) sl.classList.remove('is-active');
    if (kind === 'favorites') renderFavs();
    document.title = TITLES[kind] + ' \u2013 The Jungle Closet';
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', route);
  addHearts();
  route();
})();

/* =====================================================================
   PAGO (Checkout)  ->  #/checkout, #/checkout/payment  y  #/order-confirmed
   Flujo: Checkout (datos + marcar tarjeta) -> Pay now -> pantalla de tarjeta
          -> Pay now -> espera -> Transaction successful (Order #44)
   ===================================================================== */
(function () {
  'use strict';

  /* ---------------- CONFIGURA AQUÍ ---------------- */
  var STORE = {
    pickup: 'La Libertad, Antiguo Cuscatl\u00e1n, El Salvador',
    firstOrder: 44,   // primer n\u00famero de pedido (con base de datos, lo asigna ella)
    demo: true,       // true = SIMULACRO: no cobra nada. Ponlo en false cuando conectes la pasarela.
    charge: null,     // pasarela real: function (card, order) { return Promise -> { ok: true|false, message: '' } }
  };

  /* ---------------- Utilidades ---------------- */
  function $(s, r) { return (r || document).querySelector(s); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function money(n) { return '$' + (n % 1 ? n.toFixed(2) : n.toFixed(0)); }
  function make(html) { var d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstChild; }
  var LS = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sin almacenamiento */ } },
  };
  function cartItems() { return LS.get('jc_cart', []); }
  function totals(items) {
    var sum = 0, unknown = false, count = 0;
    items.forEach(function (it) { count += it.qty; if (it.price > 0) sum += it.price * it.qty; else unknown = true; });
    return { sum: sum, unknown: unknown, count: count };
  }
  var pending = null, busy = false;

  /* ---------------- Vistas ---------------- */
  var checkoutView = make(
    '<main class="info-page checkout" id="checkoutView" hidden>' +
      '<h1 class="list-title">Checkout</h1>' +
      '<div class="co-wrap">' +
        '<form class="co-form" id="coForm" novalidate>' +
          '<h2>Contact</h2>' +
          '<div class="co-two">' +
            '<div><label for="coFirst">First name</label><input id="coFirst" type="text" autocomplete="given-name"></div>' +
            '<div><label for="coLast">Last name</label><input id="coLast" type="text" autocomplete="family-name"></div>' +
          '</div>' +
          '<label for="coPhone">Phone / WhatsApp</label><input id="coPhone" type="tel" autocomplete="tel">' +
          '<label for="coEmail">Email (optional)</label><input id="coEmail" type="email" autocomplete="email">' +
          '<h2>Delivery</h2>' +
          '<div class="co-opts">' +
            '<label class="co-opt"><input type="radio" name="coDelivery" value="delivery" checked><span>Delivery to my address</span></label>' +
            '<label class="co-opt"><input type="radio" name="coDelivery" value="pickup"><span>Pick up at the store<small>' + esc(STORE.pickup) + '</small></span></label>' +
          '</div>' +
          '<div id="coAddress">' +
            '<label for="coCity">Department / City</label><input id="coCity" type="text" autocomplete="address-level2">' +
            '<label for="coAddr">Address</label><input id="coAddr" type="text" autocomplete="street-address">' +
            '<label for="coRef">Reference (optional)</label><input id="coRef" type="text">' +
          '</div>' +
          '<label for="coNotes">Order notes (optional)</label><textarea id="coNotes"></textarea>' +
          '<h2>Payment</h2>' +
          '<div class="co-opts"><label class="co-opt"><input type="radio" name="coPay" value="card"><span>Credit / debit card<small>Visa, Mastercard</small></span></label></div>' +
          '<p class="co-note">Select it, then press Pay now to enter your card details.</p>' +
          '<p class="form-msg" id="coMsg" role="alert"></p>' +
          '<button type="submit" class="btn co-submit">Pay now</button>' +
        '</form>' +
        '<aside class="co-summary" id="coSummary" aria-label="Order summary"></aside>' +
      '</div>' +
    '</main>');

  var payView = make(
    '<main class="info-page" id="payView" hidden>' +
      '<h1 class="list-title">Payment</h1>' +
      '<form class="co-form pay-card" id="payForm" novalidate>' +
        '<h2>Card details</h2>' +
        '<p class="pay-total" id="payTotal"></p>' +
        '<label for="ccName">Name on card</label><input id="ccName" type="text" autocomplete="cc-name">' +
        '<label for="ccNum">Card number</label><input id="ccNum" type="text" inputmode="numeric" autocomplete="cc-number" placeholder="1234 5678 9012 3456" maxlength="19">' +
        '<div class="co-two">' +
          '<div><label for="ccExp">Expiry</label><input id="ccExp" type="text" inputmode="numeric" autocomplete="cc-exp" placeholder="MM/YY" maxlength="5"></div>' +
          '<div><label for="ccCvv">CVV</label><input id="ccCvv" type="password" inputmode="numeric" autocomplete="cc-csc" placeholder="123" maxlength="4"></div>' +
        '</div>' +
        '<p class="form-msg" id="ccMsg" role="alert"></p>' +
        '<button type="submit" class="btn co-submit">Pay now</button>' +
        '<button type="button" class="pay-back" id="payBack">\u2039 Back to checkout</button>' +
      '</form>' +
    '</main>');

  var procView = make(
    '<main class="info-page" id="procView" hidden>' +
      '<div class="ok-card ok-success">' +
        '<div class="ring" aria-hidden="true"></div>' +
        '<h1 class="list-title">Please wait a moment\u2026</h1>' +
        '<p>We are processing your payment. Do not close this page.</p>' +
      '</div>' +
    '</main>');

  var orderView = make('<main class="info-page" id="orderView" hidden></main>');

  var anchor = $('#favView') || $('#productView') || $('#cart');
  [orderView, procView, payView, checkoutView].forEach(function (v) { anchor.parentNode.insertBefore(v, anchor.nextSibling); });

  /* ---------------- Botón "Check out" del carrito ---------------- */
  document.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('#checkoutBtn') : null;
    if (!b) return;
    e.preventDefault(); e.stopPropagation();
    location.hash = '#/checkout';
  }, true);

  /* ---------------- Checkout ---------------- */
  function selected(name) { var r = $('input[name="' + name + '"]:checked', checkoutView); return r ? r.value : ''; }

  function renderSummary() {
    var items = cartItems(), t = totals(items);
    $('#coSummary').innerHTML =
      '<h2>Order summary</h2><ul class="co-items">' +
      items.map(function (it) {
        var thumb = it.img ? '<img src="' + esc(it.img) + '" alt="">' : '<div class="fig fig--' + esc(it.shape || 'top') + '" style="--c:' + esc(it.color || '#ddd') + '"></div>';
        return '<li><span class="co-thumb">' + thumb + '<b>' + it.qty + '</b></span><span class="co-name">' + esc(it.name) + '<small>Size: ' + esc(it.size) + '</small></span><span class="co-price">' + (it.price > 0 ? money(it.price * it.qty) : '\u2014') + '</span></li>';
      }).join('') + '</ul>' +
      '<div class="co-row"><span>Subtotal</span><span>' + (t.sum > 0 ? money(t.sum) : '\u2014') + '</span></div>' +
      '<div class="co-row"><span>Shipping</span><span>' + (t.count >= 2 ? 'Free' : 'To be confirmed') + '</span></div>' +
      '<div class="co-row co-total"><span>Total</span><span>' + (t.sum > 0 ? money(t.sum) + (t.unknown ? '+' : '') : 'To be confirmed') + '</span></div>' +
      (t.unknown ? '<p class="co-note">Some prices will be confirmed when we contact you.</p>' : '');
  }
  function renderCheckout() {
    if (!cartItems().length) {
      checkoutView.innerHTML = '<h1 class="list-title">Checkout</h1><div class="co-empty"><p>Your cart is empty.</p><a class="btn" href="#/shop/all-items">Start shopping</a></div>';
      checkoutView.setAttribute('data-empty', '1');
      return;
    }
    if (checkoutView.getAttribute('data-empty')) { location.reload(); return; }
    $('#coAddress').hidden = selected('coDelivery') === 'pickup';
    renderSummary();
  }
  checkoutView.addEventListener('change', function (e) {
    if (e.target.name === 'coDelivery') $('#coAddress').hidden = e.target.value === 'pickup';
    if (e.target.name === 'coPay') $('#coMsg').textContent = '';
  });

  /* Pay now (checkout) -> valida y abre la pantalla de tarjeta */
  $('#coForm', checkoutView).addEventListener('submit', function (e) {
    e.preventDefault();
    var msg = $('#coMsg'), items = cartItems();
    if (!items.length) { msg.textContent = 'Your cart is empty.'; return; }
    var delivery = selected('coDelivery');
    var first = $('#coFirst').value.trim(), last = $('#coLast').value.trim();
    var phone = $('#coPhone').value.trim(), email = $('#coEmail').value.trim();
    var city = $('#coCity').value.trim(), address = $('#coAddr').value.trim();
    if (!first || !last) { msg.textContent = 'Please enter your first and last name.'; (!first ? $('#coFirst') : $('#coLast')).focus(); return; }
    if (phone.replace(/\D/g, '').length < 8) { msg.textContent = 'Please enter a valid phone number.'; $('#coPhone').focus(); return; }
    if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { msg.textContent = 'That email does not look right.'; $('#coEmail').focus(); return; }
    if (delivery === 'delivery' && (!city || !address)) { msg.textContent = 'Please enter your city and address.'; (!city ? $('#coCity') : $('#coAddr')).focus(); return; }
    if (!selected('coPay')) { msg.textContent = 'Please select a payment method.'; return; }
    msg.textContent = '';
    var t = totals(items);
    pending = {
      name: first + ' ' + last, phone: phone, email: email,
      delivery: delivery, city: city, address: address, reference: $('#coRef').value.trim(),
      notes: $('#coNotes').value.trim(), items: items, total: t.sum, unknown: t.unknown,
    };
    location.hash = '#/checkout/payment';
  });

  /* ---------------- Pantalla de tarjeta ---------------- */
  payView.addEventListener('input', function (e) {
    var t = e.target;
    if (t.id === 'ccNum') t.value = t.value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
    if (t.id === 'ccExp') { var v = t.value.replace(/\D/g, '').slice(0, 4); t.value = v.length > 2 ? v.slice(0, 2) + '/' + v.slice(2) : v; }
    if (t.id === 'ccCvv') t.value = t.value.replace(/\D/g, '').slice(0, 4);
  });
  function luhn(n) {
    var s = 0, alt = false;
    for (var i = n.length - 1; i >= 0; i--) { var d = +n[i]; if (alt) { d *= 2; if (d > 9) d -= 9; } s += d; alt = !alt; }
    return s % 10 === 0;
  }
  function checkCard() {
    var strict = !STORE.demo;                      // en simulacro acepta cualquier tarjeta con formato correcto
    if (!$('#ccName').value.trim()) return 'Enter the name on the card.';
    var n = $('#ccNum').value.replace(/\s/g, '');
    if (n.length < 13 || (strict && !luhn(n))) return 'Invalid card number.';
    var m = $('#ccExp').value.match(/^(\d{2})\/(\d{2})$/);
    if (!m || +m[1] < 1 || +m[1] > 12) return 'Invalid expiry date.';
    if (strict && new Date(2000 + +m[2], +m[1], 1) <= new Date()) return 'Card expired.';
    if ($('#ccCvv').value.length < 3) return 'Invalid CVV.';
    return '';
  }
  function processPayment(card, order) {
    if (STORE.charge) return STORE.charge(card, order);                                   // pasarela real
    if (STORE.demo) return new Promise(function (r) { setTimeout(function () { r({ ok: true }); }, 2600); });   // simulacro
    return Promise.resolve({ ok: false, message: 'Card payments are not connected yet. Please contact us.' });
  }
  function nextOrderNo() {
    var n = LS.get('jc_order_no', STORE.firstOrder - 1) + 1;
    LS.set('jc_order_no', n);
    return n;
  }
  function clearCard() { ['ccName', 'ccNum', 'ccExp', 'ccCvv'].forEach(function (id) { $('#' + id).value = ''; }); }

  /* Pay now (tarjeta) -> espera -> Transaction successful */
  $('#payForm', payView).addEventListener('submit', function (e) {
    e.preventDefault();
    var err = checkCard(), msg = $('#ccMsg');
    if (err) { msg.textContent = err; return; }
    if (!pending) { location.hash = '#/checkout'; return; }
    msg.textContent = '';
    var card = { name: $('#ccName').value.trim(), number: $('#ccNum').value.replace(/\s/g, ''), exp: $('#ccExp').value, cvv: $('#ccCvv').value };
    clearCard();                                    // la tarjeta nunca se guarda en la p\u00e1gina
    busy = true; route();
    var done = function (res) {
      busy = false;
      if (res && res.ok) {
        var no = nextOrderNo();
        var order = Object.assign({ no: no, date: new Date().toISOString(), payment: 'card', status: 'paid' }, pending);
        var orders = LS.get('jc_orders', []); orders.push(order); LS.set('jc_orders', orders); LS.set('jc_last_order', order);
        pending = null;
        if (window.JUBIN && window.JUBIN.clearCart) window.JUBIN.clearCart();
        location.hash = '#/order-confirmed';
        route();
      } else {
        route();
        $('#ccMsg').textContent = (res && res.message) || 'Payment declined. Please try another card.';
      }
    };
    var p;
    try { p = processPayment(card, pending); } catch (x) { p = Promise.resolve({ ok: false }); }
    Promise.resolve(p).then(done, function () { done({ ok: false, message: 'Something went wrong. Please try again.' }); });
  });
  $('#payBack', payView).addEventListener('click', function () { location.hash = '#/checkout'; });

  /* ---------------- Confirmaci\u00f3n ---------------- */
  function renderOrder() {
    var o = LS.get('jc_last_order', null);
    if (!o) { orderView.innerHTML = '<h1 class="list-title">Order</h1><div class="co-empty"><p>No recent order.</p><a class="btn" href="#/shop/all-items">Start shopping</a></div>'; return; }
    orderView.innerHTML =
      '<div class="ok-card ok-success">' +
        '<div class="ok-check" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></div>' +
        '<h1 class="list-title">Transaction successful</h1>' +
        '<p>Your payment was approved.</p>' +
        '<p class="ok-id">Order <b>#' + esc(o.no) + '</b></p>' +
        '<ul class="ok-items">' + o.items.map(function (it) { return '<li>' + esc(it.name) + ' \u00b7 ' + esc(it.size) + ' \u00d7 ' + it.qty + '</li>'; }).join('') + '</ul>' +
        '<p class="ok-total">Total: ' + (o.total > 0 ? money(o.total) + (o.unknown ? ' + items to be confirmed' : '') : 'to be confirmed') + '</p>' +
        '<p style="font-size:13px;color:#666">We will contact you about your delivery.</p>' +
        (STORE.demo ? '<p style="font-size:12px;color:#999">Demo mode: nothing was charged.</p>' : '') +
        '<p><a class="btn" href="#/shop/all-items">Continue shopping</a></p>' +
      '</div>';
  }

  /* ---------------- Router (se suma a los anteriores) ---------------- */
  var OTHERS = ['#home', '#products', '#login', '#cart', '#aboutView', '#registerView', '#productView', '#sizeView', '#favView', '#exchView'];
  function route() {
    var parts = location.hash.replace(/^#\/?/, '').split('/');
    var kind = parts[0], isCheckout = kind === 'checkout', isPay = isCheckout && parts[1] === 'payment', isOrder = kind === 'order-confirmed';
    checkoutView.hidden = !(isCheckout && !isPay);
    payView.hidden = !(isPay && !busy);
    procView.hidden = !(isPay && busy);
    orderView.hidden = !isOrder;
    if (!isCheckout && !isOrder) return;
    if (isPay && !pending && !busy) { location.hash = '#/checkout'; return; }
    var so = $('#searchOverlay'); if (so && !so.hidden) { var c = $('#searchClose'); if (c) c.click(); }
    OTHERS.forEach(function (s) { var el = $(s); if (el) el.hidden = true; });
    document.body.classList.add('is-products');
    var sl = $('#shopLink'); if (sl) sl.classList.remove('is-active');
    if (isPay && pending) $('#payTotal').textContent = pending.total > 0 ? 'Total: ' + money(pending.total) + (pending.unknown ? ' + items to be confirmed' : '') : 'Total: to be confirmed';
    if (isOrder) renderOrder(); else if (isCheckout && !isPay) renderCheckout();
    document.title = (isOrder ? 'Order confirmed' : isPay ? 'Payment' : 'Checkout') + ' \u2013 The Jungle Closet';
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', route);
  route();
})();