// ===== API CONFIG =====
// Change this to your live URL when you deploy
const API_URL = window.location.origin;

// ===== PARTICLES =====
function createParticles() {
  const container = document.getElementById('particles');
  if (!container) return;
  for (let i = 0; i < 18; i++) {
    const p = document.createElement('div');
    p.className = 'p';
    p.style.cssText = `left:${Math.random()*100}%;width:${Math.random()*3+1}px;height:${Math.random()*3+1}px;animation-duration:${Math.random()*12+8}s;animation-delay:${Math.random()*8}s`;
    container.appendChild(p);
  }
}

// ===== THEME =====
let isDark = true;
function toggleTheme() {
  isDark = !isDark;
  document.body.setAttribute('data-theme', isDark ? 'dark' : 'light');
  const icon = isDark ? '🌙' : '☀️';
  // Update all theme buttons
  ['themeBtn','modalThemeBtn'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = icon;
  });
  const sideIcon = document.getElementById('sidebarThemeIcon');
  const sideText = document.getElementById('sidebarThemeText');
  if (sideIcon) sideIcon.textContent = icon;
  if (sideText) sideText.textContent = isDark ? (isArabic ? 'الوضع الليلي' : 'Dark Mode') : (isArabic ? 'الوضع النهاري' : 'Light Mode');
}

// ===== SCROLL =====
window.addEventListener('scroll', () => {
  const scrollTop  = document.documentElement.scrollTop;
  const docHeight  = document.documentElement.scrollHeight - window.innerHeight;
  document.getElementById('scrollBar').style.width = ((scrollTop / docHeight) * 100) + '%';
  const nav = document.getElementById('mainNav');
  if (nav) nav.style.boxShadow = scrollTop > 20 ? '0 4px 30px rgba(0,0,0,0.3)' : '';
  const sections = ['hero','about','leadership','committees','goals','contact'];
  let current = '';
  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el && window.scrollY >= el.offsetTop - 120) current = id;
  });
  document.querySelectorAll('.sidebar-link[href^="#"]').forEach(l => {
    l.classList.toggle('active', l.getAttribute('href') === '#' + current);
  });
});

// ===== SMOOTH SCROLL =====
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const t = document.querySelector(a.getAttribute('href'));
    if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth' }); }
  });
});

// ===== SIDEBAR =====
function openSidebar() {
  const sidebar = document.getElementById('sidebar');
  sidebar.classList.add('open');
  document.getElementById('sidebarOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
  const btn = document.getElementById('hamburgerBtn');
  if (btn) btn.classList.add('is-open');
  // Make navbar solid when sidebar opens
  const nav = document.getElementById('mainNav');
  if (nav) nav.classList.add('sidebar-open');

  // Listen for sidebar scroll to show/hide up arrow
  sidebar.onscroll = function() {
    const arrowDiv = document.getElementById('sidebarScrollTopDiv');
    if (arrowDiv) {
      arrowDiv.style.display = sidebar.scrollTop > 60 ? 'flex' : 'none';
    }
  };
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarOverlay').classList.remove('open');
  document.body.style.overflow = '';
  const btn = document.getElementById('hamburgerBtn');
  if (btn) btn.classList.remove('is-open');
  // Remove solid navbar if not scrolled
  if (window.scrollY <= 20) {
    const nav = document.getElementById('mainNav');
    if (nav) nav.classList.remove('sidebar-open');
  }
}

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  if (sidebar.classList.contains('open')) {
    closeSidebar();
  } else {
    openSidebar();
  }
}

// ===== AUTH MODAL =====
function switchTab(tab) {
  ['panelLogin','panelRegister','panelForgot','panelReset'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('active');
  });
  const panelId = 'panel' + tab.charAt(0).toUpperCase() + tab.slice(1);
  const target = document.getElementById(panelId);
  if (target) target.classList.add('active');
  document.getElementById('btnLogin').classList.toggle('active', tab === 'login');
  document.getElementById('btnReg').classList.toggle('active', tab === 'register');
}
function enterSite(name) {
  document.getElementById('authModal').style.display = 'none';
  document.getElementById('twoFAModal').style.display = 'none';
  if (name) showWelcome(name);
}

function toggleOtherUni(sel) {
  const f = document.getElementById('otherUniField');
  if (f) f.style.display = sel.value === 'other-write' ? 'block' : 'none';
}

// ===== REGISTER (connects to backend) =====
let pendingUserId = null;

