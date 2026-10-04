/* ═══════════════════════════════════════════════════════
   I18n — language helper (bn / en)
   - t(key, ...args): বাংলা টেক্সটকে কী হিসেবে ধরে ইংরেজি খোঁজে; {0},{1} প্লেসহোল্ডার
   - translateDOM(root): স্ট্যাটিক/ডাইনামিক HTML-এর টেক্সট, placeholder, aria-label অনুবাদ করে
   ═══════════════════════════════════════════════════════ */
var I18n = (function(){
  var lang = 'bn';
  var bnDigits = ['০','১','২','৩','৪','৫','৬','৭','৮','৯'];

  var EN = {
    /* general */
    'হিসাব খাতা':'Hisab Khata','বাতিল':'Cancel','হ্যাঁ':'Yes','ঠিক আছে':'OK','নিশ্চিত করুন':'Confirm','বার্তা':'Message',
    'সেভ করুন':'Save','আপডেট করুন':'Update','মুছুন':'Delete','এডিট':'Edit','ফিরান':'Restore','পরিচালনা':'Manage',
    'সব দেখুন':'View all','আরও দেখুন':'Show more','কোনো লেনদেন নেই':'No transactions','কোনো অ্যাকাউন্ট নেই':'No accounts',
    'কোনো ডেটা নেই':'No data','কিছু পাওয়া যায়নি':'Nothing found','অন্যান্য':'Other',
    /* nav */
    'হোম':'Home','লেনদেন':'Transactions','রিপোর্ট':'Reports','সেটিংস':'Settings',
    /* lock */
    'PIN দিয়ে আনলক করুন':'Unlock with your PIN','PIN ভুলে গেছেন?':'Forgot PIN?','ভুল PIN':'Wrong PIN',
    'অপেক্ষা করুন {0}':'Please wait {0}','{0} সেকেন্ড':'{0} sec','{0} মিনিট':'{0} min',
    'PIN ভুলে গেলে লক বন্ধ করতে এই অ্যাপের সব ডেটা মুছে ফেলতে হবে। আগে ব্যাকআপ নিয়ে থাকলে পরে ফিরিয়ে আনতে পারবেন।\n\nসব ডেটা মুছে লক বন্ধ করবেন?':'To remove the lock without the PIN, all data in this app must be erased. If you have a backup you can restore it afterwards.\n\nErase all data and remove the lock?',
    'হ্যাঁ, সব মুছুন':'Yes, erase everything','লক বন্ধ ও ডেটা মুছে ফেলা হয়েছে':'Lock removed and data erased',
    /* home */
    'সর্বমোট ব্যালেন্স':'Total balance','এই মাসে আয়':'Income this month','এই মাসে ব্যয়':'Expense this month',
    'অ্যাকাউন্ট':'Accounts','সাম্প্রতিক লেনদেন':'Recent transactions','আয়':'Income','ব্যয়':'Expense','ট্রান্সফার':'Transfer',
    /* txns */
    'সব লেনদেন':'All transactions','নোট দিয়ে খুঁজুন...':'Search notes, category, amount...','সব':'All',
    /* reports */
    'সপ্তাহ':'Week','মাস':'Month','বছর':'Year','আয় বনাম ব্যয়':'Income vs Expense','শেষ ৬ মাস':'Last 6 months',
    'আয়ের ক্যাটাগরি':'Income categories','ব্যয়ের ক্যাটাগরি':'Expense categories',
    'মাসিক সারসংক্ষেপ':'Monthly summary','সাপ্তাহিক সারসংক্ষেপ':'Weekly summary','বাৎসরিক সারসংক্ষেপ':'Yearly summary','সার্বিক সারসংক্ষেপ':'Overall summary',
    'মোট আয়':'Total income','মোট ব্যয়':'Total expense','নেট':'Net',
    /* settings */
    'ভাষা':'Language','অ্যাপিয়ারেন্স':'Appearance','ফন্ট সাইজ':'Font size','ডেটা':'Data','ক্যাটাগরি':'Categories',
    'নিরাপত্তা':'Security','অ্যাপ লক (PIN)':'App lock (PIN)','ব্যাকআপ ও রিস্টোর':'Backup & restore','সহায়তা':'Help',
    'অ্যাপ সম্পর্কে':'About','সব ডেটা মুছুন':'Erase all data','বাংলা':'বাংলা',
    'সিস্টেম':'System','লাইট':'Light','ডার্ক':'Dark','ডিভাইস সেটিং অনুযায়ী':'Follow device setting','উজ্জ্বল':'Bright','অন্ধকার':'Dark',
    'ছোট':'Small','মাঝারি':'Medium','বড়':'Large','চালু':'On','বন্ধ':'Off','কখনো না':'Never','আজ':'Today',
    '{0}টি':'{0}','{0} দিন আগে':'{0} days ago','{0}টি অ্যাকাউন্ট':'{0}',
    /* categories */
    'বেতন':'Salary','ব্যবসা':'Business','উপহার':'Gift','খাবার':'Food','যাতায়াত':'Transport','বিল':'Bills',
    'কেনাকাটা':'Shopping','স্বাস্থ্য':'Health','শিক্ষা':'Education','বাসা':'Home',
    'ডিফল্ট':'Default','কাস্টম':'Custom','+ নতুন ক্যাটাগরি':'+ New category','নতুন ক্যাটাগরি':'New category','ক্যাটাগরি এডিট':'Edit category',
    'নাম':'Name','আইকন':'Icon','রঙ':'Color','ক্যাটাগরির নাম':'Category name','নাম দিন':'Enter a name',
    'মুছে ফেলবেন?':'Delete this?','মুছে ফেলা হয়েছে':'Deleted','যোগ হয়েছে':'Added','সেভ হয়েছে':'Saved','আপডেট হয়েছে':'Updated',
    /* accounts */
    'নগদ':'Cash','ব্যাংক':'Bank','বিকাশ':'bKash','সেভিংস':'Savings','(আর্কাইভ)':'(archived)',
    '+ নতুন অ্যাকাউন্ট':'+ New account','নতুন অ্যাকাউন্ট':'New account','অ্যাকাউন্ট এডিট':'Edit account','অ্যাকাউন্টের নাম':'Account name',
    'কোনো অ্যাকাউন্ট নেই। সেটিংস থেকে যোগ করুন।':'No accounts. Add one from Settings.',
    'এই অ্যাকাউন্ট মুছে ফেলবেন? লেনদেন থাকলে আর্কাইভ হবে।':'Delete this account? If it has transactions it will be archived.',
    'আর্কাইভ করা হয়েছে':'Archived','ফিরিয়ে আনা হয়েছে':'Restored','অ্যাকাউন্ট সিলেক্ট করুন':'Select an account',
    /* entry sheet */
    'নতুন লেনদেন':'New transaction','লেনদেন এডিট':'Edit transaction','লেনদেন মুছুন':'Delete transaction','এই লেনদেন মুছে ফেলবেন?':'Delete this transaction?',
    'পরিমাণ':'Amount','তারিখ':'Date','নোট':'Note','বিবরণ...':'Description...','কোথা থেকে':'From','কোথায়':'To',
    'সঠিক পরিমাণ লিখুন':'Enter a valid amount','দুটি আলাদা অ্যাকাউন্ট বেছে নিন':'Choose two different accounts',
    'ট্রান্সফারের জন্য কমপক্ষে ২টি অ্যাকাউন্ট দরকার':'You need at least 2 accounts to transfer',
    /* security */
    'PIN লক':'PIN lock','চালু আছে':'Enabled','পরিবর্তন':'Change','চালু করুন':'Enable','PIN লক বন্ধ করুন':'Turn off PIN lock','PIN লক বন্ধ করবেন?':'Turn off PIN lock?',
    'বন্ধ হয়েছে':'Turned off','PIN সেট করুন':'Set PIN','নতুন PIN ({0} সংখ্যা)':'New PIN ({0} digits)','আবার লিখুন':'Re-enter',
    'PIN {0} সংখ্যার হতে হবে':'PIN must be {0} digits','নতুন PIN {0} সংখ্যার হতে হবে':'New PIN must be {0} digits','দুটি PIN মিলছে না':'PINs do not match',
    'PIN সেট হয়েছে':'PIN set','PIN পরিবর্তন':'Change PIN','বর্তমান PIN':'Current PIN','নতুন PIN':'New PIN','নতুন PIN আবার':'New PIN again',
    'পরিবর্তন করুন':'Change','বর্তমান PIN ভুল':'Current PIN is wrong','পরিবর্তন হয়েছে':'Changed','সমস্যা: {0}':'Problem: {0}','ব্যর্থ: {0}':'Failed: {0}',
    /* backup */
    'ডাউনলোড (সাধারণ)':'Download (plain)','ডাউনলোড (পাসওয়ার্ড সহ)':'Download (password protected)','CSV ডাউনলোড (এক্সেলের জন্য)':'Download CSV (for Excel)',
    'ব্যাকআপ থেকে ফিরিয়ে আনুন':'Restore from backup','ডাউনলোড হয়েছে':'Downloaded','ডাউনলোড ব্যর্থ':'Download failed','ফাইল পড়া যায়নি':'Could not read file',
    'ফাইলটি অনেক বড়':'File is too large',
    'ব্যাকআপ পাসওয়ার্ড (কমপক্ষে ৪ অক্ষর)':'Backup password (min. 4 characters)','ব্যাকআপ পাসওয়ার্ড দিন':'Enter backup password','পাসওয়ার্ড':'Password','পাসওয়ার্ড ছোট':'Password too short',
    'ভুল পাসওয়ার্ড বা নষ্ট ফাইল':'Wrong password or damaged file','সঠিক ব্যাকআপ নয়':'Not a valid backup',
    'এই ব্যাকআপে {0}টি লেনদেন, {1}টি অ্যাকাউন্ট, {2}টি ক্যাটাগরি আছে।{3}\n\nবর্তমান সব ডেটা মুছে যাবে এবং এই ব্যাকআপ থেকে বসবে। নিরাপত্তার জন্য রিস্টোরের আগে বর্তমান ডেটার একটি ব্যাকআপ ডাউনলোড হবে। চালিয়ে যাবেন?':
      'This backup has {0} transactions, {1} accounts and {2} categories.{3}\n\nAll current data will be replaced. For safety, a backup of your current data will be downloaded before restoring. Continue?',
    '\n({0}টি অবৈধ রেকর্ড বাদ যাবে)':'\n({0} invalid records will be skipped)',
    'হ্যাঁ, রিস্টোর করুন':'Yes, restore','ফিরিয়ে আনা হয়েছে: {0}টি লেনদেন':'Restored: {0} transactions',
    /* about / reset */
    'আপনার দৈনন্দিন আয়-ব্যয়, সেভিংস ও আর্থিক অবস্থা ট্র্যাক করার সহজ ও অফলাইন-ফ্রেন্ডলি অ্যাপ। সব ডেটা শুধু আপনার ডিভাইসে থাকে।':'A simple, offline-friendly app to track your daily income, expenses and savings. All data stays on your device only.',
    'তৈরি করেছেন':'Created by','সংস্করণ {0}':'Version {0}',
    'সব ডেটা স্থায়ীভাবে মুছে যাবে। আগে ব্যাকআপ নিয়েছেন?':'All data will be permanently erased. Did you take a backup first?',
    'নিশ্চিত? এটি ফেরানো যাবে না।':'Sure? This cannot be undone.','হ্যাঁ, মুছে ফেলুন':'Yes, erase','চালিয়ে যান':'Continue','সব ডেটা মুছে ফেলা হয়েছে':'All data erased',
    'সেভ করা যায়নি — জায়গা নেই':'Could not save — storage is full',
    'অ্যাপ চালু করতে সমস্যা হয়েছে। পেজটি রিফ্রেশ করুন।':'Something went wrong starting the app. Please refresh the page.'
  };

  function setLang(l){ lang = (l === 'en') ? 'en' : 'bn'; }
  function getLang(){ return lang; }

  function num(n){
    var s = String(n);
    if(lang === 'bn') return s.replace(/[0-9]/g, function(d){ return bnDigits[+d]; });
    return s;
  }

  /* বাংলা/ইংরেজি সংখ্যা → ASCII (ইনপুটের জন্য) */
  function toAsciiDigits(s){
    return String(s).replace(/[০-৯]/g, function(d){ return String(bnDigits.indexOf(d)); });
  }

  function fill(s, args){
    return s.replace(/\{(\d+)\}/g, function(m, i){ return args[+i] !== undefined ? args[+i] : m; });
  }

  function t(key){
    var args = Array.prototype.slice.call(arguments, 1);
    var out = key;
    if(lang === 'en' && Object.prototype.hasOwnProperty.call(EN, key)) out = EN[key];
    return fill(out, args);
  }

  /* ---------- DOM translation ---------- */
  var textOrig = (typeof WeakMap !== 'undefined') ? new WeakMap() : null;
  var ATTRS = ['placeholder', 'aria-label', 'title'];

  function translateDOM(root){
    root = root || document.body;
    if(!root || !textOrig) return;
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    var n, nodes = [];
    while((n = walker.nextNode())) nodes.push(n);
    nodes.forEach(function(node){
      var p = node.parentNode;
      if(p && (p.nodeName === 'SCRIPT' || p.nodeName === 'STYLE')) return;
      var raw = node.nodeValue;
      if(lang === 'en'){
        var trimmed = raw.trim();
        if(!trimmed) return;
        if(Object.prototype.hasOwnProperty.call(EN, trimmed) && EN[trimmed].indexOf('{') === -1){
          if(!textOrig.has(node)) textOrig.set(node, raw);
          node.nodeValue = raw.replace(trimmed, EN[trimmed]);
        }
      } else if(textOrig.has(node)){
        node.nodeValue = textOrig.get(node);
        textOrig.delete(node);
      }
    });
    var els = root.querySelectorAll ? root.querySelectorAll('[placeholder],[aria-label],[title]') : [];
    Array.prototype.forEach.call(els, function(el){
      ATTRS.forEach(function(a){
        if(!el.hasAttribute(a)) return;
        var ob = 'data-bn-' + a;
        var cur = el.getAttribute(a);
        if(lang === 'en'){
          if(Object.prototype.hasOwnProperty.call(EN, cur)){
            if(!el.hasAttribute(ob)) el.setAttribute(ob, cur);
            el.setAttribute(a, EN[cur]);
          }
        } else if(el.hasAttribute(ob)){
          el.setAttribute(a, el.getAttribute(ob));
          el.removeAttribute(ob);
        }
      });
    });
  }

  return {
    setLang: setLang,
    getLang: getLang,
    num: num,
    toAsciiDigits: toAsciiDigits,
    t: t,
    translateDOM: translateDOM
  };
})();
