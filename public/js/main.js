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
  // Scroll to top of page (home)
  window.scrollTo({ top: 0, behavior: 'smooth' });
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


// ===== OTP INPUTS - COMPLETE FIX =====
let otpAutoVerifyTimer = null;

function otpMove(el, idx) {
  // Keep only last digit typed
  const val = el.value.replace(/[^0-9]/g, '');
  el.value = val ? val[val.length - 1] : '';
  const inputs = document.querySelectorAll('#twoFAModal .otp-input');
  // Auto move to next
  if (el.value && idx < 5) {
    inputs[idx + 1].focus();
    inputs[idx + 1].select();
  }
  // Auto verify when all filled
  const code = Array.from(inputs).map(i => i.value).join('');
  if (code.length === 6) {
    clearTimeout(otpAutoVerifyTimer);
    otpAutoVerifyTimer = setTimeout(() => verifyOTP(), 300);
  }
}

function otpKey(e, idx) {
  const inputs = document.querySelectorAll('#twoFAModal .otp-input');
  if (e.key === 'Backspace') {
    e.preventDefault();
    if (inputs[idx].value) {
      inputs[idx].value = '';
    } else if (idx > 0) {
      inputs[idx - 1].value = '';
      inputs[idx - 1].focus();
    }
  } else if (e.key === 'ArrowLeft' && idx > 0) {
    e.preventDefault(); inputs[idx - 1].focus();
  } else if (e.key === 'ArrowRight' && idx < 5) {
    e.preventDefault(); inputs[idx + 1].focus();
  } else if (e.key === 'Enter') {
    e.preventDefault(); verifyOTP();
  }
}

function otpPaste(e) {
  e.preventDefault();
  const paste = (e.clipboardData || window.clipboardData).getData('text').replace(/[^0-9]/g,'').slice(0,6);
  const inputs = document.querySelectorAll('#twoFAModal .otp-input');
  paste.split('').forEach((char, i) => { if (inputs[i]) inputs[i].value = char; });
  if (paste.length > 0) inputs[Math.min(paste.length - 1, 5)].focus();
  if (paste.length === 6) {
    clearTimeout(otpAutoVerifyTimer);
    otpAutoVerifyTimer = setTimeout(() => verifyOTP(), 300);
  }
}

// Reset password OTP
function rotpMove(el, idx) {
  const val = el.value.replace(/[^0-9]/g, '');
  el.value = val ? val[val.length - 1] : '';
  const inputs = document.querySelectorAll('#panelReset .otp-input');
  if (el.value && idx < 5) {
    inputs[idx + 1].focus();
    inputs[idx + 1].select();
  }
}

