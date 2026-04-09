// ─────────────────────────────────────────────────────────────
// Validación de contraseñas
// ─────────────────────────────────────────────────────────────

/**
 * Valida que la contraseña cumpla todos los requisitos de seguridad.
 * Devuelve el primer mensaje de error encontrado, o null si es válida.
 */
export function validatePassword(password: string): string | null {
  if (!password) return "La contraseña es requerida";
  if (password.length < 8) return "La contraseña debe tener al menos 8 caracteres";
  if (!/[A-Z]/.test(password)) return "La contraseña debe contener al menos una mayúscula";
  if (!/[a-z]/.test(password)) return "La contraseña debe contener al menos una minúscula";
  if (!/[0-9]/.test(password)) return "La contraseña debe contener al menos un número";
  if (!/[!@#$%^&*()\-_=+[\]{};':"\\|,.<>/?`~]/.test(password))
    return "La contraseña debe contener al menos un carácter especial (!@#$%...)";
  return null;
}

// ─────────────────────────────────────────────────────────────
// Validación de correos electrónicos
// ─────────────────────────────────────────────────────────────

/**
 * Regex estricta para validar el formato del correo.
 * Verifica: usuario válido + @ + dominio con al menos un punto + TLD de 2-10 letras.
 */
const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,10}$/;

/**
 * Dominios de correo temporal/desechable conocidos.
 * Esta lista bloquea los proveedores de correo más usados para registros falsos.
 */
const DISPOSABLE_DOMAINS = new Set([
  // Servicios de correo temporal más populares
  "mailinator.com", "guerrillamail.com", "guerrillamail.net", "guerrillamail.org",
  "guerrillamail.de", "guerrillamail.biz", "guerrillamail.info", "guerrillamailblock.com",
  "tempmail.com", "temp-mail.org", "temp-mail.io", "tempmail.net", "tempinbox.com",
  "throwam.com", "throwam.net", "yopmail.com", "yopmail.fr", "yopmail.net",
  "dispostable.com", "discard.email", "discardmail.com", "discardmail.de",
  "mailnull.com", "mailnull.net", "spamgourmet.com", "spamgourmet.net",
  "trashmail.com", "trashmail.me", "trashmail.net", "trashmail.at", "trashmail.io",
  "trashmail.org", "trashmail.xyz", "trash-mail.at", "spam4.me", "spamspot.com",
  "spamfree24.org", "spamoff.de", "spamhereplease.com", "binkmail.com",
  "bob.email", "fakeinbox.com", "fakeinbox.net", "fakemail.fr", "fakedemail.com",
  "maildrop.cc", "mailbox.org", "mailbolt.com", "mailcat.biz", "mailcatch.com",
  "mailexpire.com", "mailfall.com", "mailfreeonline.com", "mailguard.me",
  "mailhazard.com", "mailhazard.us", "mailimate.com", "mailin8r.com",
  "mailinater.com", "mailinator2.com", "mailismagic.com", "mailme.lv",
  "mailme.ir", "mailmetrash.com", "mailmoat.com", "mailnew.com",
  "mailnull.com", "mailpick.biz", "mailrock.biz", "mailscrap.com",
  "mailshell.com", "mailsiphon.com", "mailslite.com", "mailspeed.com",
  "mailtemp.info", "mailtome.de", "mailtothis.com", "mailzilla.com",
  "mailzilla.org", "makemetheking.com", "mt2009.com", "mt2014.com",
  "mt2015.com", "mytempemail.com", "nospam.ze.tc", "nowmymail.com",
  "objectmail.com", "obobbo.com", "odaymail.com", "oneoffemail.com",
  "onewaymail.com", "online.ms", "oopi.org", "owlpic.com",
  "pookmail.com", "powered.name", "privacy.net", "privatdemail.net",
  "proxymail.eu", "punkass.com", "put2.net", "qq.com",
  "recode.me", "recursor.net", "regbypass.com", "regbypass.comu",
  "rhyta.com", "rklips.com", "rmqkr.net", "royal.net",
  "rppkn.com", "rtrtr.com", "s0ny.net", "safe-mail.net",
  "safetypost.de", "saynotospams.com", "sendspamhere.com", "sharklasers.com",
  "shieldedmail.com", "shhmail.com", "shitmail.me", "shitware.nl",
  "shortmail.net", "sibmail.com", "skeefmail.com", "slopsbox.com",
  "slushmail.com", "smashmail.de", "smellfear.com", "smtp99.com",
  "sneakemail.com", "sneakmail.de", "snkmail.com", "sofimail.com",
  "sofort-mail.de", "sogetthis.com", "soodonims.com", "spam.la",
  "spam.org.tr", "spam.su", "spambeater.com", "spambob.com",
  "spambob.net", "spambob.org", "spambog.com", "spambog.de",
  "spambog.ru", "spamcon.org", "spamcorptastic.com", "spamcowboy.com",
  "spamcowboy.net", "spamcowboy.org", "spamday.com", "spamdecoy.net",
  "spamex.com", "spamfree.eu", "spamgoes.in", "spamgourmet.net",
  "spamgourmet.org", "spamherelots.com", "spamhotel.com", "spamify.com",
  "spamkill.info", "spaml.com", "spaml.de", "spammotel.com",
  "spamms.com", "spamoff.de", "spamrecycle.com", "spamrex.com",
  "spamrock.com", "spamsalad.in", "spamslicer.com", "spamstack.net",
  "spamtroll.net", "spamwc.de", "spamwc.net", "spamwc.org",
  "spamz.de", "spamzer.com", "spamzero.com", "spectrads.com",
  "speed.1s.fr", "spoofmail.de", "squizzy.de", "squizzy.eu",
  "squizzy.net", "ssoia.com", "stuffmail.de", "super-auswahl.de",
  "supergreatmail.com", "supermailer.jp", "superrito.com", "superstachel.de",
  "suremail.info", "svk.jp", "sweetxxx.de", "talkinator.com",
  "tapchicuocsong.vn", "techemail.com", "techgroup.me", "teewars.org",
  "teleworm.com", "teleworm.us", "temp.emeraldwebmail.com", "tempalias.com",
  "tempail.com", "tempe.com", "tempemail.biz", "tempemail.co.za",
  "tempemail.com", "tempemail.net", "tempemail.us", "tempemailer.com",
  "tempinbox.co.uk", "tempinbox.net", "tempmail.de", "tempmail.eu",
  "tempmail.it", "tempmail.org", "tempmail.pro", "tempmail.us",
  "tempmail.ws", "tempmail2.com", "tempr.email", "tempsky.com",
  "tempthe.net", "tempymail.com", "thanksnospam.info", "thankyou2010.com",
  "thc.st", "thelimestones.com", "thisisnotmyrealemail.com", "throam.com",
  "throwam.com", "throwam.us", "throwaway.email", "throwam.net",
  "tilien.com", "tittbit.in", "tizi.com", "tmailinator.com",
  "toiea.com", "tokem.co", "tokenmail.de", "top101.de",
  "topletter.com", "topranklist.de", "tormail.net", "tormail.org",
  "trbvm.com", "trialmail.de", "trickmail.net", "trillianpro.com",
  "trioped.com", "twoweirdtricks.com", "tyldd.com",
  "umail.net", "uroid.com", "uu.gl", "valemail.net",
  "venompen.com", "veryrealemail.com", "vidchart.com", "viditag.com",
  "viewcastmedia.com", "viewcastmedia.net", "viewcastmedia.org",
  "viralplays.com", "vmail.me", "vmailing.info", "vmani.com",
  "vp.ycare.de", "vps30.com", "vps911.net", "vubby.com",
  "walala.org", "walkmail.net", "walkmail.ru", "wam.co.za",
  "wangeditor.com", "wanted.de", "watchever.net", "webemail.me",
  "webm4il.info", "weg-werf-email.de", "wegwerf-email.at",
  "wegwerf-email.ch", "wegwerf-email.de", "wegwerf-email.net",
  "wegwerf-email.org", "wegwerfadresse.de", "wegwerfemail.com",
  "wegwerfemail.de", "wegwerfemail.info", "wegwerfemail.net",
  "wegwerfemail.org", "wegwerfmail.de", "wegwerfmail.info", "wegwerfmail.net",
  "wegwerfmail.org", "wegwerfnummer.de", "wetrainbayarea.com",
  "wetrainbayarea.org", "wh4f.org", "whatiaas.com", "whatifnot.com",
  "whatpaas.com", "whatsaas.com", "whyspam.me", "wilemail.com",
  "winemaven.info", "wmail.cf", "wolfsmail.at", "wolfsmail.tk",
  "wombles.com", "woonmail.com", "worldspace.link", "wralawfirm.com",
  "wronghead.com", "wuzupmail.net", "www.e4ward.com", "www.gishpuppy.com",
  "www.mailinator.com", "wwwnew.eu", "xagloo.co", "xagloo.com",
  "xemaps.com", "xents.com", "xmaily.com", "xoxy.net",
  "xpayper.com", "xsmail.com", "xww.ro", "xyzfree.net",
  "yapped.net", "yeah.net", "yep.it", "yogamaven.com",
  "yopmail.gq", "youmail.ga", "yourdomain.com", "ypmail.webarnak.fr.eu.org",
  "yroid.com", "yt-google.com", "z1p.biz", "zadder.com",
  "zehnminuten.de", "zehnminutenmail.com", "zehnminutenmail.de",
  "zippymail.info", "zoaxe.com", "zoemail.net", "zoemail.org",
  "zomg.info", "zxcv.com", "zxcvbnm.com", "zzz.com",
  // Correos comúnmente usados para registros falsos
  "example.com", "example.net", "example.org", "test.com",
  "test.net", "test.org", "fake.com", "fake.net",
  "noemail.com", "noemail.net", "nomail.com", "nomail.net",
  "nomail.ch", "nospam.com", "nospam.net", "notreal.com",
  "notanemail.com", "donotuse.com", "invalid.com",
]);

/**
 * Correcciones de dominios con errores tipográficos comunes.
 */
const DOMAIN_TYPOS: Record<string, string> = {
  "gmial.com":    "gmail.com",
  "gmal.com":     "gmail.com",
  "gmali.com":    "gmail.com",
  "gmaio.com":    "gmail.com",
  "gnail.com":    "gmail.com",
  "gamil.com":    "gmail.com",
  "gemail.com":   "gmail.com",
  "gmaill.com":   "gmail.com",
  "yaho.com":     "yahoo.com",
  "yahooo.com":   "yahoo.com",
  "yhaoo.com":    "yahoo.com",
  "yaoo.com":     "yahoo.com",
  "hotamil.com":  "hotmail.com",
  "hotmial.com":  "hotmail.com",
  "hotmal.com":   "hotmail.com",
  "hotmil.com":   "hotmail.com",
  "hotamail.com": "hotmail.com",
  "outlok.com":   "outlook.com",
  "outloot.com":  "outlook.com",
  "outloook.com": "outlook.com",
  "oulook.com":   "outlook.com",
  "outlookk.com": "outlook.com",
  "iclud.com":    "icloud.com",
  "iclould.com":  "icloud.com",
};

/**
 * Valida el formato y la verosimilitud de un correo electrónico.
 * Devuelve el mensaje de error, o null si el correo parece válido.
 */
export function validateEmail(email: string): string | null {
  const trimmed = email.trim().toLowerCase();

  if (!trimmed) return "El correo electrónico es requerido";

  // 1. Debe contener exactamente un @
  const atCount = (trimmed.match(/@/g) || []).length;
  if (atCount === 0) return "El correo electrónico debe incluir el símbolo @";
  if (atCount > 1)  return "El correo electrónico no puede contener más de un @";

  // 2. Formato general estricto
  if (!EMAIL_REGEX.test(trimmed)) return "El formato del correo electrónico no es válido";

  const [localPart, domain] = trimmed.split("@");

  // 3. La parte local no puede empezar ni terminar con un punto
  if (localPart.startsWith(".") || localPart.endsWith("."))
    return "El correo electrónico no puede empezar ni terminar con un punto antes del @";

  // 4. No puede tener puntos consecutivos
  if (/\.\./.test(trimmed))
    return "El correo electrónico no puede contener puntos consecutivos";

  // 5. El dominio debe tener al menos un punto
  if (!domain.includes("."))
    return "El dominio del correo electrónico no es válido";

  // 6. TLD (parte después del último punto) debe tener entre 2 y 10 letras
  const tld = domain.split(".").pop() || "";
  if (!/^[a-zA-Z]{2,10}$/.test(tld))
    return "El dominio del correo electrónico no es válido (extensión incorrecta)";

  // 7. Detectar errores tipográficos conocidos en el dominio
  if (DOMAIN_TYPOS[domain]) {
    return `¿Quisiste decir ${localPart}@${DOMAIN_TYPOS[domain]}?`;
  }

  // 8. Bloquear dominios de correo desechable / temporal
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return "No se aceptan correos temporales o desechables. Usa un correo real.";
  }

  return null;
}
