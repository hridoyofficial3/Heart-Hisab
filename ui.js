/* ═══════════════════════════════════════════════════════
   UI — rendering engine
   ═══════════════════════════════════════════════════════ */
var UI = (function(){
  function $(s, r){ return (r || document).querySelector(s); }
  function $$(s, r){ return Array.prototype.slice.call((r || document).querySelectorAll(s)); }

  var ESC = {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'};
  function esc(s){
    if(s == null) return '';
    return String(s).replace(/[&<>"']/g, function(c){ return ESC[c]; });
  }

  var MN = ['জানু','ফেব','মার্চ','এপ্রিল','মে','জুন','জুলাই','আগস্ট','সেপ্ট','অক্টো','নভে','ডিসে'];
  var MNF = ['জানুয়ারি','ফেব্রুয়ারি','মার্চ','এপ্রিল','মে','জুন','জুলাই','আগস্ট','সেপ্টেম্বর','অক্টোবর','নভেম্বর','ডিসেম্বর'];
  var MN_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var MNF_EN = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  function monthsList(){ return I18n.getLang() === 'bn' ? MN : MN_EN; }
  function monthsFullList(){ return I18n.getLang() === 'bn' ? MNF : MNF_EN; }

  function money(n){
    if(typeof n !== 'number' || !isFinite(n)) n = 0;
    var neg = n < 0;
    var abs = Math.abs(n);
    var fixed = abs.toFixed(2);
    var parts = fixed.split('.');
    var intPart = parts[0], decPart = parts[1];
    var hasDec = decPart !== '00';
    var formatted;
    if(I18n.getLang() === 'bn'){
      var last3 = intPart.slice(-3);
      var rest = intPart.slice(0, -3);
      if(rest !== ''){
        rest = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
        last3 = ',' + last3;
      }
      formatted = rest + last3 + (hasDec ? '.' + decPart : '');
      formatted = formatted.replace(/[0-9]/g, function(d){ return I18n.num(d); });
    } else {
      formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (hasDec ? '.' + decPart : '');
    }
    var sym = (Store.state.settings && Store.state.settings.currency) || '৳';
    return (neg ? '-' : '') + sym + formatted;
  }

  function fmtDate(iso){
    if(!iso || typeof iso !== 'string') return '';
    var p = iso.split('-').map(Number);
    if(p.length !== 3) return iso;
    var months = monthsList();
    return I18n.num(p[2]) + ' ' + months[p[1] - 1];
  }

  function todayHeader(){
    var d = new Date();
    var M = monthsFullList();
    return I18n.num(d.getDate()) + ' ' + M[d.getMonth()] + ', ' + I18n.num(d.getFullYear());
  }

  /* ---------- Toast ---------- */
  var toastTimer = null;
  function toast(msg, ms){
    var el = $('#toast');
    if(!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function(){ el.classList.remove('show'); }, ms || 2800);
  }

  /* ---------- Modal ---------- */
  function openModal(opt){
    var root = $('#modalRoot');
    if(!root) return null;
    var bd = document.createElement('div');
    bd.className = 'modal-backdrop';
    bd.innerHTML =
      '<div class="modal-sheet">' +
        '<div class="modal-grabber"></div>' +
        '<div class="modal-head">' +
          '<h3 class="modal-title">' + esc(opt.title || '') + '</h3>' +
          '<button type="button" class="modal-close" data-close>' +
            '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
          '</button>' +
        '</div>' +
        '<div class="modal-body">' + (opt.body || '') + '</div>' +
        (opt.footer ? '<div class="modal-body" style="padding-top:0;">' + opt.footer + '</div>' : '') +
      '</div>';
    root.appendChild(bd);

    function close(){
      bd.style.opacity = '0';
      setTimeout(function(){
        if(bd.parentNode) bd.parentNode.removeChild(bd);
      }, 180);
      document.removeEventListener('keydown', onKey);
    }
    function onKey(e){ if(e.key === 'Escape') close(); }
    bd.addEventListener('click', function(e){ if(e.target === bd) close(); });
    bd.querySelector('[data-close]').addEventListener('click', close);
    document.addEventListener('keydown', onKey);
    Icons.hydrate(bd);
    return { close: close, backdrop: bd };
  }

  function confirm(msg, onYes, opt){
    opt = opt || {};
    var m = openModal({
      title: opt.title || 'নিশ্চিত করুন',
      body: '<p style="margin:0;line-height:1.7;font-size:.9375rem;white-space:pre-line;">' + esc(msg) + '</p>',
      footer: '<div class="row2" style="gap:10px;">' +
        '<button type="button" class="btn btn-secondary" data-no>বাতিল</button>' +
        '<button type="button" class="btn ' + (opt.danger ? 'btn-danger' : 'btn-primary') + '" data-yes>' + (opt.yesText || 'হ্যাঁ') + '</button>' +
      '</div>'
    });
    if(!m) return;
    m.backdrop.querySelector('[data-no]').addEventListener('click', m.close);
    m.backdrop.querySelector('[data-yes]').addEventListener('click', function(){
      m.close();
      if(onYes) setTimeout(onYes, 100);
    });
  }

  function alert(msg){
    var m = openModal({
      title: 'বার্তা',
      body: '<p style="margin:0;line-height:1.7;font-size:.9375rem;">' + esc(msg) + '</p>',
      footer: '<button type="button" class="btn btn-primary" data-ok>ঠিক আছে</button>'
    });
    if(!m) return;
    m.backdrop.querySelector('[data-ok]').addEventListener('click', m.close);
  }

  /* ---------- Header ---------- */
  function renderHeader(){
    var el = $('#brandDate');
    if(el) el.textContent = todayHeader();
    var bn = $('#brandName');
    if(bn) bn.textContent = 'হিসাব খাতা';
    var bi = $('#brandIcon');
    if(bi) bi.innerHTML = Icons.svg('receipt', 20);
  }

  /* ---------- Home ---------- */
  function renderHome(){
    var total = Store.totalBalance();
    var hb = $('#homeBalance');
    if(hb) hb.textContent = money(total);

    var now = new Date();
    var from = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-01';
    var lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    var to = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(lastDay).padStart(2, '0');
    var s = Store.statsInRange(from, to);

    var hi = $('#homeIncome'); if(hi) hi.textContent = money(s.income);
    var he = $('#homeExpense'); if(he) he.textContent = money(s.expense);
    var si = $('#statIncome'); if(si) si.textContent = money(s.income);
    var se = $('#statExpense'); if(se) se.textContent = money(s.expense);

    var siI = $('#statIconIn'); if(siI) siI.innerHTML = Icons.svg('trending-up', 20);
    var siE = $('#statIconEx'); if(siE) siE.innerHTML = Icons.svg('trending-down', 20);

    var accScroll = $('#accountScroll');
    if(accScroll){
      var accs = Store.getActiveAccounts();
      if(accs.length === 0){
        accScroll.innerHTML = '<div class="empty" style="width:100%;">কোনো অ্যাকাউন্ট নেই</div>';
      } else {
        accScroll.innerHTML = accs.map(function(a){
          var bal = Store.accountBalance(a.id);
          return '<div class="acc-chip">' +
            '<div class="acc-chip-icon" style="background:' + esc(a.color) + ';">' + Icons.svg(a.icon, 18) + '</div>' +
            '<div><div class="acc-chip-name">' + esc(a.name) + '</div>' +
            '<div class="acc-chip-bal">' + money(bal) + '</div></div>' +
          '</div>';
        }).join('');
      }
    }

    var recent = Store.state.entries.slice().sort(function(a, b){
      return (b.date || '').localeCompare(a.date || '') || (b.id - a.id);
    }).slice(0, 10);
    renderTxnList($('#recentTxns'), recent, 'কোনো লেনদেন নেই');
  }

  /* ---------- Txn list ---------- */
  function renderTxnList(container, list, emptyMsg){
    if(!container) return;
    if(!list || list.length === 0){
      container.innerHTML = '<div class="empty">' + esc(emptyMsg || 'কিছু নেই') + '</div>';
      return;
    }
    container.innerHTML = list.map(renderTxnItem).join('');
    container.querySelectorAll('[data-txn]').forEach(function(el){
      el.addEventListener('click', function(){
        var id = Number(el.dataset.txn);
        if(typeof App !== 'undefined' && App.showEntrySheet) App.showEntrySheet(id);
      });
    });
  }

  function renderTxnItem(e){
    var isIncome = e.type === 'income';
    var cat = Store.getCategory(e.categoryId);
    var acc = Store.getAccount(e.accountId);
    var catName = cat ? cat.name : (isIncome ? 'আয়' : 'ব্যয়');
    var accName = acc ? acc.name : '';
    var iconName = cat ? cat.icon : (isIncome ? 'trending-up' : 'trending-down');
    var iconClass = isIncome ? 'income' : 'expense';
    var title = e.note || catName;
    var meta = [];
    if(catName && e.note) meta.push(catName);
    if(accName) meta.push(accName);
    meta.push(fmtDate(e.date));
    return '<div class="txn-item" data-txn="' + Number(e.id) + '">' +
      '<div class="txn-icon ' + iconClass + '">' + Icons.svg(iconName, 18) + '</div>' +
      '<div class="txn-body"><div class="txn-title">' + esc(title) + '</div>' +
      '<div class="txn-meta">' + meta.map(esc).join(' · ') + '</div></div>' +
      '<div class="txn-amount ' + iconClass + '">' + (isIncome ? '+' : '-') + money(e.amount) + '</div>' +
    '</div>';
  }

  /* ---------- Transactions panel ---------- */
  var txnFilter = { account: 'all', type: 'all', q: '' };

  function renderTxns(){
    var container = $('#allTxns');
    if(!container) return;

    var chips = $('#txnFilterChips');
    if(chips){
      var accs = Store.getActiveAccounts();
      var html = '<button type="button" class="filter-chip' +
        (txnFilter.account === 'all' && txnFilter.type === 'all' ? ' active' : '') +
        '" data-f="all:all">সব</button>';
      html += '<button type="button" class="filter-chip' +
        (txnFilter.type === 'income' && txnFilter.account === 'all' ? ' active' : '') +
        '" data-f="all:income">আয়</button>';
      html += '<button type="button" class="filter-chip' +
        (txnFilter.type === 'expense' && txnFilter.account === 'all' ? ' active' : '') +
        '" data-f="all:expense">ব্যয়</button>';
      accs.forEach(function(a){
        html += '<button type="button" class="filter-chip' +
          (txnFilter.account === a.id ? ' active' : '') +
          '" data-f="' + esc(a.id) + ':all">' + esc(a.name) + '</button>';
      });
      chips.innerHTML = html;
      chips.querySelectorAll('[data-f]').forEach(function(b){
        b.addEventListener('click', function(){
          var p = b.dataset.f.split(':');
          txnFilter.account = p[0];
          txnFilter.type = p[1];
          renderTxns();
        });
      });
    }

    var list = Store.state.entries.slice();
    if(txnFilter.account !== 'all') list = list.filter(function(e){ return e.accountId === txnFilter.account; });
    if(txnFilter.type !== 'all') list = list.filter(function(e){ return e.type === txnFilter.type; });
    if(txnFilter.q){
      var q = txnFilter.q.toLowerCase();
      list = list.filter(function(e){
        var cat = Store.getCategory(e.categoryId);
        return (e.note || '').toLowerCase().indexOf(q) !== -1 ||
               (cat && cat.name.toLowerCase().indexOf(q) !== -1);
      });
    }
    list.sort(function(a, b){
      return (b.date || '').localeCompare(a.date || '') || (b.id - a.id);
    });
    renderTxnList(container, list, txnFilter.q ? 'কিছু পাওয়া যায়নি' : 'কোনো লেনদেন নেই');
  }

  /* ---------- Summary ---------- */
  var summaryPeriod = 'month';

  function renderSummary(){
    $$('.period-tab').forEach(function(t){
      t.classList.toggle('active', t.dataset.period === summaryPeriod);
    });
    var range = getPeriodRange(summaryPeriod);
    var s = Store.statsInRange(range.from, range.to);
    renderBarChart();
    renderPie($('#pieIncome'), $('#legendIncome'), 'income', range.from, range.to, $('#pieIncomeTotal'));
    renderPie($('#pieExpense'), $('#legendExpense'), 'expense', range.from, range.to, $('#pieExpenseTotal'));

    var rows = $('#summaryRows');
    if(rows){
      var net = Store.round2(s.income - s.expense);
      rows.innerHTML =
        '<div class="summary-row"><span class="label">মোট আয়</span>' +
        '<span class="value" style="color:var(--income);">' + money(s.income) + '</span></div>' +
        '<div class="summary-row"><span class="label">মোট ব্যয়</span>' +
        '<span class="value" style="color:var(--expense);">' + money(s.expense) + '</span></div>' +
        '<div class="summary-row"><span class="label">নেট</span>' +
        '<span class="value" style="color:' + (net >= 0 ? 'var(--income)' : 'var(--expense)') + ';">' + money(net) + '</span></div>';
    }
  }

  function getPeriodRange(period){
    var now = new Date();
    var y = now.getFullYear(), m = now.getMonth();
    function iso(d){
      return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    }
    if(period === 'week'){
      var day = now.getDay();
      var diff = day === 6 ? 0 : day + 1;
      var start = new Date(now); start.setDate(now.getDate() - diff);
      var end = new Date(start); end.setDate(start.getDate() + 6);
      return { from: iso(start), to: iso(end) };
    }
    if(period === 'month'){
      var from = y + '-' + String(m + 1).padStart(2, '0') + '-01';
      var last = new Date(y, m + 1, 0).getDate();
      return { from: from, to: y + '-' + String(m + 1).padStart(2, '0') + '-' + String(last).padStart(2, '0') };
    }
    if(period === 'year') return { from: y + '-01-01', to: y + '-12-31' };
    return { from: '0000-01-01', to: '9999-12-31' };
  }

  function renderBarChart(){
    var wrap = $('#barChart');
    if(!wrap) return;
    var trend = Store.monthlyTrend(6);
    var max = 1;
    trend.forEach(function(t){ max = Math.max(max, t.income, t.expense); });
    var months = monthsList();
    wrap.innerHTML = trend.map(function(t){
      var incH = t.income > 0 ? Math.max(4, Math.round((t.income / max) * 100)) : 2;
      var expH = t.expense > 0 ? Math.max(4, Math.round((t.expense / max) * 100)) : 2;
      return '<div class="bar-group"><div class="bar-pair">' +
        '<div class="bar income" style="height:' + incH + '%;" title="' + money(t.income) + '"></div>' +
        '<div class="bar expense" style="height:' + expH + '%;" title="' + money(t.expense) + '"></div>' +
      '</div><div class="bar-label">' + esc(months[t.month].slice(0, 3)) + '</div></div>';
    }).join('');
  }

  function renderPie(svgEl, legendEl, type, from, to, totalEl){
    if(!svgEl) return;
    var data = Store.categoryBreakdown(type, from, to);
    var total = 0;
    data.forEach(function(d){ total += d.amount; });
    if(totalEl) totalEl.textContent = money(total);

    if(data.length === 0 || total === 0){
      svgEl.innerHTML = '<circle cx="50" cy="50" r="40" fill="none" stroke="#E2E8F0" stroke-width="20"/>';
      if(legendEl) legendEl.innerHTML = '<div class="empty" style="padding:8px 0;font-size:.75rem;">কোনো ডেটা নেই</div>';
      return;
    }

    var R = 40, C = 2 * Math.PI * R;
    var offset = 0;
    var svg = '';
    data.forEach(function(d){
      var pct = d.amount / total;
      var dash = pct * C;
      svg += '<circle cx="50" cy="50" r="' + R + '" fill="none" stroke="' + esc(d.color) + '" stroke-width="20" ' +
        'stroke-dasharray="' + dash.toFixed(2) + ' ' + (C - dash).toFixed(2) + '" ' +
        'stroke-dashoffset="' + (-offset).toFixed(2) + '"/>';
      offset += dash;
    });
    svgEl.innerHTML = svg;

    if(legendEl){
      legendEl.innerHTML = data.slice(0, 6).map(function(d){
        var pct = Math.round((d.amount / total) * 100);
        return '<div class="legend-item">' +
          '<span class="legend-dot" style="background:' + esc(d.color) + ';"></span>' +
          '<span class="legend-label">' + esc(d.name) + '</span>' +
          '<span class="legend-val">' + pct + '%</span>' +
        '</div>';
      }).join('');
    }
  }

  /* ---------- Settings ---------- */
  function renderSettings(){
    var s = Store.state.settings;
    var el;

    el = $('#setLanguageVal');
    if(el) el.textContent = s.lang === 'bn' ? 'বাংলা' : 'English';

    var themeLabels = { system: 'সিস্টেম', light: 'লাইট', dark: 'ডার্ক' };
    el = $('#setAppearanceVal');
    if(el) el.textContent = themeLabels[s.theme] || 'সিস্টেম';

    var fontLabels = { '0.9': 'ছোট', '1': 'মাঝারি', '1.15': 'বড়' };
    el = $('#setFontVal');
    if(el) el.textContent = fontLabels[String(s.fontScale)] || 'মাঝারি';

    el = $('#setCategoriesVal');
    if(el) el.textContent = s.categoryMode === 'custom' ? 'কাস্টম' : 'ডিফল্ট';

    el = $('#setAccountsVal');
    if(el) el.textContent = Store.getActiveAccounts().length + 'টি';

    el = $('#setSecurityVal');
    if(el) el.textContent = Security.isPinSet() ? 'চালু' : 'বন্ধ';

    var meta = Store.state.meta;
    el = $('#setBackupVal');
    if(el){
      if(meta.lastBackup){
        var days = Math.floor((Date.now() - meta.lastBackup) / 86400000);
        el.textContent = days === 0 ? 'আজ' : (days + ' দিন আগে');
      } else {
        el.textContent = 'কখনো না';
      }
    }
  }

  /* ---------- Nav ---------- */
  function switchPanel(name){
    $$('.panel').forEach(function(p){ p.classList.toggle('active', p.id === 'panel-' + name); });
    $$('.nav-btn').forEach(function(b){ b.classList.toggle('active', b.dataset.panel === name); });
    if(name === 'home') renderHome();
    else if(name === 'txns') renderTxns();
    else if(name === 'summary') renderSummary();
    else if(name === 'settings') renderSettings();
  }

  /* ---------- Theme / Font ---------- */
  function applyTheme(){
    var s = Store.state.settings;
    var theme = s.theme;
    if(theme === 'system'){
      theme = (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-theme', theme);
    var meta = document.querySelector('meta[name="theme-color"]');
    if(meta) meta.content = theme === 'dark' ? '#0B1220' : '#0F766E';
  }

  function applyFont(){
    var scale = Store.state.settings.fontScale || 1;
    document.documentElement.style.setProperty('--font-scale', String(scale));
  }

  function applyLanguage(){
    I18n.setLang(Store.state.settings.lang);
    document.documentElement.lang = Store.state.settings.lang;
    renderHeader();
    renderSettings();
    var active = $('.panel.active');
    if(active) switchPanel(active.id.replace('panel-', ''));
  }

  function refreshAll(){
    renderHeader();
    var active = $('.panel.active');
    if(active) switchPanel(active.id.replace('panel-', ''));
  }

  return {
    esc: esc,
    money: money,
    fmtDate: fmtDate,
    renderHeader: renderHeader,
    renderHome: renderHome,
    renderTxns: renderTxns,
    renderSummary: renderSummary,
    renderSettings: renderSettings,
    switchPanel: switchPanel,
    applyTheme: applyTheme,
    applyFont: applyFont,
    applyLanguage: applyLanguage,
    refreshAll: refreshAll,
    toast: toast,
    openModal: openModal,
    confirm: confirm,
    alert: alert,
    get txnFilter(){ return txnFilter; }
  };
})();