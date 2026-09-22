/* ═══════════════════════════════════════════════════════
   I18n — language helper
   ═══════════════════════════════════════════════════════ */
var I18n = (function(){
  var lang = 'bn';
  var bnDigits = ['০','১','২','৩','৪','৫','৬','৭','৮','৯'];

  function setLang(l){
    lang = (l === 'en') ? 'en' : 'bn';
  }

  function getLang(){ return lang; }

  function num(n){
    var s = String(n);
    if(lang === 'bn') return s.replace(/[0-9]/g, function(d){ return bnDigits[+d]; });
    return s;
  }

  return {
    setLang: setLang,
    getLang: getLang,
    num: num
  };
})();