function rotpKey(e, idx) {
  const inputs = document.querySelectorAll('#panelReset .otp-input');
  if (e.key === 'Backspace') {
    e.preventDefault();
    if (inputs[idx].value) {
      inputs[idx].value = '';
    } else if (idx > 0) {
      inputs[idx - 1].value = '';
      inputs[idx - 1].focus();
    }
  } else if (e.key === 'Enter') {
    e.preventDefault(); doResetPassword();
  }
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
  const loginBtn = document.getElementById('sidebarLogin');
  if (loginBtn) loginBtn.textContent = name || 'مستخدم';

  const loginIcon = loginBtn?.closest('.sidebar-link')?.querySelector('.sidebar-link-icon');
  if (loginIcon) loginIcon.textContent = '👤';

  // Show membership ID ONLY to the logged-in user in sidebar
  const loginRow = loginBtn?.closest('.sidebar-link');
  if (loginRow) {
    // Remove old badge if exists
    const oldBadge = document.getElementById('userMemberBadge');
    if (oldBadge) oldBadge.remove();

    if (membershipId) {
      const badge = document.createElement('div');
      badge.id = 'userMemberBadge';
      badge.style.cssText = `
        font-size:.65rem; color:var(--green-light);
        letter-spacing:1px; padding:2px 10px 6px;
        font-family:'Cormorant Garamond',serif;
        opacity:.85;
      `;
      badge.textContent = membershipId;
      loginRow.after(badge);
    }

    // Add logout button
    if (!document.getElementById('logoutBtn')) {
      const logoutBtn = document.createElement('button');
      logoutBtn.id = 'logoutBtn';
      logoutBtn.className = 'sidebar-link logout-btn';
      logoutBtn.innerHTML = `<span class="sidebar-link-icon">🚪</span><span>${isArabic ? 'تسجيل الخروج' : 'Sign Out'}</span>`;
      logoutBtn.onclick = () => {
        localStorage.removeItem('lsu_token');
        localStorage.removeItem('lsu_user');
        location.reload();
      };
      const memberBadge = document.getElementById('userMemberBadge');
      (memberBadge || loginRow).after(logoutBtn);
    }
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

// ===== MISSING FUNCTIONS =====

// Show welcome banner
function showWelcome(name) {
  const old = document.getElementById('welcomeBanner');
  if (old) old.remove();
  const banner = document.createElement('div');
  banner.id = 'welcomeBanner';
  const greeting = isArabic ? `مرحباً، ${name} 👋` : `Welcome, ${name} 👋`;
  banner.innerHTML = `<span>${greeting}</span><button onclick="this.parentElement.remove()">✕</button>`;
  banner.style.cssText = `
    position:fixed;top:76px;left:50%;transform:translateX(-50%);
    background:linear-gradient(135deg,#1a7a2e,#2da644);
    color:#fff;padding:12px 28px;border-radius:30px;z-index:9998;
    font-family:'Tajawal',sans-serif;font-size:1rem;font-weight:700;
    display:flex;align-items:center;gap:14px;
    box-shadow:0 8px 30px rgba(26,122,46,0.45);
    animation:slideDown .4s cubic-bezier(.22,1,.36,1);
  `;
  banner.querySelector('button').style.cssText =
    'background:rgba(255,255,255,.2);border:none;color:#fff;width:26px;height:26px;border-radius:50%;cursor:pointer;font-size:.9rem;';
  document.body.appendChild(banner);
  setTimeout(() => { if (banner.parentElement) banner.remove(); }, 5000);
}

// Verify OTP
async function verifyOTP() {
  const inputs = document.querySelectorAll('#twoFAModal .otp-input');
  const otp = Array.from(inputs).map(i => i.value).join('');
  if (otp.length < 6) return;

  const btn = document.getElementById('tfaVerifyBtn');
  if (btn) { btn.disabled = true; }

  try {
    const res = await fetch(`${API_URL}/api/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: pendingUserId, otp })
    });
    const data = await res.json();
    if (data.success) {
      localStorage.setItem('lsu_token', data.token);
      localStorage.setItem('lsu_user', JSON.stringify(data.user));
      inputs.forEach(i => { i.value = ''; i.style.borderColor = ''; });
      document.getElementById('tfaSuccess').style.display = 'block';
      const userName = data.user?.name || data.user?.firstName || '';
      updateSidebarUser(userName, data.user?.membershipId || '');
      setTimeout(() => enterSite(userName), 1500);
    } else {
      inputs.forEach(i => { i.style.borderColor = '#dc3545'; i.value = ''; });
      inputs[0]?.focus();
      const sub = document.getElementById('tfaSub');
      if (sub) {
        sub.textContent = isArabic ? '❌ الرمز غير صحيح، حاول مجدداً' : '❌ Wrong code, try again';
        sub.style.color = '#dc3545';
        setTimeout(() => { sub.textContent = isArabic ? 'أدخل الرمز المُرسل إلى بريدك الإلكتروني' : 'Enter the code sent to your email'; sub.style.color = ''; }, 3000);
      }
    }
  } catch(e) {
    alert(isArabic ? 'خطأ في الاتصال' : 'Connection error');
  }
  if (btn) btn.disabled = false;
}

// Resend OTP
async function resendOTP() {
  try {
    await fetch(`${API_URL}/api/auth/resend-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: pendingUserId })
    });
    alert(isArabic ? 'تم إعادة إرسال الرمز' : 'Code resent!');
  } catch(e) {}
}

// Toggle language
let isArabic = document.documentElement.lang === 'ar' || true;
function toggleLang() {
  isArabic = !isArabic;
  document.documentElement.lang = isArabic ? 'ar' : 'en';
  document.documentElement.dir = isArabic ? 'rtl' : 'ltr';
  document.body.classList.toggle('ltr', !isArabic);
  applyTranslations();
  const modalLangBtn = document.getElementById('modalLangBtn');
  if (modalLangBtn) modalLangBtn.textContent = isArabic ? 'EN / عربي' : 'عربي / EN';
}

