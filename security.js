/* ═══════════════════════════════════════════════════════
   Security — PIN + encryption + idle
   - PBKDF2-SHA256, 310,000 iterations
   - AES-256-GCM for backups
   ═══════════════════════════════════════════════════════ */
var Security = (function(){
  var K = {
    ENABLED:   'hk3_lock_enabled',
    PIN_HASH:  'hk3_lock_pin_hash',
    PIN_SALT:  'hk3_lock_pin_salt',
    LAST_ACT:  'hk3_lock_last_activity',
    ATTEMPTS:  'hk3_lock_attempts',
    COOLDOWN:  'hk3_lock_cooldown'
  };

  var PIN_LENGTH = 4;
  var MAX_ATTEMPTS = 5;
  var COOLDOWN_MS = 30000;
  var IDLE_MS = 5 * 60 * 1000;

  /* ---------- Crypto availability ---------- */
  function cryptoOk(){
    return !!(window.crypto && window.crypto.subtle && window.crypto.getRandomValues);
  }

  /* ---------- Base64 ---------- */
  function bufToB64(buf){
    var bytes = new Uint8Array(buf);
    var bin = '';
    for(var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  }
  function b64ToBuf(b64){
    var bin = atob(b64);
    var bytes = new Uint8Array(bin.length);
    for(var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes.buffer;
  }

  /* ---------- LocalStorage helpers ---------- */
  function lsGet(k){ try { return localStorage.getItem(k); } catch(e){ return null; } }
  function lsSet(k, v){ try { localStorage.setItem(k, v); return true; } catch(e){ return false; } }
  function lsDel(k){ try { localStorage.removeItem(k); } catch(e){} }

  /* ---------- PBKDF2 ---------- */
  function pbkdf2(secret, saltBytes, iterations, bits){
    var enc = new TextEncoder();
    return crypto.subtle.importKey('raw', enc.encode(secret), 'PBKDF2', false, ['deriveBits'])
      .then(function(base){
        return crypto.subtle.deriveBits(
          { name: 'PBKDF2', salt: saltBytes, iterations: iterations, hash: 'SHA-256' },
          base, bits
        );
      });
  }

  /* ---------- PIN ---------- */
  function isPinSet(){
    return lsGet(K.ENABLED) === '1' && !!lsGet(K.PIN_HASH) && !!lsGet(K.PIN_SALT);
  }

  function setPin(pin){
    if(!cryptoOk()) return Promise.reject(new Error('Crypto not available'));
    if(typeof pin !== 'string' || pin.length !== PIN_LENGTH || !/^\d+$/.test(pin)){
      return Promise.reject(new Error('Invalid PIN'));
    }
    var salt = crypto.getRandomValues(new Uint8Array(32));
    return pbkdf2(pin, salt, 310000, 256).then(function(bits){
      var snap = { en: lsGet(K.ENABLED), h: lsGet(K.PIN_HASH), s: lsGet(K.PIN_SALT) };
      var ok = lsSet(K.PIN_HASH, bufToB64(bits)) &&
               lsSet(K.PIN_SALT, bufToB64(salt)) &&
               lsSet(K.ENABLED, '1');
      if(!ok){
        snap.en !== null ? lsSet(K.ENABLED, snap.en) : lsDel(K.ENABLED);
        snap.h !== null ? lsSet(K.PIN_HASH, snap.h) : lsDel(K.PIN_HASH);
        snap.s !== null ? lsSet(K.PIN_SALT, snap.s) : lsDel(K.PIN_SALT);
        throw new Error('Storage write failed');
      }
      lsDel(K.ATTEMPTS);
      lsDel(K.COOLDOWN);
      return true;
    });
  }

  function verifyPin(pin){
    if(!cryptoOk()) return Promise.resolve(false);
    if(typeof pin !== 'string' || pin.length !== PIN_LENGTH) return Promise.resolve(false);
    var hash = lsGet(K.PIN_HASH);
    var salt = lsGet(K.PIN_SALT);
    if(!hash || !salt) return Promise.resolve(false);
    return pbkdf2(pin, new Uint8Array(b64ToBuf(salt)), 310000, 256)
      .then(function(bits){ return bufToB64(bits) === hash; })
      .catch(function(){ return false; });
  }

  function changePin(currentPin, newPin){
    return verifyPin(currentPin).then(function(ok){
      if(!ok) return false;
      return setPin(newPin).then(function(){ return true; });
    });
  }

  function clearPin(){
    [K.ENABLED, K.PIN_HASH, K.PIN_SALT, K.ATTEMPTS, K.COOLDOWN].forEach(lsDel);
  }

  /* ---------- Attempts / Cooldown ---------- */
  function getAttempts(){ return Number(lsGet(K.ATTEMPTS)) || 0; }
  function getCooldownUntil(){ return Number(lsGet(K.COOLDOWN)) || 0; }
  function cooldownRemaining(){
    var ms = getCooldownUntil() - Date.now();
    return ms > 0 ? Math.ceil(ms / 1000) : 0;
  }

  function recordFailure(){
    var n = getAttempts() + 1;
    if(n >= MAX_ATTEMPTS){
      lsSet(K.COOLDOWN, String(Date.now() + COOLDOWN_MS));
      lsDel(K.ATTEMPTS);
      return { cooldownSec: Math.ceil(COOLDOWN_MS / 1000) };
    }
    lsSet(K.ATTEMPTS, String(n));
    return { attempts: n };
  }

  function recordSuccess(){
    lsDel(K.ATTEMPTS);
    lsDel(K.COOLDOWN);
  }

  /* ---------- Idle ---------- */
  function recordActivity(){
    lsSet(K.LAST_ACT, String(Date.now()));
  }

  function isIdle(){
    var s = lsGet(K.LAST_ACT);
    if(!s) return false;
    return (Date.now() - Number(s)) > IDLE_MS;
  }

  /* ---------- AES-GCM encryption ---------- */
  function deriveKey(password, saltBytes){
    var enc = new TextEncoder();
    return crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey'])
      .then(function(base){
        return crypto.subtle.deriveKey(
          { name: 'PBKDF2', salt: saltBytes, iterations: 200000, hash: 'SHA-256' },
          base,
          { name: 'AES-GCM', length: 256 },
          false,
          ['encrypt', 'decrypt']
        );
      });
  }

  function encrypt(plain, password){
    if(!cryptoOk()) return Promise.reject(new Error('Crypto not available'));
    if(typeof password !== 'string' || password.length < 4){
      return Promise.reject(new Error('Password too short'));
    }
    var salt = crypto.getRandomValues(new Uint8Array(16));
    var iv = crypto.getRandomValues(new Uint8Array(12));
    var enc = new TextEncoder();
    var data = enc.encode(JSON.stringify(plain));
    return deriveKey(password, salt).then(function(key){
      return crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, key, data);
    }).then(function(ct){
      return {
        encrypted: true,
        version: 3,
        kdf: 'PBKDF2-SHA256-200k',
        cipher: 'AES-GCM-256',
        salt: bufToB64(salt),
        iv: bufToB64(iv),
        ciphertext: bufToB64(ct),
        createdAt: new Date().toISOString()
      };
    });
  }

  function decrypt(payload, password){
    if(!cryptoOk()) return Promise.reject(new Error('Crypto not available'));
    if(!payload || payload.encrypted !== true) return Promise.reject(new Error('Not an encrypted backup'));
    if(!payload.salt || !payload.iv || !payload.ciphertext){
      return Promise.reject(new Error('Malformed payload'));
    }
    if(typeof password !== 'string' || !password.length){
      return Promise.reject(new Error('Password required'));
    }
    var salt = new Uint8Array(b64ToBuf(payload.salt));
    var iv = new Uint8Array(b64ToBuf(payload.iv));
    return deriveKey(password, salt).then(function(key){
      return crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv }, key, b64ToBuf(payload.ciphertext));
    }).then(function(pt){
      return JSON.parse(new TextDecoder().decode(pt));
    });
  }

  /* ---------- Public API ---------- */
  return {
    PIN_LENGTH: PIN_LENGTH,

    cryptoOk: cryptoOk,

    isPinSet: isPinSet,
    setPin: setPin,
    verifyPin: verifyPin,
    changePin: changePin,
    clearPin: clearPin,

    cooldownRemaining: cooldownRemaining,
    recordFailure: recordFailure,
    recordSuccess: recordSuccess,

    recordActivity: recordActivity,
    isIdle: isIdle,

    encrypt: encrypt,
    decrypt: decrypt
  };
})();