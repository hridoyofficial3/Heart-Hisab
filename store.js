/* ═══════════════════════════════════════════════════════
   Store — data layer (localStorage)
   ═══════════════════════════════════════════════════════ */
var Store = (function(){
  var KEYS = {
    accounts:   'hk3_accounts',
    categories: 'hk3_categories',
    entries:    'hk3_entries',
    settings:   'hk3_settings',
    meta:       'hk3_meta'
  };

  var DEFAULT_ACC = [
    { id:'acc_cash',    name:'নগদ',     icon:'wallet',     color:'#059669', system:true },
    { id:'acc_bank',    name:'ব্যাংক',   icon:'banknote',   color:'#3B82F6', system:true },
    { id:'acc_bkash',   name:'বিকাশ',    icon:'phone',      color:'#E2136E', system:true },
    { id:'acc_savings', name:'সেভিংস',   icon:'piggy-bank', color:'#B8862E', system:true }
  ];

  var DEFAULT_CAT = [
    { id:'cat_salary',    type:'income',  name:'বেতন',      icon:'briefcase',      color:'#059669', system:true },
    { id:'cat_business',  type:'income',  name:'ব্যবসা',    icon:'shopping-cart',  color:'#0EA5E9', system:true },
    { id:'cat_gift_in',   type:'income',  name:'উপহার',     icon:'gift',           color:'#8B5CF6', system:true },
    { id:'cat_other_in',  type:'income',  name:'অন্যান্য',  icon:'sparkles',       color:'#64748B', system:true },
    { id:'cat_food',      type:'expense', name:'খাবার',     icon:'utensils',       color:'#F59E0B', system:true },
    { id:'cat_transport', type:'expense', name:'যাতায়াত',  icon:'car',            color:'#3B82F6', system:true },
    { id:'cat_bills',     type:'expense', name:'বিল',       icon:'zap',            color:'#EF4444', system:true },
    { id:'cat_shopping',  type:'expense', name:'কেনাকাটা', icon:'shopping-cart',  color:'#EC4899', system:true },
    { id:'cat_health',    type:'expense', name:'স্বাস্থ্য',  icon:'heart',          color:'#DC2626', system:true },
    { id:'cat_education', type:'expense', name:'শিক্ষা',    icon:'graduation-cap', color:'#7C3AED', system:true },
    { id:'cat_home',      type:'expense', name:'বাসা',      icon:'home2',          color:'#0891B2', system:true },
    { id:'cat_other_ex',  type:'expense', name:'অন্যান্য',  icon:'tag',            color:'#64748B', system:true }
  ];

  var DEFAULT_SET = {
    lang: 'bn',
    theme: 'system',
    fontScale: 1,
    currency: '৳',
    categoryMode: 'default'
  };

  var state = {
    accounts: [],
    categories: [],
    entries: [],
    settings: {},
    meta: {}
  };

  var _lastId = 0;

  /* ---------- Utils ---------- */
  function nextId(){
    var n = Date.now();
    _lastId = n > _lastId ? n : _lastId + 1;
    return _lastId;
  }

  function todayISO(){
    var d = new Date();
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  }

  function round2(n){
    n = Number(n);
    if(!isFinite(n)) return 0;
    return Math.round((n + Number.EPSILON) * 100) / 100;
  }

  function notify(msg){
    try {
      if(typeof UI !== 'undefined' && UI.toast) UI.toast(msg);
    } catch(e){}
    console.warn('[Store]', msg);
  }

  /* ---------- Storage ---------- */
  function read(key, fallback){
    try {
      var raw = localStorage.getItem(key);
      if(!raw) return fallback;
      var v = JSON.parse(raw);
      return v === null || v === undefined ? fallback : v;
    } catch(e){
      console.warn('[Store] read failed for', key, e.message);
      return fallback;
    }
  }

  function write(key, value){
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch(e){
      notify('সেভ করা যায়নি — জায়গা নেই');
      console.error('[Store] write failed', key, e);
      return false;
    }
  }

  /* ---------- Load / Save ---------- */
  function load(){
    state.accounts = read(KEYS.accounts, null);
    if(!Array.isArray(state.accounts) || state.accounts.length === 0){
      state.accounts = DEFAULT_ACC.map(function(a){ return Object.assign({}, a); });
    }

    state.categories = read(KEYS.categories, null);
    if(!Array.isArray(state.categories) || state.categories.length === 0){
      state.categories = DEFAULT_CAT.map(function(c){ return Object.assign({}, c); });
    }

    state.entries = read(KEYS.entries, null);
    if(!Array.isArray(state.entries)) state.entries = [];
    state.entries = state.entries.filter(function(e){
      return e && typeof e === 'object' &&
        typeof e.id === 'number' &&
        typeof e.amount === 'number' &&
        isFinite(e.amount) && e.amount > 0;
    });

    var s = read(KEYS.settings, null);
    state.settings = Object.assign({}, DEFAULT_SET, s || {});

    state.meta = Object.assign({ schema: 3, lastBackup: null }, read(KEYS.meta, null) || {});

    /* sanitize settings */
    if(state.settings.lang !== 'en' && state.settings.lang !== 'bn') state.settings.lang = 'bn';
    if(['system','light','dark'].indexOf(state.settings.theme) === -1) state.settings.theme = 'system';
    if([0.9, 1, 1.15].indexOf(Number(state.settings.fontScale)) === -1) state.settings.fontScale = 1;
    if(typeof state.settings.currency !== 'string') state.settings.currency = '৳';
  }

  function save(){
    write(KEYS.accounts, state.accounts);
    write(KEYS.categories, state.categories);
    write(KEYS.entries, state.entries);
    write(KEYS.settings, state.settings);
    write(KEYS.meta, state.meta);
  }

  function saveSettings(){ write(KEYS.settings, state.settings); }
  function saveEntries(){ write(KEYS.entries, state.entries); }
  function saveAccounts(){ write(KEYS.accounts, state.accounts); }
  function saveCategories(){ write(KEYS.categories, state.categories); }

  /* ---------- Accounts ---------- */
  function getAccount(id){
    for(var i = 0; i < state.accounts.length; i++){
      if(state.accounts[i].id === id) return state.accounts[i];
    }
    return null;
  }

  function getActiveAccounts(){
    return state.accounts.filter(function(a){ return !a.archived; });
  }

  function accountBalance(id){
    var bal = 0;
    for(var i = 0; i < state.entries.length; i++){
      var e = state.entries[i];
      if(e.accountId !== id) continue;
      bal += (e.type === 'income') ? e.amount : -e.amount;
    }
    return round2(bal);
  }

  function totalBalance(){
    var bal = 0;
    for(var i = 0; i < state.entries.length; i++){
      bal += (state.entries[i].type === 'income') ? state.entries[i].amount : -state.entries[i].amount;
    }
    return round2(bal);
  }

  function accountUsage(id){
    var count = 0;
    for(var i = 0; i < state.entries.length; i++){
      if(state.entries[i].accountId === id) count++;
    }
    return { entries: count };
  }

  function addAccount(a){
    var acc = {
      id: a.id || ('acc_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)),
      name: String(a.name || '').trim(),
      icon: a.icon || 'wallet',
      color: (typeof a.color === 'string' ? a.color : '#64748B'),
      system: false,
      archived: false
    };
    if(!acc.name) throw new Error('Name required');
    state.accounts.push(acc);
    saveAccounts();
    return acc;
  }

  function updateAccount(id, patch){
    var a = getAccount(id);
    if(!a) return false;
    if(patch.name !== undefined) a.name = String(patch.name).trim();
    if(patch.icon !== undefined) a.icon = patch.icon;
    if(patch.color !== undefined && typeof patch.color === 'string') a.color = patch.color;
    if(patch.archived !== undefined && !a.system) a.archived = !!patch.archived;
    saveAccounts();
    return true;
  }

  function deleteAccount(id){
    var a = getAccount(id);
    if(!a || a.system) return false;
    var usage = accountUsage(id);
    if(usage.entries > 0){
      a.archived = true;
      saveAccounts();
      return 'archived';
    }
    state.accounts = state.accounts.filter(function(x){ return x.id !== id; });
    saveAccounts();
    return 'deleted';
  }

  /* ---------- Categories ---------- */
  function getCategory(id){
    for(var i = 0; i < state.categories.length; i++){
      if(state.categories[i].id === id) return state.categories[i];
    }
    return null;
  }

  function categoriesByType(type){
    return state.categories.filter(function(c){ return c.type === type; });
  }

  function addCategory(c){
    var cat = {
      id: c.id || ('cat_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)),
      type: c.type === 'income' ? 'income' : 'expense',
      name: String(c.name || '').trim(),
      icon: c.icon || 'tag',
      color: (typeof c.color === 'string' ? c.color : '#64748B'),
      system: false
    };
    if(!cat.name) throw new Error('Name required');
    state.categories.push(cat);
    saveCategories();
    return cat;
  }

  function updateCategory(id, patch){
    var c = getCategory(id);
    if(!c) return false;
    if(patch.name !== undefined) c.name = String(patch.name).trim();
    if(patch.icon !== undefined) c.icon = patch.icon;
    if(patch.color !== undefined && typeof patch.color === 'string') c.color = patch.color;
    saveCategories();
    return true;
  }

  function deleteCategory(id){
    var c = getCategory(id);
    if(!c || c.system) return false;
    var fb = c.type === 'income' ? 'cat_other_in' : 'cat_other_ex';
    for(var i = 0; i < state.entries.length; i++){
      if(state.entries[i].categoryId === id) state.entries[i].categoryId = fb;
    }
    state.categories = state.categories.filter(function(x){ return x.id !== id; });
    saveCategories();
    saveEntries();
    return true;
  }

  /* ---------- Entries ---------- */
  function getEntry(id){
    for(var i = 0; i < state.entries.length; i++){
      if(state.entries[i].id === id) return state.entries[i];
    }
    return null;
  }

  function addEntry(e){
    var ent = {
      id: nextId(),
      type: e.type === 'income' ? 'income' : 'expense',
      amount: round2(Number(e.amount) || 0),
      accountId: String(e.accountId || 'acc_cash'),
      categoryId: e.categoryId || (e.type === 'income' ? 'cat_other_in' : 'cat_other_ex'),
      date: (typeof e.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(e.date)) ? e.date : todayISO(),
      note: typeof e.note === 'string' ? e.note.slice(0, 200) : ''
    };
    if(ent.amount <= 0) throw new Error('Invalid amount');
    state.entries.push(ent);
    saveEntries();
    return ent;
  }

  function updateEntry(id, patch){
    var e = getEntry(id);
    if(!e) return false;
    if(patch.amount !== undefined){
      var a = round2(Number(patch.amount) || 0);
      if(a <= 0) throw new Error('Invalid amount');
      e.amount = a;
    }
    if(patch.accountId !== undefined) e.accountId = String(patch.accountId);
    if(patch.categoryId !== undefined) e.categoryId = patch.categoryId;
    if(patch.date !== undefined && /^\d{4}-\d{2}-\d{2}$/.test(patch.date)) e.date = patch.date;
    if(patch.note !== undefined) e.note = String(patch.note).slice(0, 200);
    saveEntries();
    return true;
  }

  function deleteEntry(id){
    var idx = -1;
    for(var i = 0; i < state.entries.length; i++){
      if(state.entries[i].id === id){ idx = i; break; }
    }
    if(idx < 0) return false;
    state.entries.splice(idx, 1);
    saveEntries();
    return true;
  }

  /* ---------- Stats ---------- */
  function entriesInRange(from, to){
    return state.entries.filter(function(e){
      return e.date >= from && e.date <= to;
    });
  }

  function statsInRange(from, to){
    var list = entriesInRange(from, to);
    var inc = 0, exp = 0;
    for(var i = 0; i < list.length; i++){
      if(list[i].type === 'income') inc += list[i].amount;
      else exp += list[i].amount;
    }
    return { income: round2(inc), expense: round2(exp), net: round2(inc - exp) };
  }

  function categoryBreakdown(type, from, to){
    var list = entriesInRange(from, to).filter(function(e){ return e.type === type; });
    var map = {};
    for(var i = 0; i < list.length; i++){
      var e = list[i];
      var id = e.categoryId || (type === 'income' ? 'cat_other_in' : 'cat_other_ex');
      map[id] = round2((map[id] || 0) + e.amount);
    }
    var arr = [];
    Object.keys(map).forEach(function(catId){
      var c = getCategory(catId);
      arr.push({
        categoryId: catId,
        name: c ? c.name : 'অন্যান্য',
        color: c ? c.color : '#64748B',
        icon: c ? c.icon : 'tag',
        amount: map[catId]
      });
    });
    arr.sort(function(a, b){ return b.amount - a.amount; });
    return arr;
  }

  function monthlyTrend(months){
    months = months || 6;
    var out = [];
    var now = new Date();
    for(var i = months - 1; i >= 0; i--){
      var d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      var y = d.getFullYear(), m = d.getMonth();
      var from = y + '-' + String(m + 1).padStart(2, '0') + '-01';
      var last = new Date(y, m + 1, 0).getDate();
      var to = y + '-' + String(m + 1).padStart(2, '0') + '-' + String(last).padStart(2, '0');
      var s = statsInRange(from, to);
      out.push({ year: y, month: m, income: s.income, expense: s.expense });
    }
    return out;
  }

  /* ---------- Backup ---------- */
  function exportData(){
    return {
      app: 'hisab-khata',
      version: 3,
      exportedAt: new Date().toISOString(),
      accounts: state.accounts,
      categories: state.categories,
      entries: state.entries,
      settings: state.settings
    };
  }

  function validateImport(data){
    if(!data || typeof data !== 'object') return { ok: false, reason: 'invalid' };
    var accounts = Array.isArray(data.accounts) ? data.accounts.filter(function(a){
      return a && typeof a.id === 'string' && typeof a.name === 'string';
    }) : [];
    var categories = Array.isArray(data.categories) ? data.categories.filter(function(c){
      return c && typeof c.id === 'string' && typeof c.name === 'string';
    }) : [];
    var entries = Array.isArray(data.entries) ? data.entries.filter(function(e){
      return e && typeof e === 'object' && isFinite(Number(e.amount)) && Number(e.amount) > 0;
    }) : [];
    var settings = (data.settings && typeof data.settings === 'object') ? data.settings : {};
    return {
      ok: true,
      accounts: accounts,
      categories: categories,
      entries: entries,
      settings: settings,
      stats: {
        accounts: accounts.length,
        categories: categories.length,
        entries: entries.length
      }
    };
  }

  function importData(data){
    var v = validateImport(data);
    if(!v.ok) throw new Error('Invalid backup file');

    /* Accounts */
    var accs = v.accounts.map(function(a){
      return {
        id: String(a.id),
        name: String(a.name).slice(0, 50),
        icon: a.icon || 'wallet',
        color: (typeof a.color === 'string' ? a.color : '#64748B'),
        system: !!a.system,
        archived: !!a.archived
      };
    });
    if(accs.length === 0){
      accs = DEFAULT_ACC.map(function(a){ return Object.assign({}, a); });
    }

    /* Categories */
    var cats = v.categories.map(function(c){
      return {
        id: String(c.id),
        type: c.type === 'income' ? 'income' : 'expense',
        name: String(c.name).slice(0, 50),
        icon: c.icon || 'tag',
        color: (typeof c.color === 'string' ? c.color : '#64748B'),
        system: !!c.system
      };
    });
    if(cats.length === 0){
      cats = DEFAULT_CAT.map(function(c){ return Object.assign({}, c); });
    }

    /* Entries */
    var ents = v.entries.map(function(e){
      return {
        id: (typeof e.id === 'number' && isFinite(e.id)) ? e.id : nextId(),
        type: e.type === 'income' ? 'income' : 'expense',
        amount: round2(Number(e.amount)),
        accountId: String(e.accountId || 'acc_cash'),
        categoryId: String(e.categoryId || (e.type === 'income' ? 'cat_other_in' : 'cat_other_ex')),
        date: (typeof e.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(e.date)) ? e.date : todayISO(),
        note: typeof e.note === 'string' ? e.note.slice(0, 200) : ''
      };
    });

    /* Settings */
    var sett = Object.assign({}, DEFAULT_SET, v.settings);

    /* Commit */
    state.accounts = accs;
    state.categories = cats;
    state.entries = ents;
    state.settings = sett;
    save();

    return { accounts: accs.length, categories: cats.length, entries: ents.length };
  }

  function markBackupDone(){
    state.meta.lastBackup = Date.now();
    write(KEYS.meta, state.meta);
  }

  function resetAll(){
    try {
      Object.keys(localStorage).forEach(function(k){
        if(k.indexOf('hk3_') === 0) localStorage.removeItem(k);
      });
    } catch(e){}
    state.accounts = DEFAULT_ACC.map(function(a){ return Object.assign({}, a); });
    state.categories = DEFAULT_CAT.map(function(c){ return Object.assign({}, c); });
    state.entries = [];
    state.settings = Object.assign({}, DEFAULT_SET);
    state.meta = { schema: 3, lastBackup: null };
    save();
  }

  /* ---------- Public API ---------- */
  return {
    state: state,

    load: load,
    save: save,
    saveSettings: saveSettings,
    saveEntries: saveEntries,
    saveAccounts: saveAccounts,
    saveCategories: saveCategories,

    getAccount: getAccount,
    getActiveAccounts: getActiveAccounts,
    accountBalance: accountBalance,
    totalBalance: totalBalance,
    accountUsage: accountUsage,
    addAccount: addAccount,
    updateAccount: updateAccount,
    deleteAccount: deleteAccount,

    getCategory: getCategory,
    categoriesByType: categoriesByType,
    addCategory: addCategory,
    updateCategory: updateCategory,
    deleteCategory: deleteCategory,

    getEntry: getEntry,
    addEntry: addEntry,
    updateEntry: updateEntry,
    deleteEntry: deleteEntry,

    entriesInRange: entriesInRange,
    statsInRange: statsInRange,
    categoryBreakdown: categoryBreakdown,
    monthlyTrend: monthlyTrend,

    exportData: exportData,
    validateImport: validateImport,
    importData: importData,
    markBackupDone: markBackupDone,
    resetAll: resetAll,

    nextId: nextId,
    todayISO: todayISO,
    round2: round2,

    DEFAULT_ACC: DEFAULT_ACC,
    DEFAULT_CAT: DEFAULT_CAT,
    DEFAULT_SET: DEFAULT_SET
  };
})();