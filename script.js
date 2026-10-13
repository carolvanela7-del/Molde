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