async function doRegister() {
  const btn = document.getElementById('btnRegSubmit');
  const pass = document.getElementById('rPass').value;
  const conf = document.getElementById('rPassConf').value;

  if (pass !== conf) { alert(isArabic ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match'); return; }

  const uniSelect = document.getElementById('uniSelect');
  const university = uniSelect?.value === 'other-write'
    ? (document.getElementById('otherUniInput')?.value || '')
    : (uniSelect?.options[uniSelect.selectedIndex]?.text || '');

  const body = {
    firstName:  document.getElementById('rFirst')?.value,
    lastName:   document.getElementById('rLast')?.value,
    email:      document.getElementById('rEmail')?.value,
    password:   pass,
    phone:      document.getElementById('rPhone')?.value,
    studentId:  document.getElementById('rStudID')?.value,
    university,
    major:      document.getElementById('rSpec')?.value,
    year:       document.getElementById('rYear')?.value,
    dob:        document.getElementById('rDOB')?.value,
    nationality: document.getElementById('rNat')?.value,
  };

  if (!body.firstName || !body.email || !body.password || !body.studentId) {
    alert(isArabic ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields');
    return;
  }

  btn.disabled = true;
  btn.textContent = isArabic ? 'جارٍ الإنشاء...' : 'Creating...';

  try {
    const res  = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();

    if (data.success) {
      pendingUserId = data.userId;
      const msg = document.getElementById('successMsg');
      msg.style.display = 'block';
      msg.textContent = isArabic ? '✓ تم الإنشاء! جارٍ إرسال رمز التحقق...' : '✓ Created! Sending OTP...';
      setTimeout(() => show2FA(), 1000);
    } else {
      alert(data.message);
    }
  } catch (err) {
    alert(isArabic ? 'خطأ في الاتصال بالخادم' : 'Connection error. Check server.');
  }

  btn.disabled = false;
  btn.textContent = isArabic ? 'إنشاء العضوية' : 'Create Membership';
}

// ===== LOGIN (connects to backend) =====
async function doLogin() {
  const btn   = document.getElementById('btnLoginSubmit');
  const email = document.getElementById('loginEmail')?.value;
  const pass  = document.getElementById('loginPass')?.value;

  if (!email || !pass) { alert(isArabic ? 'يرجى إدخال البيانات' : 'Please enter your details'); return; }

  btn.disabled = true;
  btn.textContent = isArabic ? 'جارٍ الدخول...' : 'Signing in...';

  try {
    const res  = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pass })
    });
    const data = await res.json();

    if (data.success) {
      if (data.skipOTP) {
        // Session still valid - skip 2FA directly
        localStorage.setItem('lsu_token', data.token);
        localStorage.setItem('lsu_user', JSON.stringify(data.user));
        const userName = data.user?.name || data.user?.firstName || '';
        updateSidebarUser(userName, data.user?.membershipId || '');
        enterSite(userName);
      } else {
        pendingUserId = data.userId;
        show2FA();
      }
    } else {
      alert(data.message);
    }
  } catch (err) {
    alert(isArabic ? 'خطأ في الاتصال بالخادم' : 'Connection error. Check server.');
  }

  btn.disabled = false;
  btn.textContent = isArabic ? 'دخول' : 'Sign In';
}

// ===== 2FA =====
function show2FA() {
  document.getElementById('authModal').style.display   = 'none';
  document.getElementById('twoFAModal').style.display  = 'flex';
  document.getElementById('tfaSuccess').style.display  = 'none';
  document.querySelectorAll('.otp-input').forEach(i => i.value = '');
  document.querySelectorAll('.otp-input')[0]?.focus();
}

let otpAutoVerifyTimer = null;

function otpMove(el, idx) {
  // Keep only single digit
  el.value = el.value.slice(-1).replace(/[^0-9]/g,'');
  if (el.value && idx < 5) {
    document.querySelectorAll('.otp-input')[idx + 1]?.focus();
  }
  // Auto-verify only once when all 6 filled
  const inputs = document.querySelectorAll('.otp-input');
  const code = Array.from(inputs).map(i => i.value).join('');
  if (code.length === 6 && /^[0-9]{6}$/.test(code)) {
    clearTimeout(otpAutoVerifyTimer);
    otpAutoVerifyTimer = setTimeout(() => verifyOTP(), 400);
  }
}

function otpKey(e, idx) {
  const inputs = document.querySelectorAll('.otp-input');
  if (e.key === 'Backspace') {
    inputs[idx].value = '';
    if (idx > 0) inputs[idx - 1]?.focus();
    e.preventDefault();
  } else if (e.key === 'ArrowLeft' && idx > 0) {
    inputs[idx - 1]?.focus();
  } else if (e.key === 'ArrowRight' && idx < 5) {
    inputs[idx + 1]?.focus();
  }
}

function otpPaste(e) {
  e.preventDefault();
  const paste = (e.clipboardData || window.clipboardData).getData('text').replace(/[^0-9]/g,'').slice(0,6);
  const inputs = document.querySelectorAll('.otp-input');
  paste.split('').forEach((char, i) => {
    if (inputs[i]) inputs[i].value = char;
  });
  if (paste.length > 0) inputs[Math.min(paste.length, 5)]?.focus();
  if (paste.length === 6) setTimeout(() => verifyOTP(), 300);
}

