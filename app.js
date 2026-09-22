/* ═══════════════════════════════════════════════════════
   App — controller
   ═══════════════════════════════════════════════════════ */
var App = (function(){
  function $(s, r){ return (r || document).querySelector(s); }
  function $$(s, r){ return Array.prototype.slice.call((r || document).querySelectorAll(s)); }

  var pinBuffer = '';

  /* ---------- Init ---------- */
  function init(){
    try {
      Store.load();
      Icons.hydrate(document);
      UI.applyTheme();
      UI.applyFont();
      I18n.setLang(Store.state.settings.lang);

      bindLockScreen();
      bindNavigation();
      bindFab();
      bindSearch();
      bindPeriodTabs();
      bindSettingsRows();
      bindGlobalEvents();

      if(Security.isPinSet()){
        showLockScreen();
      } else {
        showApp();
      }
    } catch(e){
      var b = $('#errBox');
      if(b){ b.style.display = 'block'; b.innerHTML += '💥 INIT: ' + e.message + '<br>'; }
      console.error(e);
    }
  }

  /* ---------- Lock ---------- */
  function bindLockScreen(){
    var pad = $('#pinPad');
    if(pad){
      pad.addEventListener('click', function(e){
        var btn = e.target.closest('.pin-key');
        if(!btn) return;
        onPinKey(btn.dataset.key);
      });
    }
    var forgot = $('#lockForgotBtn');
    if(forgot){
      forgot.addEventListener('click', function(){
        UI.confirm('PIN ভুলে গেছেন? অ্যাপ লক বন্ধ করতে সব ডেটা মুছতে হবে। চালিয়ে যাবেন?',
          function(){
            Security.clearPin();
            UI.toast('লক বন্ধ হয়েছে');
            showApp();
          }, { danger: true, yesText: 'হ্যাঁ' });
      });
    }
  }

  function showLockScreen(){
    var ls = $('#lockScreen');
    var app = $('#app');
    if(!ls || !app) return;
    ls.classList.remove('hidden');
    app.classList.add('hidden');
    pinBuffer = '';
    updateDots();
    var err = $('#lockError');
    if(err) err.textContent = '';
  }

  function showApp(){
    var app = $('#app');
    if(app) app.classList.remove('hidden');
    var ls = $('#lockScreen');
    if(ls) ls.classList.add('hidden');
    Security.recordActivity();
    UI.refreshAll();
  }

  function updateDots(){
    var dots = $$('#pinDots .pin-dot');
    dots.forEach(function(d, i){
      d.classList.toggle('filled', i < pinBuffer.length);
    });
  }

  function onPinKey(key){
    var err = $('#lockError');
    if(err) err.textContent = '';

    var cd = Security.cooldownRemaining();
    if(cd > 0){
      if(err) err.textContent = 'অপেক্ষা করুন ' + cd + ' সেকেন্ড';
      return;
    }

    if(key === 'del'){
      pinBuffer = pinBuffer.slice(0, -1);
      updateDots();
      return;
    }
    if(key === 'bio'){
      // WebAuthn not implemented in this build
      return;
    }
    if(!/^\d$/.test(key)) return;
    if(pinBuffer.length >= Security.PIN_LENGTH) return;
    pinBuffer += key;
    updateDots();

    if(pinBuffer.length === Security.PIN_LENGTH){
      Security.verifyPin(pinBuffer).then(function(ok){
        if(ok){
          Security.recordSuccess();
          pinBuffer = '';
          updateDots();
          showApp();
        } else {
          var r = Security.recordFailure();
          pinBuffer = '';
          setTimeout(updateDots, 200);
          if(r.cooldownSec){
            if(err) err.textContent = 'অপেক্ষা করুন ' + r.cooldownSec + ' সেকেন্ড';
          } else {
            if(err) err.textContent = 'ভুল PIN';
          }
        }
      });
    }
  }

  /* ---------- Navigation ---------- */
  function bindNavigation(){
    $$('.nav-btn').forEach(function(b){
      b.addEventListener('click', function(){ UI.switchPanel(b.dataset.panel); });
    });
    var s = $('#btnSettings');
    if(s) s.addEventListener('click', function(){ UI.switchPanel('settings'); });
    var va = $('#btnViewAll');
    if(va) va.addEventListener('click', function(){ UI.switchPanel('txns'); });
    var ma = $('#btnManageAccounts');
    if(ma) ma.addEventListener('click', openAccountsModal);
  }

  function bindFab(){
    var f = $('#fabAdd');
    if(f) f.addEventListener('click', function(){ showEntrySheet(null); });
  }

  function bindSearch(){
    var b = $('#btnSearch');
    if(b) b.addEventListener('click', function(){
      UI.switchPanel('txns');
      setTimeout(function(){
        var s = $('#txnSearch');
        if(s) s.focus();
      }, 200);
    });
    var s = $('#txnSearch');
    if(s) s.addEventListener('input', function(){
      UI.txnFilter.q = s.value.trim();
      UI.renderTxns();
    });
  }

  function bindPeriodTabs(){
    $$('.period-tab').forEach(function(t){
      t.addEventListener('click', function(){
        $$('.period-tab').forEach(function(x){ x.classList.remove('active'); });
        t.classList.add('active');
        UI.renderSummary();
        // Update internal period
        try {
          // Trigger click on already active check
        } catch(e){}
      });
    });
  }

  function bindSettingsRows(){
    $$('[data-settings]').forEach(function(row){
      row.addEventListener('click', function(){
        var k = row.dataset.settings;
        if(k === 'language') openLanguageModal();
        else if(k === 'appearance') openAppearanceModal();
        else if(k === 'font') openFontModal();
        else if(k === 'categories') openCategoriesModal();
        else if(k === 'accounts') openAccountsModal();
        else if(k === 'security') openSecurityModal();
        else if(k === 'backup') openBackupModal();
        else if(k === 'about') openAboutModal();
        else if(k === 'reset') openResetModal();
      });
    });
  }

  function bindGlobalEvents(){
    ['touchstart','mousedown','keydown','scroll'].forEach(function(ev){
      document.addEventListener(ev, function(){ Security.recordActivity(); }, { passive: true });
    });
    setInterval(function(){
      var app = $('#app');
      if(app && !app.classList.contains('hidden') && Security.isPinSet() && Security.isIdle()){
        showLockScreen();
      }
    }, 15000);
    document.addEventListener('visibilitychange', function(){
      if(document.visibilityState === 'visible'){
        var app = $('#app');
        if(app && !app.classList.contains('hidden') && Security.isPinSet() && Security.isIdle()){
          showLockScreen();
        } else {
          Security.recordActivity();
        }
      }
    });
    if(window.matchMedia){
      try {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(){
          if(Store.state.settings.theme === 'system') UI.applyTheme();
        });
      } catch(e){}
    }
  }

  /* ---------- Entry sheet ---------- */
  function showEntrySheet(id){
    var isEdit = id != null;
    var entry = isEdit ? Store.getEntry(id) : null;
    if(isEdit && !entry) return;

    var accounts = Store.getActiveAccounts();
    if(accounts.length === 0){
      UI.alert('কোনো অ্যাকাউন্ট নেই। সেটিংস থেকে যোগ করুন।');
      return;
    }

    var curType = entry ? entry.type : 'expense';
    var curAccId = entry ? entry.accountId : accounts[0].id;
    var curAmount = entry ? entry.amount : '';
    var curDate = entry ? entry.date : Store.todayISO();
    var curNote = entry ? entry.note : '';

    var accs = accounts.map(function(a){
      return '<option value="' + UI.esc(a.id) + '"' + (a.id === curAccId ? ' selected' : '') + '>' + UI.esc(a.name) + '</option>';
    }).join('');

    var body =
      '<div class="type-toggle" id="sheetTypeToggle">' +
        '<button type="button" data-type="expense" class="' + (curType === 'expense' ? 'active expense' : '') + '">ব্যয়</button>' +
        '<button type="button" data-type="income" class="' + (curType === 'income' ? 'active income' : '') + '">আয়</button>' +
      '</div>' +
      '<div class="field"><label class="field-label">পরিমাণ</label>' +
        '<div class="amount-input-wrap"><span class="currency">৳</span>' +
        '<input type="text" inputmode="decimal" class="field-input" id="sheetAmount" value="' + (curAmount || '') + '" placeholder="0"></div>' +
      '</div>' +
      '<div class="field"><label class="field-label">ক্যাটাগরি</label>' +
        '<div class="category-grid" id="sheetCatGrid"></div>' +
      '</div>' +
      '<div class="row2">' +
        '<div class="field"><label class="field-label">অ্যাকাউন্ট</label>' +
          '<select class="field-select" id="sheetAccount">' + accs + '</select></div>' +
        '<div class="field"><label class="field-label">তারিখ</label>' +
          '<input type="date" class="field-input" id="sheetDate" value="' + UI.esc(curDate) + '"></div>' +
      '</div>' +
      '<div class="field"><label class="field-label">নোট</label>' +
        '<input type="text" class="field-input" id="sheetNote" value="' + UI.esc(curNote) + '" placeholder="বিবরণ..."></div>' +
      (isEdit ? '<button type="button" class="btn btn-danger" id="sheetDelete" style="margin-top:4px;">লেনদেন মুছুন</button>' : '');

    var footer = '<button type="button" class="btn btn-primary" id="sheetSave" style="margin-top:8px;">' +
      (isEdit ? 'আপডেট করুন' : 'সেভ করুন') + '</button>';

    var m = UI.openModal({ title: isEdit ? 'লেনদেন এডিট' : 'নতুন লেনদেন', body: body, footer: footer });
    if(!m) return;
    var bd = m.backdrop;

    renderCatGrid(bd, curType, entry ? entry.categoryId : null);

    bd.querySelectorAll('#sheetTypeToggle button').forEach(function(btn){
      btn.addEventListener('click', function(){
        bd.querySelectorAll('#sheetTypeToggle button').forEach(function(b){
          b.classList.remove('active', 'income', 'expense');
        });
        btn.classList.add('active', btn.dataset.type);
        renderCatGrid(bd, btn.dataset.type, null);
      });
    });

    var amountInput = bd.querySelector('#sheetAmount');
    amountInput.addEventListener('input', function(){
      var v = amountInput.value.replace(/[^\d.]/g, '');
      var dot = v.indexOf('.');
      if(dot >= 0) v = v.slice(0, dot + 1) + v.slice(dot + 1).replace(/\./g, '').slice(0, 2);
      amountInput.value = v;
    });
    setTimeout(function(){ amountInput.focus(); }, 300);

    bd.querySelector('#sheetSave').addEventListener('click', function(){
      var type = bd.querySelector('#sheetTypeToggle button.active').dataset.type;
      var amount = parseFloat(amountInput.value);
      var accountId = bd.querySelector('#sheetAccount').value;
      var date = bd.querySelector('#sheetDate').value || Store.todayISO();
      var note = bd.querySelector('#sheetNote').value.trim();
      var activeCat = bd.querySelector('.category-item.active');
      var categoryId = activeCat ? activeCat.dataset.cat : (type === 'income' ? 'cat_other_in' : 'cat_other_ex');

      if(!amount || amount <= 0){ UI.toast('সঠিক পরিমাণ লিখুন'); return; }
      if(!accountId){ UI.toast('অ্যাকাউন্ট সিলেক্ট করুন'); return; }

      try {
        if(isEdit){
          Store.updateEntry(id, { amount: amount, accountId: accountId, categoryId: categoryId, date: date, note: note });
          UI.toast('আপডেট হয়েছে');
        } else {
          Store.addEntry({ type: type, amount: amount, accountId: accountId, categoryId: categoryId, date: date, note: note });
          UI.toast('যোগ হয়েছে');
        }
        m.close();
        UI.refreshAll();
      } catch(err){
        UI.toast('সমস্যা: ' + err.message);
      }
    });

    var del = bd.querySelector('#sheetDelete');
    if(del){
      del.addEventListener('click', function(){
        UI.confirm('এই লেনদেন মুছে ফেলবেন?', function(){
          Store.deleteEntry(id);
          m.close();
          UI.refreshAll();
          UI.toast('মুছে ফেলা হয়েছে');
        }, { danger: true, yesText: 'মুছুন' });
      });
    }
  }

  function renderCatGrid(root, type, selectedId){
    var grid = root.querySelector('#sheetCatGrid');
    if(!grid) return;
    var cats = Store.categoriesByType(type);
    if(!selectedId && cats.length > 0) selectedId = cats[0].id;
    grid.innerHTML = cats.map(function(c){
      return '<button type="button" class="category-item' +
        (c.id === selectedId ? ' active' : '') +
        '" data-cat="' + UI.esc(c.id) + '">' +
        Icons.svg(c.icon, 22) + '<span>' + UI.esc(c.name) + '</span></button>';
    }).join('');
    grid.querySelectorAll('.category-item').forEach(function(btn){
      btn.addEventListener('click', function(){
        grid.querySelectorAll('.category-item').forEach(function(b){ b.classList.remove('active'); });
        btn.classList.add('active');
      });
    });
  }

  /* ---------- Language modal ---------- */
  function openLanguageModal(){
    var cur = Store.state.settings.lang;
    var m = UI.openModal({
      title: 'ভাষা',
      body: '<div style="display:flex;flex-direction:column;gap:8px;">' +
        langBtn('bn', 'বাংলা', cur) + langBtn('en', 'English', cur) + '</div>'
    });
    if(!m) return;
    m.backdrop.querySelectorAll('[data-lang]').forEach(function(b){
      b.addEventListener('click', function(){
        Store.state.settings.lang = b.dataset.lang;
        Store.saveSettings();
        UI.applyLanguage();
        m.close();
      });
    });
  }
  function langBtn(v, l, cur){
    var on = v === cur;
    return '<button type="button" data-lang="' + v + '" style="padding:14px;border-radius:12px;text-align:left;font-weight:700;background:' +
      (on ? 'var(--brand-600)' : 'var(--surface-2)') + ';color:' + (on ? '#fff' : 'var(--text)') + ';">' + l + '</button>';
  }

  /* ---------- Theme modal ---------- */
  function openAppearanceModal(){
    var cur = Store.state.settings.theme;
    var m = UI.openModal({
      title: 'অ্যাপিয়ারেন্স',
      body: '<div style="display:flex;flex-direction:column;gap:8px;">' +
        themeBtn('system', 'সিস্টেম', 'ডিভাইস সেটিং অনুযায়ী', cur) +
        themeBtn('light', 'লাইট', 'উজ্জ্বল', cur) +
        themeBtn('dark', 'ডার্ক', 'অন্ধকার', cur) +
      '</div>'
    });
    if(!m) return;
    m.backdrop.querySelectorAll('[data-theme]').forEach(function(b){
      b.addEventListener('click', function(){
        Store.state.settings.theme = b.dataset.theme;
        Store.saveSettings();
        UI.applyTheme();
        UI.renderSettings();
        m.close();
      });
    });
  }
  function themeBtn(v, l, d, cur){
    var on = v === cur;
    return '<button type="button" data-theme="' + v + '" style="padding:14px;border-radius:12px;text-align:left;background:' +
      (on ? 'var(--brand-600)' : 'var(--surface-2)') + ';color:' + (on ? '#fff' : 'var(--text)') + ';">' +
      '<div style="font-weight:700;">' + l + '</div>' +
      '<div style="font-size:.75rem;opacity:.75;margin-top:2px;">' + d + '</div></button>';
  }

  /* ---------- Font modal ---------- */
  function openFontModal(){
    var cur = Number(Store.state.settings.fontScale);
    var m = UI.openModal({
      title: 'ফন্ট সাইজ',
      body: '<div style="display:flex;flex-direction:column;gap:8px;">' +
        fontBtn(0.9, 'ছোট', cur) + fontBtn(1, 'মাঝারি', cur) + fontBtn(1.15, 'বড়', cur) +
      '</div>'
    });
    if(!m) return;
    m.backdrop.querySelectorAll('[data-font]').forEach(function(b){
      b.addEventListener('click', function(){
        Store.state.settings.fontScale = Number(b.dataset.font);
        Store.saveSettings();
        UI.applyFont();
        UI.renderSettings();
        m.close();
      });
    });
  }
  function fontBtn(v, l, cur){
    var on = Number(cur) === v;
    var size = v === 0.9 ? '14px' : v === 1 ? '17px' : '20px';
    return '<button type="button" data-font="' + v + '" style="padding:14px;border-radius:12px;text-align:left;background:' +
      (on ? 'var(--brand-600)' : 'var(--surface-2)') + ';color:' + (on ? '#fff' : 'var(--text)') + ';font-size:' + size + ';font-weight:700;">' + l + '</button>';
  }

  /* ---------- Categories ---------- */
  function openCategoriesModal(){ renderCats(); }
  function renderCats(){
    var cats = Store.state.categories;
    var inc = cats.filter(function(c){ return c.type === 'income'; });
    var exp = cats.filter(function(c){ return c.type === 'expense'; });
    function row(c){
      return '<div class="txn-item" style="cursor:default;">' +
        '<div class="txn-icon" style="background:' + UI.esc(c.color) + '1A;color:' + UI.esc(c.color) + ';">' +
          Icons.svg(c.icon, 18) + '</div>' +
        '<div class="txn-body"><div class="txn-title">' + UI.esc(c.name) + '</div>' +
        '<div class="txn-meta">' + (c.system ? 'ডিফল্ট' : 'কাস্টম') + '</div></div>' +
        (!c.system ? '<button type="button" class="link-btn" data-del="' + UI.esc(c.id) + '" style="color:var(--expense);">মুছুন</button>' : '') +
      '</div>';
    }
    var body = '<button type="button" class="btn btn-primary" id="addCatBtn" style="margin-bottom:16px;">+ নতুন ক্যাটাগরি</button>' +
      '<h4 style="margin:16px 0 8px;font-size:.8125rem;color:var(--text-2);">আয়ের ক্যাটাগরি</h4>' +
      '<div style="display:flex;flex-direction:column;gap:6px;">' + inc.map(row).join('') + '</div>' +
      '<h4 style="margin:20px 0 8px;font-size:.8125rem;color:var(--text-2);">ব্যয়ের ক্যাটাগরি</h4>' +
      '<div style="display:flex;flex-direction:column;gap:6px;">' + exp.map(row).join('') + '</div>';
    var m = UI.openModal({ title: 'ক্যাটাগরি', body: body });
    if(!m) return;
    var addBtn = m.backdrop.querySelector('#addCatBtn');
    if(addBtn) addBtn.addEventListener('click', function(){ m.close(); setTimeout(openAddCat, 250); });
    m.backdrop.querySelectorAll('[data-del]').forEach(function(b){
      b.addEventListener('click', function(){
        UI.confirm('মুছে ফেলবেন?', function(){
          Store.deleteCategory(b.dataset.del);
          m.close();
          setTimeout(renderCats, 250);
          UI.toast('মুছে ফেলা হয়েছে');
        }, { danger: true });
      });
    });
  }

  function openAddCat(){
    var ICONS = ['utensils','car','zap','shopping-cart','heart','graduation-cap','home2','tag','briefcase','gift','coffee','shirt','book','plane','phone','wifi'];
    var COLORS = ['#EF4444','#F59E0B','#10B981','#3B82F6','#8B5CF6','#EC4899','#06B6D4','#64748B'];
    var body =
      '<div class="type-toggle" id="newCatType">' +
        '<button type="button" data-t="expense" class="active expense">ব্যয়</button>' +
        '<button type="button" data-t="income">আয়</button>' +
      '</div>' +
      '<div class="field"><label class="field-label">নাম</label><input type="text" class="field-input" id="newCatName" placeholder="ক্যাটাগরির নাম"></div>' +
      '<div class="field"><label class="field-label">আইকন</label><div class="category-grid" id="newCatIcons">' +
        ICONS.map(function(ic, i){ return '<button type="button" class="category-item' + (i === 0 ? ' active' : '') + '" data-i="' + ic + '">' + Icons.svg(ic, 22) + '</button>'; }).join('') +
      '</div></div>' +
      '<div class="field"><label class="field-label">রঙ</label><div style="display:flex;gap:8px;flex-wrap:wrap;" id="newCatColors">' +
        COLORS.map(function(c, i){ return '<button type="button" style="width:32px;height:32px;border-radius:50%;border:3px solid ' + (i === 0 ? '#fff' : 'transparent') + ';background:' + c + ';" data-c="' + c + '"></button>'; }).join('') +
      '</div></div>';
    var footer = '<button type="button" class="btn btn-primary" id="saveCatBtn">সেভ করুন</button>';
    var m = UI.openModal({ title: 'নতুন ক্যাটাগরি', body: body, footer: footer });
    if(!m) return;
    var selType = 'expense', selIcon = ICONS[0], selColor = COLORS[0];
    var bd = m.backdrop;

    bd.querySelectorAll('#newCatType button').forEach(function(b){
      b.addEventListener('click', function(){
        bd.querySelectorAll('#newCatType button').forEach(function(x){ x.classList.remove('active', 'income', 'expense'); });
        b.classList.add('active', b.dataset.t);
        selType = b.dataset.t;
      });
    });
    bd.querySelectorAll('#newCatIcons .category-item').forEach(function(b){
      b.addEventListener('click', function(){
        bd.querySelectorAll('#newCatIcons .category-item').forEach(function(x){ x.classList.remove('active'); });
        b.classList.add('active');
        selIcon = b.dataset.i;
      });
    });
    bd.querySelectorAll('#newCatColors button').forEach(function(b){
      b.addEventListener('click', function(){
        bd.querySelectorAll('#newCatColors button').forEach(function(x){ x.style.borderColor = 'transparent'; });
        b.style.borderColor = '#fff';
        selColor = b.dataset.c;
      });
    });
    bd.querySelector('#saveCatBtn').addEventListener('click', function(){
      var name = bd.querySelector('#newCatName').value.trim();
      if(!name){ UI.toast('নাম দিন'); return; }
      try {
        Store.addCategory({ type: selType, name: name, icon: selIcon, color: selColor });
        m.close();
        UI.toast('যোগ হয়েছে');
        setTimeout(renderCats, 250);
      } catch(e){ UI.toast(e.message); }
    });
  }

  /* ---------- Accounts ---------- */
  function openAccountsModal(){ renderAccs(); }
  function renderAccs(){
    var accs = Store.state.accounts;
    function row(a){
      var bal = Store.accountBalance(a.id);
      return '<div class="txn-item" style="cursor:default;' + (a.archived ? 'opacity:.5;' : '') + '">' +
        '<div class="txn-icon" style="background:' + UI.esc(a.color) + '1A;color:' + UI.esc(a.color) + ';">' +
          Icons.svg(a.icon, 18) + '</div>' +
        '<div class="txn-body"><div class="txn-title">' + UI.esc(a.name) + (a.archived ? ' (আর্কাইভ)' : '') + '</div>' +
        '<div class="txn-meta">' + UI.money(bal) + '</div></div>' +
        (!a.system ? '<button type="button" class="link-btn" data-edit="' + UI.esc(a.id) + '" style="margin-right:6px;">এডিট</button>' : '') +
        (!a.system ? '<button type="button" class="link-btn" data-del="' + UI.esc(a.id) + '" style="color:var(--expense);">' + (a.archived ? 'ফিরান' : 'মুছুন') + '</button>' : '') +
      '</div>';
    }
    var body = '<button type="button" class="btn btn-primary" id="addAccBtn" style="margin-bottom:16px;">+ নতুন অ্যাকাউন্ট</button>' +
      '<div style="display:flex;flex-direction:column;gap:6px;">' + accs.map(row).join('') + '</div>';
    var m = UI.openModal({ title: 'অ্যাকাউন্ট', body: body });
    if(!m) return;
    var bd = m.backdrop;
    bd.querySelector('#addAccBtn').addEventListener('click', function(){ m.close(); setTimeout(function(){ openAddAcc(); }, 250); });
    bd.querySelectorAll('[data-edit]').forEach(function(b){
      b.addEventListener('click', function(){
        var id = b.dataset.edit;
        m.close();
        setTimeout(function(){ openAddAcc(id); }, 250);
      });
    });
    bd.querySelectorAll('[data-del]').forEach(function(b){
      b.addEventListener('click', function(){
        var id = b.dataset.del;
        var acc = Store.getAccount(id);
        if(acc && acc.archived){
          Store.updateAccount(id, { archived: false });
          m.close();
          setTimeout(renderAccs, 250);
          UI.toast('ফিরিয়ে আনা হয়েছে');
          return;
        }
        UI.confirm('এই অ্যাকাউন্ট মুছে ফেলবেন? লেনদেন থাকলে আর্কাইভ হবে।', function(){
          var r = Store.deleteAccount(id);
          m.close();
          setTimeout(renderAccs, 250);
          UI.toast(r === 'deleted' ? 'মুছে ফেলা হয়েছে' : 'আর্কাইভ করা হয়েছে');
        }, { danger: true });
      });
    });
  }

  function openAddAcc(editId){
    var isEdit = !!editId;
    var acc = isEdit ? Store.getAccount(editId) : null;
    var ICONS = ['wallet','banknote','credit-card','coins','piggy-bank','phone','receipt','briefcase'];
    var COLORS = ['#059669','#3B82F6','#E2136E','#B8862E','#8B5CF6','#EC4899','#06B6D4','#64748B'];
    var body =
      '<div class="field"><label class="field-label">নাম</label>' +
        '<input type="text" class="field-input" id="accName" value="' + (acc ? UI.esc(acc.name) : '') + '" placeholder="অ্যাকাউন্টের নাম"></div>' +
      '<div class="field"><label class="field-label">আইকন</label><div class="category-grid" id="accIcons">' +
        ICONS.map(function(ic){
          var sel = acc ? acc.icon === ic : ic === ICONS[0];
          return '<button type="button" class="category-item' + (sel ? ' active' : '') + '" data-i="' + ic + '">' + Icons.svg(ic, 22) + '</button>';
        }).join('') +
      '</div></div>' +
      '<div class="field"><label class="field-label">রঙ</label><div style="display:flex;gap:8px;flex-wrap:wrap;" id="accColors">' +
        COLORS.map(function(c){
          var sel = acc ? acc.color === c : c === COLORS[0];
          return '<button type="button" style="width:32px;height:32px;border-radius:50%;border:3px solid ' + (sel ? '#fff' : 'transparent') + ';background:' + c + ';" data-c="' + c + '"></button>';
        }).join('') +
      '</div></div>';
    var footer = '<button type="button" class="btn btn-primary" id="saveAccBtn">সেভ করুন</button>';
    var m = UI.openModal({ title: isEdit ? 'অ্যাকাউন্ট এডিট' : 'নতুন অ্যাকাউন্ট', body: body, footer: footer });
    if(!m) return;
    var selIcon = acc ? acc.icon : ICONS[0];
    var selColor = acc ? acc.color : COLORS[0];
    var bd = m.backdrop;

    bd.querySelectorAll('#accIcons .category-item').forEach(function(b){
      b.addEventListener('click', function(){
        bd.querySelectorAll('#accIcons .category-item').forEach(function(x){ x.classList.remove('active'); });
        b.classList.add('active');
        selIcon = b.dataset.i;
      });
    });
    bd.querySelectorAll('#accColors button').forEach(function(b){
      b.addEventListener('click', function(){
        bd.querySelectorAll('#accColors button').forEach(function(x){ x.style.borderColor = 'transparent'; });
        b.style.borderColor = '#fff';
        selColor = b.dataset.c;
      });
    });
    bd.querySelector('#saveAccBtn').addEventListener('click', function(){
      var name = bd.querySelector('#accName').value.trim();
      if(!name){ UI.toast('নাম দিন'); return; }
      try {
        if(isEdit){
          Store.updateAccount(editId, { name: name, icon: selIcon, color: selColor });
        } else {
          Store.addAccount({ name: name, icon: selIcon, color: selColor });
        }
        m.close();
        UI.toast('সেভ হয়েছে');
        UI.refreshAll();
        setTimeout(renderAccs, 250);
      } catch(e){ UI.toast(e.message); }
    });
  }

  /* ---------- Security ---------- */
  function openSecurityModal(){
    var enabled = Security.isPinSet();
    var body =
      '<div class="txn-item" style="cursor:default;">' +
        '<div class="txn-icon" style="background:#CCFBF1;color:#0D9488;">' + Icons.svg('lock', 18) + '</div>' +
        '<div class="txn-body"><div class="txn-title">PIN লক</div>' +
        '<div class="txn-meta">' + (enabled ? 'চালু আছে' : 'বন্ধ') + '</div></div>' +
        '<button type="button" class="btn btn-primary" id="pinBtn" style="width:auto;padding:8px 14px;font-size:.8125rem;">' +
          (enabled ? 'পরিবর্তন' : 'চালু করুন') + '</button>' +
      '</div>' +
      (enabled ? '<button type="button" class="btn btn-danger" id="disPinBtn" style="margin-top:14px;">PIN লক বন্ধ করুন</button>' : '');

    var m = UI.openModal({ title: 'নিরাপত্তা', body: body });
    if(!m) return;
    var bd = m.backdrop;
    bd.querySelector('#pinBtn').addEventListener('click', function(){
      m.close();
      setTimeout(enabled ? changePinFlow : setPinFlow, 250);
    });
    var dis = bd.querySelector('#disPinBtn');
    if(dis){
      dis.addEventListener('click', function(){
        UI.confirm('PIN লক বন্ধ করবেন?', function(){
          Security.clearPin();
          m.close();
          UI.toast('বন্ধ হয়েছে');
          UI.renderSettings();
        }, { danger: true });
      });
    }
  }

  function setPinFlow(){
    var L = Security.PIN_LENGTH;
    var body =
      '<div class="field"><label class="field-label">নতুন PIN (' + L + ' সংখ্যা)</label>' +
        '<input type="password" inputmode="numeric" maxlength="' + L + '" class="field-input" id="p1" style="text-align:center;font-size:1.5rem;letter-spacing:.5em;"></div>' +
      '<div class="field"><label class="field-label">আবার লিখুন</label>' +
        '<input type="password" inputmode="numeric" maxlength="' + L + '" class="field-input" id="p2" style="text-align:center;font-size:1.5rem;letter-spacing:.5em;"></div>';
    var footer = '<button type="button" class="btn btn-primary" id="svPin">সেভ করুন</button>';
    var m = UI.openModal({ title: 'PIN সেট করুন', body: body, footer: footer });
    if(!m) return;
    var bd = m.backdrop;
    setTimeout(function(){ var x = bd.querySelector('#p1'); if(x) x.focus(); }, 100);
    bd.querySelector('#svPin').addEventListener('click', function(){
      var a = bd.querySelector('#p1').value;
      var b = bd.querySelector('#p2').value;
      if(a.length !== L || !/^\d+$/.test(a)){ UI.toast('PIN ' + L + ' সংখ্যার হতে হবে'); return; }
      if(a !== b){ UI.toast('দুটি PIN মিলছে না'); return; }
      Security.setPin(a).then(function(){
        m.close();
        UI.toast('PIN সেট হয়েছে');
        UI.renderSettings();
      }).catch(function(e){
        UI.toast('সমস্যা: ' + e.message);
      });
    });
  }

  function changePinFlow(){
    var L = Security.PIN_LENGTH;
    var body =
      '<div class="field"><label class="field-label">বর্তমান PIN</label>' +
        '<input type="password" inputmode="numeric" maxlength="' + L + '" class="field-input" id="c1" style="text-align:center;font-size:1.5rem;letter-spacing:.5em;"></div>' +
      '<div class="field"><label class="field-label">নতুন PIN</label>' +
        '<input type="password" inputmode="numeric" maxlength="' + L + '" class="field-input" id="c2" style="text-align:center;font-size:1.5rem;letter-spacing:.5em;"></div>' +
      '<div class="field"><label class="field-label">নতুন PIN আবার</label>' +
        '<input type="password" inputmode="numeric" maxlength="' + L + '" class="field-input" id="c3" style="text-align:center;font-size:1.5rem;letter-spacing:.5em;"></div>';
    var footer = '<button type="button" class="btn btn-primary" id="chPin">পরিবর্তন করুন</button>';
    var m = UI.openModal({ title: 'PIN পরিবর্তন', body: body, footer: footer });
    if(!m) return;
    var bd = m.backdrop;
    setTimeout(function(){ var x = bd.querySelector('#c1'); if(x) x.focus(); }, 100);
    bd.querySelector('#chPin').addEventListener('click', function(){
      var cur = bd.querySelector('#c1').value;
      var a = bd.querySelector('#c2').value;
      var b = bd.querySelector('#c3').value;
      if(a.length !== L || !/^\d+$/.test(a)){ UI.toast('নতুন PIN ' + L + ' সংখ্যার হতে হবে'); return; }
      if(a !== b){ UI.toast('দুটি PIN মিলছে না'); return; }
      Security.changePin(cur, a).then(function(ok){
        if(!ok){ UI.toast('বর্তমান PIN ভুল'); return; }
        m.close();
        UI.toast('পরিবর্তন হয়েছে');
      }).catch(function(e){ UI.toast('সমস্যা: ' + e.message); });
    });
  }

  /* ---------- Backup ---------- */
  function openBackupModal(){
    var body =
      '<div style="display:flex;flex-direction:column;gap:10px;">' +
        '<button type="button" class="btn btn-primary" id="expPlain">ডাউনলোড (সাধারণ)</button>' +
        '<button type="button" class="btn btn-secondary" id="expEnc">ডাউনলোড (পাসওয়ার্ড সহ)</button>' +
        '<button type="button" class="btn btn-secondary" id="impBtn">ব্যাকআপ থেকে ফিরিয়ে আনুন</button>' +
        '<input type="file" id="impFile" accept=".json,application/json" style="display:none;">' +
      '</div>';
    var m = UI.openModal({ title: 'ব্যাকআপ ও রিস্টোর', body: body });
    if(!m) return;
    var bd = m.backdrop;

    bd.querySelector('#expPlain').addEventListener('click', function(){
      downloadJSON(Store.exportData(), 'hisab-backup-' + Store.todayISO() + '.json');
      Store.markBackupDone();
      UI.renderSettings();
      UI.toast('ডাউনলোড হয়েছে');
    });

    bd.querySelector('#expEnc').addEventListener('click', function(){
      askPassword('ব্যাকআপ পাসওয়ার্ড (কমপক্ষে ৪ অক্ষর)').then(function(pw){
        if(!pw) return;
        if(pw.length < 4){ UI.toast('পাসওয়ার্ড ছোট'); return; }
        Security.encrypt(Store.exportData(), pw).then(function(enc){
          downloadJSON(enc, 'hisab-backup-enc-' + Store.todayISO() + '.json');
          Store.markBackupDone();
          UI.renderSettings();
          UI.toast('ডাউনলোড হয়েছে');
        }).catch(function(e){ UI.toast('ব্যর্থ: ' + e.message); });
      });
    });

    bd.querySelector('#impBtn').addEventListener('click', function(){
      bd.querySelector('#impFile').click();
    });

    bd.querySelector('#impFile').addEventListener('change', function(e){
      var file = e.target.files && e.target.files[0];
      if(!file) return;
      var reader = new FileReader();
      reader.onload = function(){
        var data;
        try {
          data = JSON.parse(reader.result);
        } catch(err){
          UI.toast('ফাইল পড়া যায়নি');
          return;
        }
        if(data && data.encrypted === true){
          askPassword('ব্যাকআপ পাসওয়ার্ড দিন').then(function(pw){
            if(!pw) return;
            Security.decrypt(data, pw).then(function(dec){
              doImport(dec);
            }).catch(function(e){
              UI.toast('ভুল পাসওয়ার্ড বা নষ্ট ফাইল');
            });
          });
        } else {
          doImport(data);
        }
      };
      reader.onerror = function(){ UI.toast('ফাইল পড়া যায়নি'); };
      reader.readAsText(file);
    });
  }

  function doImport(data){
    var v = Store.validateImport(data);
    if(!v.ok){ UI.toast('সঠিক ব্যাকআপ নয়'); return; }
    UI.confirm(
      'এই ব্যাকআপে ' + v.stats.entries + 'টি লেনদেন, ' + v.stats.accounts + 'টি অ্যাকাউন্ট, ' + v.stats.categories + 'টি ক্যাটাগরি আছে।\n\nবর্তমান সব ডেটা মুছে যাবে এবং এই ব্যাকআপ থেকে বসবে। চালিয়ে যাবেন?',
      function(){
        try {
          var stats = Store.importData(data);
          UI.toast('ফিরিয়ে আনা হয়েছে: ' + stats.entries + 'টি লেনদেন');
          UI.refreshAll();
        } catch(e){ UI.toast('ব্যর্থ: ' + e.message); }
      },
      { danger: true, yesText: 'হ্যাঁ, রিস্টোর করুন' }
    );
  }

  function askPassword(title){
    return new Promise(function(resolve){
      var body = '<div class="field"><label class="field-label">' + UI.esc(title) + '</label>' +
        '<input type="password" class="field-input" id="pwIn" autocomplete="new-password"></div>';
      var footer = '<div class="row2" style="gap:10px;">' +
        '<button type="button" class="btn btn-secondary" id="pwCancel">বাতিল</button>' +
        '<button type="button" class="btn btn-primary" id="pwOk">ঠিক আছে</button></div>';
      var m = UI.openModal({ title: 'পাসওয়ার্ড', body: body, footer: footer });
      if(!m){ resolve(null); return; }
      var bd = m.backdrop;
      setTimeout(function(){
        var x = bd.querySelector('#pwIn');
        if(x) x.focus();
      }, 100);
      bd.querySelector('#pwCancel').addEventListener('click', function(){ m.close(); resolve(null); });
      bd.querySelector('#pwOk').addEventListener('click', function(){
        var v = bd.querySelector('#pwIn').value;
        m.close();
        resolve(v);
      });
      bd.querySelector('#pwIn').addEventListener('keydown', function(e){
        if(e.key === 'Enter'){
          var v = bd.querySelector('#pwIn').value;
          m.close();
          resolve(v);
        }
      });
    });
  }

  function downloadJSON(obj, filename){
    try {
      var str = JSON.stringify(obj, null, 2);
      var blob = new Blob([str], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function(){ URL.revokeObjectURL(url); }, 1000);
    } catch(e){
      UI.toast('ডাউনলোড ব্যর্থ');
    }
  }

  /* ---------- About / Reset ---------- */
  function openAboutModal(){
    var body =
      '<div style="text-align:center;padding:8px 0 16px;">' +
        '<div style="width:64px;height:64px;margin:0 auto 12px;background:linear-gradient(135deg,var(--brand-600),var(--brand-800));border-radius:16px;display:flex;align-items:center;justify-content:center;color:#fff;">' +
          Icons.svg('receipt', 32) +
        '</div>' +
        '<div style="font-size:1.25rem;font-weight:800;">হিসাব খাতা</div>' +
        '<div style="font-size:.8125rem;color:var(--text-2);margin-top:4px;">সংস্করণ ৩.০</div>' +
      '</div>' +
      '<p style="line-height:1.7;font-size:.9375rem;color:var(--text-2);">আপনার দৈনন্দিন আয়-ব্যয়, সেভিংস ও আর্থিক অবস্থা ট্র্যাক করার আধুনিক, নিরাপদ অ্যাপ।</p>' +
      '<div style="margin-top:16px;padding-top:16px;border-top:1px solid var(--border-soft);">' +
        '<div style="font-size:.8125rem;color:var(--text-3);">তৈরি করেছেন</div>' +
        '<div style="font-size:.9375rem;font-weight:700;margin-top:2px;">Imran Islam Hridoy</div>' +
      '</div>';
    UI.openModal({ title: 'অ্যাপ সম্পর্কে', body: body });
  }

  function openResetModal(){
    UI.confirm('সব ডেটা স্থায়ীভাবে মুছে যাবে। আগে ব্যাকআপ নিয়েছেন?', function(){
      UI.confirm('নিশ্চিত? এটি ফেরানো যাবে না।', function(){
        Store.resetAll();
        Security.clearPin();
        UI.toast('সব ডেটা মুছে ফেলা হয়েছে');
        setTimeout(function(){ location.reload(); }, 1000);
      }, { danger: true, yesText: 'হ্যাঁ, মুছে ফেলুন' });
    }, { danger: true, yesText: 'চালিয়ে যান' });
  }

  /* ---------- Boot ---------- */
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', function(){ setTimeout(init, 50); });
  } else {
    setTimeout(init, 50);
  }

  return {
    showEntrySheet: showEntrySheet,
    openAccountsModal: openAccountsModal,
    openCategoriesModal: openCategoriesModal,
    openSecurityModal: openSecurityModal,
    openBackupModal: openBackupModal
  };
})();