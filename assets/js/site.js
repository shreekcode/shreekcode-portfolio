/* =========================================================
   Portfolio engine.
   Reads the plain-text files in /content and builds the page.
   You don't need to edit this file — see HOW-TO-UPDATE.md.
   ========================================================= */
(function () {
  'use strict';

  var CONTENT_FILES = ['profile', 'news', 'experience', 'projects', 'skills', 'education'];
  var KNOWN_KEYS = ['name', 'role', 'typing', 'tagline', 'bio', 'location', 'email', 'phone', 'github',
    'linkedin', 'youtube', 'website', 'cv', 'status', 'photo', 'title', 'company', 'where', 'date', 'tags', 'text',
    'link', 'featured', 'group', 'items', 'type'];
  var GH_CACHE_MINUTES = 10;

  /* ---------------- helpers ---------------- */
  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function safeUrl(u) {
    u = String(u || '').trim();
    if (!u) return '';
    if (/^(https?:|mailto:|tel:)/i.test(u)) return u;
    if (/^[a-z]+:/i.test(u)) return '';           // block javascript: etc.
    return u;                                      // relative path like assets/CV.pdf
  }
  // Format text: escape, **bold**, [label](url), bare URLs.
  function fmt(s) {
    var out = esc(s);
    out = out.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function (m, label, url) {
      var u = safeUrl(url.replace(/&amp;/g, '&'));
      return u ? '<a href="' + esc(u) + '" target="_blank" rel="noopener">' + label + '</a>' : label;
    });
    out = out.replace(/(^|[\s(])(https?:\/\/[^\s<)]+)/g, '$1<a href="$2" target="_blank" rel="noopener">$2</a>');
    return out;
  }
  function list(s) {
    return String(s || '').split(/[,|]/).map(function (x) { return x.trim(); }).filter(Boolean);
  }
  function el(html) { var d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstChild; }

  /* ---------------- tolerant text-file parser ----------------
     - Lines starting with # are comments.
     - A line of --- (three or more dashes) starts a new block.
     - "Key: value" sets a field (only for known keys, so normal
       sentences containing a colon are never mis-read).
     - "- something" adds a bullet point.
     - Any other line continues the previous field (new paragraph). */
  function parse(text) {
    var blocks = [], cur = { bullets: [] }, lastKey = null;
    function push() {
      var has = Object.keys(cur).some(function (k) { return k !== 'bullets' && cur[k]; }) || cur.bullets.length;
      if (has) blocks.push(cur);
      cur = { bullets: [] }; lastKey = null;
    }
    String(text || '').replace(/\r/g, '').split('\n').forEach(function (raw) {
      var line = raw.trim();
      if (!line || line.charAt(0) === '#') return;
      if (/^-{3,}$/.test(line)) return push();
      var b = line.match(/^[-*•]\s+(.*)$/);
      if (b) { cur.bullets.push(b[1]); lastKey = null; return; }
      var kv = line.match(/^([A-Za-z][A-Za-z ]{0,20}?)\s*:\s*(.*)$/);
      if (kv && KNOWN_KEYS.indexOf(kv[1].toLowerCase().trim()) !== -1) {
        lastKey = kv[1].toLowerCase().trim();
        cur[lastKey] = kv[2].trim();
        return;
      }
      if (lastKey) cur[lastKey] = (cur[lastKey] ? cur[lastKey] + '\n\n' : '') + line;
      else cur.bullets.push(line);
    });
    push();
    return blocks;
  }

  function load(name) {
    return fetch('content/' + name + '.txt', { cache: 'no-cache' })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); })
      .then(parse)
      .catch(function (e) { console.warn('Could not load content/' + name + '.txt', e); return null; });
  }

  // Run a render step in isolation so one mistake never breaks the whole page.
  function safely(label, fn) {
    try { fn(); } catch (e) { console.error('Problem showing ' + label + ':', e); }
  }

  var ICONS = {
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
    github: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.53-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.26 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5z"/></svg>',
    linkedin: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z"/></svg>',
    youtube: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8zM9.6 15.6V8.4l6.2 3.6-6.2 3.6z"/></svg>',
    cv: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v12m0 0-4-4m4 4 4-4M5 21h14"/></svg>',
    web: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>'
  };

  function linkedinUrl(v) {
    v = (v || '').trim();
    if (!v) return '';
    if (/^https?:/i.test(v)) return v;
    if (/linkedin\.com/i.test(v)) return 'https://' + v.replace(/^\/+/, '');
    return 'https://www.linkedin.com/in/' + v.replace(/^@/, '');
  }
  function githubUser(v) {
    v = (v || '').trim().replace(/\/+$/, '');
    var m = v.match(/github\.com\/([^/?#]+)/i);
    return m ? m[1] : v.replace(/^@/, '');
  }

  /* ---------------- renderers ---------------- */
  function renderProfile(p) {
    var gh = githubUser(p.github);
    var first = (p.name || '').split(' ')[0] || 'portfolio';
    document.title = (p.name || 'Portfolio') + (p.role ? ' · ' + p.role.split('·')[0].trim() : '');
    $('nav-name').textContent = first.toLowerCase();
    $('name').textContent = p.name || '';
    $('role').textContent = p.role || '';
    $('tagline').innerHTML = fmt(p.tagline || '');

    if (p.status) { $('status-text').textContent = p.status; $('status-pill').hidden = false; }

    $('bio').innerHTML = String(p.bio || '').split(/\n\n+/).map(function (para) { return '<p>' + fmt(para) + '</p>'; }).join('');
    if (p.photo && safeUrl(p.photo)) {
      var img = $('photo'); img.src = safeUrl(p.photo); img.alt = p.name || ''; img.hidden = false;
      img.onerror = function () { img.hidden = true; };
    }

    var buttons = [];
    if (p.email) buttons.push('<a class="btn primary" href="mailto:' + esc(p.email) + '">' + ICONS.mail + 'Email me</a>');
    if (gh) buttons.push('<a class="btn" href="https://github.com/' + esc(gh) + '" target="_blank" rel="noopener">' + ICONS.github + 'GitHub</a>');
    if (p.linkedin) buttons.push('<a class="btn" href="' + esc(linkedinUrl(p.linkedin)) + '" target="_blank" rel="noopener">' + ICONS.linkedin + 'LinkedIn</a>');
    if (p.youtube && safeUrl(p.youtube)) buttons.push('<a class="btn" href="' + esc(safeUrl(p.youtube)) + '" target="_blank" rel="noopener">' + ICONS.youtube + 'YouTube</a>');
    if (p.website && safeUrl(p.website)) buttons.push('<a class="btn" href="' + esc(safeUrl(p.website)) + '" target="_blank" rel="noopener">' + ICONS.web + 'Website</a>');
    if (p.cv && safeUrl(p.cv)) buttons.push('<a class="btn" href="' + esc(safeUrl(p.cv)) + '" target="_blank" rel="noopener">' + ICONS.cv + 'Download CV</a>');
    $('hero-cta').innerHTML = buttons.join('');
    $('contact-cta').innerHTML = buttons.join('');

    var meta = [];
    if (p.location) meta.push('📍 ' + esc(p.location));
    if (p.email) meta.push('✉ ' + esc(p.email));
    if (p.phone) meta.push('☎ ' + esc(p.phone));
    $('hero-meta').innerHTML = meta.map(function (m) { return '<span>' + m + '</span>'; }).join('');

    renderTerminal(p);
    startTyping(list(p.typing));
    $('footer-text').innerHTML = '© ' + new Date().getFullYear() + ' ' + esc(p.name || '') +
      ' · <span class="muted">built with plain text & a little JavaScript · hosted on GitHub Pages</span>';
    return gh;
  }

  function renderTerminal(p) {
    var focus = list(p.typing).slice(0, 4);
    var lines = [
      '<span class="tk-k">class</span> <span class="tk-f">Engineer</span>:',
      '    name     = <span class="tk-s">"' + esc(p.name || '') + '"</span>',
      '    role     = <span class="tk-s">"' + esc((p.role || '').split('·')[0].trim()) + '"</span>',
      '    location = <span class="tk-s">"' + esc(p.location || '') + '"</span>',
      '    focus    = [',
    ];
    focus.forEach(function (f, i) {
      lines.push('        <span class="tk-s">"' + esc(f) + '"</span>' + (i < focus.length - 1 ? ',' : ''));
    });
    lines.push('    ]');
    lines.push('');
    lines.push('    <span class="tk-k">def</span> <span class="tk-f">status</span>(self):');
    lines.push('        <span class="tk-k">return</span> <span class="tk-s">"' + esc(p.status || 'building things') + '"</span>');
    lines.push('');
    lines.push('<span class="tk-c"># &gt;&gt;&gt; Engineer().status()</span>');
    $('terminal').innerHTML = lines.join('\n');
  }

  function startTyping(words) {
    var target = $('typing');
    if (!words.length) { target.parentNode.hidden = true; return; }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { target.textContent = words.join(' · '); return; }
    var w = 0, i = 0, deleting = false;
    (function tick() {
      var word = words[w];
      target.textContent = word.slice(0, i);
      if (!deleting && i < word.length) { i++; setTimeout(tick, 70); }
      else if (!deleting) { deleting = true; setTimeout(tick, 1600); }
      else if (i > 0) { i--; setTimeout(tick, 35); }
      else { deleting = false; w = (w + 1) % words.length; setTimeout(tick, 300); }
    })();
  }

  function fmtDate(s) {
    var m = String(s || '').match(/^(\d{4})-(\d{1,2})(?:-(\d{1,2}))?$/);
    if (!m) return s || '';
    var d = new Date(+m[1], +m[2] - 1, +(m[3] || 1));
    return d.toLocaleDateString('en-GB', m[3] ? { day: 'numeric', month: 'short', year: 'numeric' } : { month: 'short', year: 'numeric' });
  }

  function renderNews(items) {
    $('news').innerHTML = items.slice(0, 6).map(function (n) {
      return '<li><time>' + esc(fmtDate(n.date)) + '</time><b>' + fmt(n.title || '') + '</b>' +
        (n.text ? '<p>' + fmt(n.text) + '</p>' : '') + '</li>';
    }).join('') || '<li class="muted">No updates yet.</li>';
  }

  function tagsHtml(t) {
    var tags = list(t);
    return tags.length ? '<div class="tags">' + tags.map(function (x) { return '<span class="tag">' + esc(x) + '</span>'; }).join('') + '</div>' : '';
  }
  function bulletsHtml(b) {
    return b && b.length ? '<ul class="bullets">' + b.map(function (x) { return '<li>' + fmt(x) + '</li>'; }).join('') + '</ul>' : '';
  }
  function textHtml(t) { return t ? String(t).split(/\n\n+/).map(function (p) { return '<p>' + fmt(p) + '</p>'; }).join('') : ''; }

  function renderExperience(items) {
    $('experience-list').innerHTML = items.map(function (j) {
      return '<article class="job card reveal">' +
        '<div class="item-head"><h3>' + fmt(j.title || '') + '</h3><span class="item-date">' + esc(j.date || '') + '</span></div>' +
        '<div class="item-where">' + fmt(j.company || j.where || '') + '</div>' +
        textHtml(j.text) + bulletsHtml(j.bullets) + tagsHtml(j.tags) + '</article>';
    }).join('');
  }

  function renderProjects(items) {
    $('projects-list').innerHTML = items.map(function (p) {
      var featured = /^(yes|true|y)$/i.test((p.featured || '').trim());
      var link = safeUrl(p.link);
      return '<article class="project card reveal' + (featured ? ' featured' : '') + '">' +
        (featured ? '<span class="badge">★ featured</span>' : '') +
        '<div class="item-head"><h3>' + fmt(p.title || '') + '</h3><span class="item-date">' + esc(p.date || '') + '</span></div>' +
        '<div class="item-where">' + fmt(p.where || '') + '</div>' +
        textHtml(p.text) + bulletsHtml(p.bullets) +
        (link ? '<a class="project-link" href="' + esc(link) + '" target="_blank" rel="noopener">→ view project</a>' : '') +
        tagsHtml(p.tags) + '</article>';
    }).join('');
  }

  function renderSkills(items) {
    $('skills-list').innerHTML = items.map(function (g) {
      return '<div class="skill-group card reveal"><h3>' + esc(g.group || g.title || 'skills') + '</h3><div class="chips">' +
        list(g.items).map(function (s) { return '<span class="chip">' + esc(s) + '</span>'; }).join('') + '</div></div>';
    }).join('');
  }

  function renderEducation(items) {
    var edu = [], cert = [], lang = [];
    items.forEach(function (x) {
      var t = (x.type || 'education').toLowerCase();
      if (t.indexOf('cert') === 0) cert.push(x);
      else if (t.indexOf('lang') === 0) lang.push(x);
      else edu.push(x);
    });
    $('edu-list').innerHTML = edu.map(function (e) {
      return '<article class="edu card reveal"><div class="item-head"><h3>' + fmt(e.title || '') + '</h3><span class="item-date">' + esc(e.date || '') + '</span></div>' +
        '<div class="item-where">' + fmt(e.where || '') + '</div>' + textHtml(e.text) + bulletsHtml(e.bullets) + '</article>';
    }).join('');
    function mini(arr) { return arr.map(function (c) { return '<li><b>' + fmt(c.title || '') + '</b><span>' + fmt(c.where || '') + '</span></li>'; }).join(''); }
    $('cert-list').innerHTML = mini(cert);
    $('lang-list').innerHTML = mini(lang);
    $('cert-list').parentNode.hidden = !cert.length;
    $('lang-list').parentNode.hidden = !lang.length;
  }

  /* ---------------- GitHub live activity ---------------- */
  var LANG_COLORS = { Python: '#3572A5', JavaScript: '#f1e05a', TypeScript: '#3178c6', 'C++': '#f34b7d', C: '#555555',
    'C#': '#178600', Java: '#b07219', PHP: '#4F5D95', HTML: '#e34c26', CSS: '#563d7c', 'Jupyter Notebook': '#DA5B0B',
    Shell: '#89e051', Go: '#00ADD8', Rust: '#dea584', Kotlin: '#A97BFF', Dart: '#00B4AB' };

  function ago(iso) {
    var s = (Date.now() - new Date(iso).getTime()) / 1000;
    var units = [[31536000, 'year'], [2592000, 'month'], [604800, 'week'], [86400, 'day'], [3600, 'hour'], [60, 'minute']];
    for (var i = 0; i < units.length; i++) {
      var n = Math.floor(s / units[i][0]);
      if (n >= 1) return n + ' ' + units[i][1] + (n > 1 ? 's' : '') + ' ago';
    }
    return 'just now';
  }

  function cachedJson(url) {
    var key = 'gh:' + url;
    try {
      var c = JSON.parse(sessionStorage.getItem(key) || 'null');
      if (c && Date.now() - c.t < GH_CACHE_MINUTES * 60000) return Promise.resolve(c.d);
    } catch (e) {}
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    }).then(function (d) {
      try { sessionStorage.setItem(key, JSON.stringify({ t: Date.now(), d: d })); } catch (e) {}
      return d;
    });
  }

  function renderGitHub(user) {
    if (!user) { $('github').hidden = true; document.querySelector('a[href="#github"]').hidden = true; return; }
    var api = 'https://api.github.com';
    var profileUrl = 'https://github.com/' + encodeURIComponent(user);

    // Contribution heatmap (public data, no login needed)
    cachedJson('https://github-contributions-api.jogruber.de/v4/' + encodeURIComponent(user) + '?y=last')
      .then(function (d) {
        var days = d.contributions || [];
        var html = '';
        if (days.length) {
          var pad = new Date(days[0].date + 'T00:00:00').getDay();
          for (var p = 0; p < pad; p++) html += '<i style="visibility:hidden"></i>';
        }
        html += days.map(function (c) {
          return '<i class="l' + (c.level || 0) + '" title="' + c.count + ' contribution' + (c.count === 1 ? '' : 's') + ' on ' + c.date + '"></i>';
        }).join('');
        $('gh-heatmap').innerHTML = html;
        var total = d.total && (d.total.lastYear != null ? d.total.lastYear : 0);
        $('gh-total').textContent = total + ' contributions';
        var activeDays = days.filter(function (c) { return c.count > 0; }).length;
        setStat('contrib', total, 'contributions / yr');
        setStat('active', activeDays, 'active days / yr');
        var hs = $('gh-heatmap').parentNode; hs.scrollLeft = hs.scrollWidth;
      })
      .catch(function () {
        $('gh-heatmap').parentNode.innerHTML = '<img alt="GitHub contribution chart" style="max-width:100%" src="https://ghchart.rshah.org/22d3ee/' + encodeURIComponent(user) + '">';
      });

    function setStat(key, val, label) {
      var s = document.querySelector('[data-stat="' + key + '"]');
      if (s) s.innerHTML = '<b>' + esc(val) + '</b><span>' + esc(label) + '</span>';
    }
    $('gh-stats').innerHTML = ['contrib', 'active', 'repos', 'last'].map(function (k) {
      return '<div class="stat card" data-stat="' + k + '"><b>—</b><span>loading</span></div>';
    }).join('');

    cachedJson(api + '/users/' + encodeURIComponent(user) + '/repos?per_page=100&sort=pushed')
      .then(function (repos) {
        var own = repos.filter(function (r) { return !r.fork && !r.archived && r.name.toLowerCase() !== (user + '.github.io').toLowerCase(); });
        if (!own.length) own = repos;
        setStat('repos', repos.length, 'public repos');
        if (own[0]) {
          setStat('last', ago(own[0].pushed_at).replace(' ago', ''), 'since last push');
          $('gh-sub').innerHTML = '<span class="live-dot"></span>&nbsp; live from <a href="' + profileUrl + '" target="_blank" rel="noopener">github.com/' + esc(user) +
            '</a> · last push ' + esc(ago(own[0].pushed_at)) + ' to <b>' + esc(own[0].name) + '</b>';
        }
        $('gh-repos').innerHTML = own.slice(0, 6).map(function (r) {
          var lang = r.language ? '<span><i class="lang-dot" style="background:' + (LANG_COLORS[r.language] || '#8b96ad') + '"></i>' + esc(r.language) + '</span>' : '';
          return '<a class="repo" href="' + esc(r.html_url) + '" target="_blank" rel="noopener"><div class="repo-name">' + esc(r.name) + '</div>' +
            (r.description ? '<div class="repo-desc">' + esc(r.description) + '</div>' : '') +
            '<div class="repo-meta">' + lang + '<span>★ ' + r.stargazers_count + '</span><span>updated ' + esc(ago(r.pushed_at)) + '</span></div></a>';
        }).join('') + '<a class="project-link" href="' + profileUrl + '?tab=repositories" target="_blank" rel="noopener">→ all repositories</a>';
      })
      .catch(function () {
        var msg = '<span class="muted mono">GitHub is busy right now — <a href="' + profileUrl + '" target="_blank" rel="noopener">view activity on GitHub →</a></span>';
        $('gh-repos').innerHTML = msg;
        $('gh-sub').innerHTML = '<a href="' + profileUrl + '" target="_blank" rel="noopener">github.com/' + esc(user) + '</a>';
        setStat('last', '—', 'since last push');
      });
  }

  /* ---------------- UI: theme, menu, reveal, background ---------------- */
  function setupUI() {
    $('theme-toggle').addEventListener('click', function () {
      var next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
      document.documentElement.dataset.theme = next;
      try { localStorage.setItem('theme', next); } catch (e) {}
    });
    var links = $('nav-links');
    $('menu-toggle').addEventListener('click', function () { links.classList.toggle('open'); });
    links.addEventListener('click', function (e) { if (e.target.tagName === 'A') links.classList.remove('open'); });
  }

  function setupReveal() {
    var items = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) { items.forEach(function (x) { x.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: 0.08 });
    items.forEach(function (x) { io.observe(x); });
  }

  function neuralBackground() {
    var c = $('neural-bg'), ctx = c.getContext && c.getContext('2d');
    if (!ctx) return;
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var nodes = [], w, h, dpr = Math.min(window.devicePixelRatio || 1, 2);
    function resize() {
      w = c.clientWidth; h = c.clientHeight;
      c.width = w * dpr; c.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.round(Math.min(70, (w * h) / 22000));
      nodes = [];
      for (var i = 0; i < n; i++) nodes.push({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - .5) * .25, vy: (Math.random() - .5) * .25 });
    }
    function color() { return getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#22d3ee'; }
    function hexA(hex, a) {
      var m = hex.replace('#', '').match(/.{2}/g); if (!m) return 'rgba(34,211,238,' + a + ')';
      return 'rgba(' + parseInt(m[0], 16) + ',' + parseInt(m[1], 16) + ',' + parseInt(m[2], 16) + ',' + a + ')';
    }
    function frame() {
      var col = color();
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < nodes.length; i++) {
        var a = nodes[i];
        if (!reduce) { a.x += a.vx; a.y += a.vy; if (a.x < 0 || a.x > w) a.vx *= -1; if (a.y < 0 || a.y > h) a.vy *= -1; }
        for (var j = i + 1; j < nodes.length; j++) {
          var b = nodes[j], dx = a.x - b.x, dy = a.y - b.y, d = dx * dx + dy * dy;
          if (d < 18000) { ctx.strokeStyle = hexA(col, 0.12 * (1 - d / 18000)); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
        }
        ctx.fillStyle = hexA(col, 0.45); ctx.beginPath(); ctx.arc(a.x, a.y, 1.6, 0, 6.283); ctx.fill();
      }
      if (!reduce) requestAnimationFrame(frame);
    }
    resize(); window.addEventListener('resize', resize); frame();
  }

  /* ---------------- boot ---------------- */
  setupUI();
  safely('background', neuralBackground);

  Promise.all(CONTENT_FILES.map(load)).then(function (res) {
    var data = {};
    CONTENT_FILES.forEach(function (n, i) { data[n] = res[i]; });

    if (location.protocol === 'file:' && !data.profile) {
      document.querySelector('.hero-text').insertAdjacentHTML('afterbegin',
        '<div class="notice">Your browser blocks reading the content files when the page is opened directly from disk. ' +
        'Publish to GitHub Pages, or run <code>python3 -m http.server</code> in this folder and open http://localhost:8000</div>');
    }

    var gh = null;
    safely('profile', function () { gh = renderProfile((data.profile || [])[0] || {}); });
    safely('news', function () { renderNews(data.news || []); });
    safely('experience', function () { renderExperience(data.experience || []); });
    safely('projects', function () { renderProjects(data.projects || []); });
    safely('skills', function () { renderSkills(data.skills || []); });
    safely('education', function () { renderEducation(data.education || []); });
    safely('github', function () { renderGitHub(gh); });
    setupReveal();
  });
})();