async function verifyOTP() {
  const otp = Array.from(document.querySelectorAll('.otp-input')).map(i => i.value).join('');
  if (otp.length < 6) { alert(isArabic ? 'أدخل الرمز كاملاً (6 أرقام)' : 'Enter all 6 digits'); return; }

  const btn = document.getElementById('tfaVerifyBtn');
  btn.disabled = true;
  btn.textContent = isArabic ? 'جارٍ التحقق...' : 'Verifying...';

  try {
    const res  = await fetch(`${API_URL}/api/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: pendingUserId, otp })
    });
    const data = await res.json();

    if (data.success) {
      localStorage.setItem('lsu_token', data.token);
      localStorage.setItem('lsu_user', JSON.stringify(data.user));
      // Clear inputs and show success
      document.querySelectorAll('.otp-input').forEach(i => { i.value=''; i.style.borderColor=''; });
      document.getElementById('tfaSuccess').style.display = 'block';
      const userName = data.user?.name || data.user?.firstName || '';
      updateSidebarUser(userName, data.user?.membershipId || '');
      setTimeout(() => enterSite(userName), 1500);
    } else {
      // Show error on inputs - shake effect, don't alert
      document.querySelectorAll('.otp-input').forEach(i => {
        i.style.borderColor = '#dc3545';
        i.value = '';
      });
      document.querySelectorAll('.otp-input')[0]?.focus();
      // Show inline error instead of alert
      const sub = document.getElementById('tfaSub');
      if (sub) {
        sub.textContent = isArabic ? '❌ الرمز غير صحيح، حاول مجدداً' : '❌ Wrong code, try again';
        sub.style.color = '#dc3545';
        setTimeout(() => {
          sub.textContent = isArabic ? 'أدخل الرمز المُرسل إلى بريدك الإلكتروني' : 'Enter the code sent to your email';
          sub.style.color = '';
        }, 3000);
      }
    }
  } catch (err) {
    alert(isArabic ? 'خطأ في التحقق' : 'Verification error');
  }

  btn.disabled = false;
  btn.textContent = isArabic ? 'تحقق والدخول' : 'Verify & Enter';
}

async function resendOTP() {
  if (!pendingUserId) return;
  try {
    await fetch(`${API_URL}/api/auth/resend-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: pendingUserId })
    });
    alert(isArabic ? 'تم إعادة إرسال الرمز' : 'Code resent!');
  } catch (err) {
    alert(isArabic ? 'خطأ في الإرسال' : 'Send error');
  }
}

// ===== COMMITTEE MODAL (connects to backend) =====
let currentCommittee = '';
function openCommitteeModal(type) {
  currentCommittee = type;
  const icon = document.getElementById('cModalIcon');
  const sub  = document.getElementById('cModalSub');
  icon.textContent = type === 'media' ? '📸' : '📋';
  sub.textContent  = type === 'media'
    ? (isArabic ? 'لجنة الإعلام والتصوير' : 'Media & Photography Committee')
    : (isArabic ? 'لجنة الإشراف والتنظيم' : 'Supervision & Organization Committee');
  document.getElementById('cSuccessMsg').style.display = 'none';
  document.getElementById('committeeModal').classList.add('open');
}
function closeCommitteeModal() {
  document.getElementById('committeeModal').classList.remove('open');
}
document.getElementById('committeeModal').addEventListener('click', function(e) {
  if (e.target === this) closeCommitteeModal();
});