// Committee modal
let currentCommittee = 'media';
function openCommitteeModal(type) {
  currentCommittee = type;
  const icon = document.getElementById('cModalIcon');
  const sub  = document.getElementById('cModalSub');
  const reasonInput = document.getElementById('cReason');
  const reasonLabel = document.getElementById('cml5');
  if (type === 'media') {
    if (icon) icon.textContent = '📸';
    if (sub) sub.textContent = isArabic ? 'لجنة الإعلام والتصوير' : 'Media & Photography Committee';
    if (reasonInput) reasonInput.placeholder = isArabic ? 'أملك خبرة في التصوير والمونتاج والإعلام الرقمي...' : 'I have experience in photography, video editing and digital media...';
    if (reasonLabel) reasonLabel.textContent = isArabic ? 'ما هي خبرتك في الإعلام والتصوير؟' : 'What is your media/photography experience?';
  } else {
    if (icon) icon.textContent = '📋';
    if (sub) sub.textContent = isArabic ? 'لجنة الإشراف والتنظيم' : 'Supervision & Organization Committee';
    if (reasonInput) reasonInput.placeholder = isArabic ? 'أملك خبرة في تنظيم الفعاليات والإشراف والتنسيق...' : 'I have experience in event organization, supervision and coordination...';
    if (reasonLabel) reasonLabel.textContent = isArabic ? 'ما هي خبرتك في التنظيم والإشراف؟' : 'What is your organization/supervision experience?';
  }
  const modal = document.getElementById('committeeModal');
  if (modal) { modal.classList.add('open'); document.getElementById('cSuccessMsg').style.display = 'none'; }
}

function closeCommitteeModal() {
  const modal = document.getElementById('committeeModal');
  if (modal) modal.classList.remove('open');
}

async function submitCommitteeJoin() {
  const fullName  = document.getElementById('cName')?.value;
  const studentId = document.getElementById('cStudentId')?.value;
  const uniMajor  = document.getElementById('cUniMajor')?.value;
  const phone     = document.getElementById('cPhone')?.value;
  const reason    = document.getElementById('cReason')?.value;
  if (!fullName || !phone || !reason) { alert(isArabic ? 'يرجى ملء جميع الحقول' : 'Fill all fields'); return; }

  const btn = document.getElementById('cSubmitBtn');
  if (btn) btn.disabled = true;
  try {
    const res = await fetch(`${API_URL}/api/committees/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName, studentId, uniMajor, phone, reason, committee: currentCommittee })
    });
    const data = await res.json();
    const msg = document.getElementById('cSuccessMsg');
    if (msg) {
      msg.style.display = 'block';
      if (data.success && data.membershipId) {
        msg.innerHTML = `✓ تم إرسال طلبك بنجاح!<br><span style="font-size:1.1rem;font-weight:700;letter-spacing:2px;color:#2da644">${data.membershipId}</span><br><small style="opacity:.8">احتفظ برقم عضويتك</small>`;
        setTimeout(() => closeCommitteeModal(), 4000);
      } else {
        msg.textContent = data.message;
        if (data.success) setTimeout(() => closeCommitteeModal(), 2800);
      }
    }
  } catch(e) { alert(isArabic ? 'خطأ في الاتصال' : 'Connection error'); }
  if (btn) btn.disabled = false;
}

// Sidebar scroll top
function sidebarScrollTop() {
  const sidebar = document.getElementById('sidebar');
  if (sidebar) sidebar.scrollTo({ top: 0, behavior: 'smooth' });
}

// Apply translations
function applyTranslations() {
  const ar = {
    sidebarHome:'الرئيسية', sidebarAbout:'عن الاتحاد', sidebarLeader:'قيادة الاتحاد',
    sidebarCommittees:'اللجان التنفيذية', sidebarGoals:'الأهداف والرسالة', sidebarContact:'تواصل معنا',
    sidebarSec1:'التنقل', sidebarSec2:'الانضمام', sidebarSec3:'الإعدادات',
    sidebarJoin:'إنشاء عضوية', sidebarLogin:'تسجيل الدخول',
    sidebarMediaJoin:'انضم للجنة الإعلام', sidebarOrgJoin:'انضم للجنة الإشراف',
    sidebarThemeText:'الوضع الليلي', sidebarLang:'English',
    sidebarGraduates:'استمارة الخريجين',
    backTop1:'رجوع للأعلى', backTop2:'رجوع للأعلى', backTop3:'رجوع للأعلى',
  };
  const en = {
    sidebarHome:'Home', sidebarAbout:'About', sidebarLeader:'Leadership',
    sidebarCommittees:'Committees', sidebarGoals:'Goals & Mission', sidebarContact:'Contact Us',
    sidebarSec1:'Navigation', sidebarSec2:'Join', sidebarSec3:'Settings',
    sidebarJoin:'Create Membership', sidebarLogin:'Sign In',
    sidebarMediaJoin:'Join Media Committee', sidebarOrgJoin:'Join Organization Committee',
    sidebarThemeText:'Dark Mode', sidebarLang:'عربي',
    sidebarGraduates:'Graduates Form',
    backTop1:'Back to Top', backTop2:'Back to Top', backTop3:'Back to Top',
  };
  const t = isArabic ? ar : en;
  Object.entries(t).forEach(([id, text]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  });
}