async function submitCommitteeJoin() {
  const btn = document.getElementById('cSubmitBtn');
  btn.disabled = true;
  btn.textContent = isArabic ? 'جارٍ الإرسال...' : 'Sending...';

  const body = {
    fullName:  document.getElementById('cFullName').value,
    studentId: document.getElementById('cStudentId').value,
    uniMajor:  document.getElementById('cUniSpec').value,
    phone:     document.getElementById('cPhone').value,
    reason:    document.getElementById('cReason').value,
    committee: currentCommittee,
  };

  try {
    const res  = await fetch(`${API_URL}/api/committees/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    const msg  = document.getElementById('cSuccessMsg');
    msg.style.display = 'block';
    msg.textContent = data.message;
    if (data.success) setTimeout(() => closeCommitteeModal(), 2800);
  } catch (err) {
    alert(isArabic ? 'خطأ في الإرسال' : 'Send error');
  }

  btn.disabled = false;
  btn.textContent = isArabic ? 'إرسال الطلب' : 'Send Request';
}

// ===== LANGUAGE TOGGLE =====
let isArabic = true;
const T = {
  ar: {
    langBtn:'EN', mTitle:'اتحاد الطلبة الليبيين', mSub:'قبرص التركية · Turkish Cyprus',
    btnLogin:'تسجيل الدخول', btnReg:'عضوية جديدة',
    lEmail:'البريد الإلكتروني / رقم الطالب', lPass:'كلمة المرور',
    lFirst:'الاسم الأول', lLast:'اللقب', lDOB:'تاريخ الميلاد', lNat:'الجنسية',
    lUni:'الجامعة', lSpec:'التخصص', lYear:'السنة الدراسية', lStudID:'رقم الطالب',
    lPhone:'رقم الهاتف', lEmailReg:'البريد الإلكتروني', lPassReg:'كلمة المرور', lPassConf:'تأكيد كلمة المرور',
    btnLoginSubmit:'دخول', btnRegSubmit:'إنشاء العضوية', guestTxt:'أو ', guestLink:'تصفح كزائر',
    tfaTitle:'التحقق من الهوية', tfaSub:'أدخل الرمز المُرسل إلى بريدك الإلكتروني',
    tfaVerifyBtn:'تحقق والدخول', tfaSuccess:'✓ تم التحقق! مرحباً بك 🎉',
    navTitle:'اتحاد الطلبة الليبيين', navSub:'قبرص التركية',
    sidebarLogoText:'اتحاد الطلبة الليبيين', sidebarLogoSub:'قبرص التركية',
    sidebarSec1:'التنقل', sidebarHome:'الرئيسية', sidebarAbout:'عن الاتحاد',
    sidebarLeader:'قيادة الاتحاد', sidebarCommittees:'اللجان التنفيذية',
    sidebarGoals:'الأهداف والرسالة', sidebarContact:'تواصل معنا',
    sidebarSec2:'الانضمام', sidebarJoin:'إنشاء عضوية', sidebarLogin:'تسجيل الدخول',
    sidebarMediaJoin:'انضم للجنة الإعلام', sidebarOrgJoin:'انضم للجنة الإشراف',
    sidebarSec3:'الإعدادات', sidebarThemeText:'الوضع الليلي', sidebarLang:'English', sidebarTopText:'للأعلى', backTop1:'رجوع للأعلى', backTop2:'رجوع للأعلى', backTop3:'رجوع للأعلى',
    heroEyebrow:'منذ التأسيس · Since 2026',
    heroTitle:'اتحاد الطلبة الليبيين\nفي قبرص التركية',
    heroTitleEn:'Libyan Students Union · Turkish Cyprus',
    heroDesc:'منظمة طلابية تجمع أبناء ليبيا الدارسين في قبرص التركية، تسعى إلى خدمة الطالب الليبي وتمثيله وتعزيز التواصل بين أفراد الجالية الطلابية',
    heroCta:'انضم إلى الاتحاد', heroLearn:'اعرف أكثر ↓',
    aboutLabel:'نبذة تعريفية', aboutTitle:'من نحن؟',
    aboutP1:'اتحاد الطلبة الليبيين في قبرص التركية هو منظمة طلابية مستقلة تأسست عام <strong class="highlight">2026</strong>، تُعنى بشؤون الطلاب الليبيين المقيمين والدارسين في مختلف الجامعات بقبرص التركية.',
    aboutP2:'يعمل الاتحاد على تعزيز التواصل بين أفراد الجالية الطلابية الليبية، وتنظيم الفعاليات الثقافية والاجتماعية والرياضية، والتنسيق مع الجهات الليبية والقبرصية.',
    aboutP3:'يؤمن الاتحاد بأن الطالب الليبي المتعلم في الخارج هو سفير لوطنه ولبنة أساسية في مسيرة التنمية الوطنية.',
    statStudents:'طالب مسجل', statUnis:'جامعة شريكة', statYears:'سنة التأسيس', statEvents:'طموح لا حدود له',
    leaderLabel:'الهيكل القيادي', leaderTitle:'قيادة الاتحاد',
    leaderDesc:'يقود الاتحاد نخبة من الطلبة الليبيين المتميزين الملتزمين بخدمة زملائهم',
    presidentBadge:'رئيس الاتحاد', viceBadge:'نائب الرئيس', boardLabel:'مجلس الإدارة',
    r1:'عضو مجلس الإدارة', r2:'عضو مجلس الإدارة', r3:'عضو مجلس الإدارة',
    r4:'عضو مجلس الإدارة', r5:'عضو مجلس الإدارة', r6:'عضو مجلس الإدارة',
    committeesLabel:'لجان الاتحاد', committeesTitle:'اللجان التنفيذية',
    comm1Name:'لجنة الإعلام والتصوير', comm1HeadLabel:'رئيس اللجنة',
    comm1Desc:'تتولى توثيق فعاليات الاتحاد وتغطيتها إعلامياً، وإدارة حسابات التواصل الاجتماعي، وإنتاج المحتوى المرئي والمصور.',
    joinMedia:'📩 انضم إلى لجنة الإعلام',
    comm2Name:'لجنة الإشراف والتنظيم', comm2HeadLabel:'رئيس اللجنة',
    comm2Desc:'تختص بالإشراف على الفعاليات والأنشطة لوجستياً، وضمان سير الأعمال وفق الخطط المرسومة.',
    joinOrg:'📩 انضم إلى لجنة الإشراف',
    cml1:'الاسم الكامل', cml2:'رقم الطالب', cml3:'الجامعة والتخصص', cml4:'رقم الهاتف / واتساب', cml5:'لماذا تريد الانضمام؟',
    cModalTitle:'طلب الانضمام', cSubmitBtn:'إرسال الطلب', cSuccessMsg:'✓ تم إرسال طلبك!',
    goalsLabel:'رسالتنا وأهدافنا', goalsTitle:'ماذا نفعل؟',
    g1t:'الدعم الأكاديمي', g1p:'مساعدة الطلبة في شؤونهم الجامعية من تسجيل ومعادلة وحل مشكلات مع إدارات الجامعات',
    g2t:'التواصل والتلاحم', g2p:'بناء شبكة اجتماعية قوية تجمع الطلبة الليبيين وتعزز الروابط بينهم بعيداً عن الغربة',
    g3t:'الخدمات الإدارية', g3p:'التنسيق مع الجهات الحكومية الليبية والقبرصية لإنجاز المعاملات الرسمية',
    g4t:'الأنشطة الثقافية', g4p:'تنظيم البطولات الرياضية والفعاليات الثقافية التي تُبرز الهوية الليبية',
    g5t:'التطوير والتدريب', g5p:'إقامة ورش العمل والدورات التدريبية لتطوير مهارات الطلبة',
    g6t:'التمثيل والمناصرة', g6p:'تمثيل مصالح الطلبة الليبيين أمام الجهات الرسمية والدولية',
    contactLabel:'تواصل معنا', contactTitle:'نحن هنا من أجلك',
    contactDesc:'لا تتردد في التواصل معنا لأي استفسار أو طلب مساعدة',
    cEmail:'البريد الإلكتروني', cWhatsapp:'واتساب', cSocial:'إنستقرام', cLocation:'الموقع',
    fAbout:'عن الاتحاد', fLeader:'القيادة', fComm:'اللجان', fContact:'تواصل',
    footerText:'© 2026 اتحاد الطلبة الليبيين في قبرص التركية · جميع الحقوق محفوظة', forgotLink:'نسيت كلمة المرور؟', backBtnText:'رجوع', tfaBackText:'رجوع', forgotDesc:'أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة تعيين كلمة المرور', lForgotEmail:'البريد الإلكتروني', btnForgotSubmit:'إرسال رابط الإعادة'
  },
  en: {
    langBtn:'AR', mTitle:'Libyan Students Union', mSub:'Turkish Cyprus · قبرص التركية',
    btnLogin:'Sign In', btnReg:'New Membership',
    lEmail:'Email / Student ID', lPass:'Password',
    lFirst:'First Name', lLast:'Last Name', lDOB:'Date of Birth', lNat:'Nationality',
    lUni:'University', lSpec:'Major', lYear:'Academic Year', lStudID:'Student ID',
    lPhone:'Phone Number', lEmailReg:'Email Address', lPassReg:'Password', lPassConf:'Confirm Password',
    btnLoginSubmit:'Sign In', btnRegSubmit:'Create Membership', guestTxt:'or ', guestLink:'Browse as Guest',
    tfaTitle:'Identity Verification', tfaSub:'Enter the code sent to your email',
    tfaVerifyBtn:'Verify & Enter', tfaSuccess:'✓ Verified! Welcome 🎉',
    navTitle:'Libyan Students Union', navSub:'Turkish Cyprus',
    sidebarLogoText:'Libyan Students Union', sidebarLogoSub:'Turkish Cyprus',
    sidebarSec1:'Navigation', sidebarHome:'Home', sidebarAbout:'About the Union',
    sidebarLeader:'Union Leadership', sidebarCommittees:'Committees',
    sidebarGoals:'Goals & Mission', sidebarContact:'Contact Us',
    sidebarSec2:'Join', sidebarJoin:'Create Membership', sidebarLogin:'Sign In',
    sidebarMediaJoin:'Join Media Committee', sidebarOrgJoin:'Join Organization Committee',
    sidebarSec3:'Settings', sidebarThemeText:'Dark Mode', sidebarLang:'عربي', sidebarTopText:'To Top', backTop1:'Back to Top', backTop2:'Back to Top', backTop3:'Back to Top',
    heroEyebrow:'Since Foundation · 2026',
    heroTitle:'Libyan Students Union\nin Turkish Cyprus',
    heroTitleEn:'اتحاد الطلبة الليبيين · قبرص التركية',
    heroDesc:'A student organization uniting Libyan students in Turkish Cyprus, dedicated to serving, representing and connecting the Libyan student community.',
    heroCta:'Join the Union', heroLearn:'Learn More ↓',
    aboutLabel:'About Us', aboutTitle:'Who Are We?',
    aboutP1:'The Libyan Students Union in Turkish Cyprus is an independent student organization founded in <strong class="highlight">2026</strong>, dedicated to the affairs of Libyan students studying at universities across Turkish Cyprus.',
    aboutP2:'The Union works to strengthen communication within the Libyan student community, organize cultural, social and sports events.',
    aboutP3:'The Union believes that a Libyan student educated abroad is an ambassador for their homeland and a cornerstone of national development.',
    statStudents:'Registered Students', statUnis:'Partner Universities', statYears:'Founded', statEvents:'Unlimited Ambition',
    leaderLabel:'Leadership Structure', leaderTitle:'Union Leadership',
    leaderDesc:'The Union is led by distinguished Libyan students committed to serving their peers.',
    presidentBadge:'Union President', viceBadge:'Vice President', boardLabel:'Board of Directors',
    r1:'Board Member', r2:'Board Member', r3:'Board Member', r4:'Board Member', r5:'Board Member', r6:'Board Member',
    committeesLabel:'Union Committees', committeesTitle:'Executive Committees',
    comm1Name:'Media & Photography Committee', comm1HeadLabel:'Committee Head',
    comm1Desc:'Handles documenting Union events, managing social media accounts, and producing visual content.',
    joinMedia:'📩 Join Media Committee',
    comm2Name:'Supervision & Organization Committee', comm2HeadLabel:'Committee Head',
    comm2Desc:'Oversees events and activities logistically, ensures operations run according to plan.',
    joinOrg:'📩 Join Organization Committee',
    cml1:'Full Name', cml2:'Student ID', cml3:'University & Major', cml4:'Phone / WhatsApp', cml5:'Why do you want to join?',
    cModalTitle:'Join Request', cSubmitBtn:'Send Request', cSuccessMsg:'✓ Request sent successfully!',
    goalsLabel:'Our Mission & Goals', goalsTitle:'What We Do',
    g1t:'Academic Support', g1p:'Helping students with registration, credit transfers, and resolving academic issues.',
    g2t:'Community & Connection', g2p:'Building a strong social network connecting Libyan students.',
    g3t:'Administrative Services', g3p:'Coordinating with Libyan and Cypriot authorities for official transactions.',
    g4t:'Cultural Events', g4p:'Organizing sports tournaments and cultural events that showcase Libyan identity.',
    g5t:'Development & Training', g5p:'Hosting workshops and training courses to develop student skills.',
    g6t:'Representation & Advocacy', g6p:'Representing Libyan student interests before official and international bodies.',
    contactLabel:'Contact Us', contactTitle:'We Are Here For You',
    contactDesc:'Do not hesitate to reach out for any inquiry or assistance.',
    cEmail:'Email', cWhatsapp:'WhatsApp', cSocial:'Instagram', cLocation:'Location',
    fAbout:'About', fLeader:'Leadership', fComm:'Committees', fContact:'Contact',
    footerText:'© 2026 Libyan Students Union in Turkish Cyprus · All Rights Reserved', forgotLink:'Forgot Password?', backBtnText:'Back', tfaBackText:'Back', forgotDesc:'Enter your email and we will send you a password reset link', lForgotEmail:'Email Address', btnForgotSubmit:'Send Reset Link'
  }
};

function toggleLang() {
  isArabic = !isArabic;
  const lang = isArabic ? 'ar' : 'en';
  const t = T[lang];
  document.documentElement.lang = lang;
  document.documentElement.dir = isArabic ? 'rtl' : 'ltr';
  document.body.classList.toggle('ltr', !isArabic);
  Object.keys(t).forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    if (['heroTitle','aboutP1','aboutP2','aboutP3'].includes(id)) el.innerHTML = t[id].replace('\n','<br>');
    else el.textContent = t[id];
  });
  const styleEl = document.getElementById('dynLangStyle') || (() => {
    const s = document.createElement('style'); s.id = 'dynLangStyle'; document.head.appendChild(s); return s;
  })();
  styleEl.textContent = isArabic
    ? `.sidebar{right:-310px;left:auto}.sidebar.open{right:0;left:auto}.sidebar-link{text-align:right}.sidebar-link::before{right:0;left:auto}`
    : `.sidebar{left:-310px;right:auto}.sidebar.open{left:0;right:auto}.sidebar-link{text-align:left}.sidebar-link::before{left:0;right:auto}`;

  // Update modal lang button
  const modalLangBtn = document.getElementById('modalLangBtn');
  if (modalLangBtn) modalLangBtn.textContent = isArabic ? 'EN / عربي' : 'عربي / EN';

  // Update modal theme button
  const modalThemeBtn = document.getElementById('modalThemeBtn');
  if (modalThemeBtn) modalThemeBtn.textContent = isDark ? '🌙' : '☀️';
}

// ===== INTERSECTION OBSERVER =====
const obs = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.08 });
document.querySelectorAll('.goal-card,.board-card,.leader-card,.stat-card,.committee-card,.contact-card').forEach(el => {
  el.classList.add('fade-in'); obs.observe(el);
});



// ===== WELCOME BANNER =====
function showWelcome(name) {
  // Remove existing banner
  const old = document.getElementById('welcomeBanner');
  if (old) old.remove();

  const banner = document.createElement('div');
  banner.id = 'welcomeBanner';
  const greeting = isArabic ? `مرحباً، ${name} 👋` : `Welcome, ${name} 👋`;
  banner.innerHTML = `<span>${greeting}</span><button onclick="this.parentElement.remove()">✕</button>`;
  banner.style.cssText = `
    position:fixed; top:76px; left:50%; transform:translateX(-50%);
    background:linear-gradient(135deg,#1a7a2e,#2da644);
    color:#fff; padding:12px 28px; border-radius:30px; z-index:9998;
    font-family:'Tajawal',sans-serif; font-size:1rem; font-weight:700;
    display:flex; align-items:center; gap:14px;
    box-shadow:0 8px 30px rgba(26,122,46,0.45);
    animation:slideDown .4s cubic-bezier(.22,1,.36,1);
  `;
  banner.querySelector('button').style.cssText = 
    'background:rgba(255,255,255,.2);border:none;color:#fff;width:26px;height:26px;border-radius:50%;cursor:pointer;font-size:.9rem;';
  document.body.appendChild(banner);
  setTimeout(() => { if(banner.parentElement) banner.remove(); }, 5000);
}



// ===== SIDEBAR SCROLL TO TOP =====
function sidebarScrollTop() {
  const sidebar = document.getElementById('sidebar');
  if (sidebar) sidebar.scrollTo({ top: 0, behavior: 'smooth' });
}


// ===== PASSWORD VISIBILITY TOGGLE =====
function togglePass(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  if (input.type === 'password') {
    input.type = 'text';
    btn.textContent = '🙈';
    btn.classList.add('active');
  } else {
    input.type = 'password';
    btn.textContent = '👁';
    btn.classList.remove('active');
  }
}

// ===== SCROLL TO TOP =====
function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Show/hide scroll-to-top button
window.addEventListener('scroll', () => {
  const btn = document.getElementById('scrollTopBtn');
  if (btn) {
    if (window.scrollY > 300) {
      btn.classList.add('visible');
    } else {
      btn.classList.remove('visible');
    }
  }
}, { passive: true });



// ===== UPDATE SIDEBAR AFTER LOGIN =====
function updateSidebarUser(name, membershipId) {
  // Change "Sign In" button to user name
  const loginBtn = document.getElementById('sidebarLogin');
  if (loginBtn) {
    loginBtn.textContent = name || 'مستخدم';
  }
  // Change icon
  const loginIcon = loginBtn?.closest('.sidebar-link')?.querySelector('.sidebar-link-icon');
  if (loginIcon) loginIcon.textContent = '👤';

  // Add membership badge if exists
  if (membershipId) {
    const badge = document.createElement('small');
    badge.style.cssText = 'display:block;font-size:.65rem;color:var(--green-light);letter-spacing:.5px;margin-top:2px;';
    badge.textContent = membershipId;
    const loginBtnEl = document.getElementById('sidebarLogin');
    if (loginBtnEl && !loginBtnEl.nextSibling?.tagName === 'SMALL') {
      loginBtnEl.after(badge);
    }
  }

  // Add logout button after sign-in
  const sidebarLogin = document.getElementById('sidebarLogin');
  const loginRow = sidebarLogin?.closest('.sidebar-link');
  if (loginRow && !document.getElementById('logoutBtn')) {
    const logoutBtn = document.createElement('button');
    logoutBtn.id = 'logoutBtn';
    logoutBtn.className = 'sidebar-link logout-btn';
    logoutBtn.innerHTML = `<span class="sidebar-link-icon">🚪</span><span>${isArabic ? 'تسجيل الخروج' : 'Sign Out'}</span>`;
    logoutBtn.onclick = () => {
      localStorage.removeItem('lsu_token');
      localStorage.removeItem('lsu_user');
      location.reload();
    };
    loginRow.after(logoutBtn);
  }
}

// Check if user already logged in on page load
function checkLoggedInUser() {
  const userStr = localStorage.getItem('lsu_user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      const name = user?.name || user?.firstName || '';
      if (name) updateSidebarUser(name, user?.membershipId || '');
    } catch(e) {}
  }
}

// ===== CLOSE ALL ACCORDIONS & GO TO TOP =====
function closeAllAcc() {
  [1,2,3].forEach(n => {
    const b = document.getElementById('acc'+n+'-body');
    const a = document.getElementById('acc'+n+'-arrow');
    if (b) b.classList.remove('open');
    if (a) a.classList.remove('rotated');
  });
  // Scroll sidebar to top
  const sidebar = document.getElementById('sidebar');
  if (sidebar) sidebar.scrollTo({ top: 0, behavior: 'smooth' });
}


// ===== FORGOT PASSWORD =====
function showForgotPanel() {
  document.getElementById('panelLogin').classList.remove('active');
  document.getElementById('panelForgot').classList.add('active');
  document.getElementById('btnLogin').classList.remove('active');
}

let resetUserId = null;

async function doForgotPassword() {
  const email = document.getElementById('forgotEmail')?.value;
  if (!email) { alert(isArabic ? 'أدخل بريدك الإلكتروني' : 'Enter your email'); return; }

  const btn = document.getElementById('btnForgotSubmit');
  btn.disabled = true;
  btn.textContent = isArabic ? 'جارٍ الإرسال...' : 'Sending...';

  try {
    const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await res.json();

    if (data.userId) resetUserId = data.userId;

    // Show success message with button to enter code
    const msg = document.getElementById('forgotSuccess');
    msg.style.display = 'block';
    msg.innerHTML = isArabic
      ? '✓ تم إرسال الرمز! <a onclick="showResetPanel()" style="color:#fff;font-weight:700;cursor:pointer;text-decoration:underline">اضغط هنا لإدخال الرمز ←</a>'
      : '✓ Code sent! <a onclick="showResetPanel()" style="color:#fff;font-weight:700;cursor:pointer;text-decoration:underline">Click here to enter code ←</a>';

    // Auto switch after 2s
    setTimeout(() => showResetPanel(), 2000);

  } catch(e) {
    alert(isArabic ? 'خطأ في الاتصال' : 'Connection error');
  }

  btn.disabled = false;
  btn.textContent = isArabic ? 'إرسال رابط الإعادة' : 'Send Reset Link';
}

// Reset OTP input handlers
function showResetPanel() {
  ['panelLogin','panelRegister','panelForgot','panelReset'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('active');
  });
  const panel = document.getElementById('panelReset');
  if (panel) panel.classList.add('active');
  document.getElementById('btnLogin').classList.remove('active');
  document.getElementById('btnReg').classList.remove('active');
  document.querySelectorAll('#panelReset .otp-input').forEach(i => i.value = '');
  setTimeout(() => document.getElementById('rotp1')?.focus(), 100);
}

function rotpMove(el, idx) {
  el.value = el.value.slice(-1).replace(/[^0-9]/g,'');
  if (el.value && idx < 5) {
    document.querySelectorAll('#panelReset .otp-input')[idx + 1]?.focus();
  }
}
function rotpKey(e, idx) {
  const inputs = document.querySelectorAll('#panelReset .otp-input');
  if (e.key === 'Backspace') {
    inputs[idx].value = '';
    if (idx > 0) inputs[idx-1]?.focus();
    e.preventDefault();
  }
}

async function doResetPassword() {
  const inputs = document.querySelectorAll('#panelReset .otp-input');
  const otp = Array.from(inputs).map(i => i.value).join('');
  const newPass = document.getElementById('newPass')?.value;
  const newPassConf = document.getElementById('newPassConf')?.value;

  if (otp.length < 6) { alert(isArabic ? 'أدخل الرمز كاملاً (6 أرقام)' : 'Enter the full 6-digit code'); return; }
  if (!newPass || newPass.length < 6) { alert(isArabic ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters'); return; }
  if (newPass !== newPassConf) { alert(isArabic ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match'); return; }

  if (!resetUserId) {
    alert(isArabic ? 'حدث خطأ، يرجى طلب رمز جديد' : 'Error occurred, please request a new code');
    switchTab('login');
    showForgotPanel();
    return;
  }

  console.log('🔑 Resetting with userId:', resetUserId, 'OTP:', otp);

  const btn = document.getElementById('btnResetSubmit');
  btn.disabled = true;
  btn.textContent = isArabic ? 'جارٍ التغيير...' : 'Changing...';

  try {
    const res = await fetch(`${API_URL}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: resetUserId, otp, newPassword: newPass })
    });
    const data = await res.json();

    if (data.success) {
      const msg = document.getElementById('resetSuccess');
      msg.style.display = 'block';
      setTimeout(() => {
        switchTab('login');
        msg.style.display = 'none';
      }, 2500);
    } else {
      alert(data.message);
    }
  } catch(e) {
    alert(isArabic ? 'خطأ في الاتصال' : 'Connection error');
  }

  btn.disabled = false;
  btn.textContent = isArabic ? 'تغيير كلمة المرور' : 'Change Password';
}

// ===== BACK FROM 2FA =====
function backFromTFA() {
  document.getElementById('twoFAModal').style.display = 'none';
  document.getElementById('authModal').style.display = 'flex';
  switchTab('login');
}

// ===== ACCORDION SIDEBAR =====
function toggleAcc(num) {
  const body  = document.getElementById('acc'+num+'-body');
  const arrow = document.getElementById('acc'+num+'-arrow');
  if (!body) return;
  const isOpen = body.classList.contains('open');

  // Close all
  [1,2,3].forEach(n => {
    const b = document.getElementById('acc'+n+'-body');
    const a = document.getElementById('acc'+n+'-arrow');
    if (b) b.classList.remove('open');
    if (a) a.classList.remove('rotated');
  });

  // Open clicked if was closed
  if (!isOpen) {
    body.classList.add('open');
    arrow.classList.add('rotated');

    setTimeout(() => {
      // Scroll sidebar to show new content
      const header = document.getElementById('acc'+num);
      const sidebar = document.getElementById('sidebar');
      if (header && sidebar) {
        sidebar.scrollTo({ top: header.offsetTop - 10, behavior: 'smooth' });
      }
      // Scroll MAIN PAGE down so content below sidebar is visible
      const bodyHeight = body.scrollHeight;
      const currentScroll = window.scrollY;
      window.scrollTo({ top: currentScroll + Math.min(bodyHeight, 200), behavior: 'smooth' });

      // Show up arrow
      const arrowDiv = document.getElementById('sidebarScrollTopDiv');
      if (arrowDiv) arrowDiv.style.display = 'flex';
    }, 100);

  } else {
    // Closed - scroll sidebar back to top, page scrolls up a bit
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.scrollTo({ top: 0, behavior: 'smooth' });
    window.scrollTo({ top: Math.max(0, window.scrollY - 150), behavior: 'smooth' });
  }
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => { createParticles(); checkLoggedInUser(); });
