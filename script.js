// Initialize Stripe (Replace with your actual publishable key)
const stripePublicKey = 'pk_test_YOUR_PUBLISHABLE_KEY_HERE';
let stripe = null;
let elements = null;
let cardElement = null;

// Initialize Stripe when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initStripe();
    setupMobileMenu();
    checkUserAccess();
    setupNavbarScroll();
});

// Navbar scroll effect
function setupNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
}

// Stripe Initialization
function initStripe() {
    if (typeof Stripe !== 'undefined') {
        stripe = Stripe(stripePublicKey);
        elements = stripe.elements();
        cardElement = elements.create('card', {
            style: {
                base: {
                    color: '#ffffff',
                    fontFamily: '"Inter", sans-serif',
                    fontSize: '16px',
                    '::placeholder': {
                        color: '#c0c0c0'
                    }
                },
                danger: {
                    color: '#fa755a'
                }
            }
        });
    }
}

// Modal Management
function openLoginModal() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser) {
        openDashboard();
        return;
    }
    document.getElementById('loginModal').classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeLoginModal() {
    document.getElementById('loginModal').classList.remove('show');
    document.body.style.overflow = 'auto';
}

function openSignupModal() {
    closeLoginModal();
    alert('Signup functionality would be integrated with your backend here.');
}

function openPaymentModal(courseName, coursePrice) {
    const modal = document.getElementById('paymentModal');
    document.getElementById('paymentTitle').textContent = `Unlock ${courseName}`;
    document.getElementById('courseNameDisplay').innerHTML = `<strong>Course:</strong> ${courseName}`;
    document.getElementById('coursePriceDisplay').innerHTML = `<strong>Investment:</strong> ₹${coursePrice.toLocaleString('en-IN')}`;
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
    
    if (cardElement && !cardElement.mounted) {
        cardElement.mount('#card-element');
        cardElement.mounted = true;
    }
}

function closePaymentModal() {
    document.getElementById('paymentModal').classList.remove('show');
    document.body.style.overflow = 'auto';
}

function openDashboard() {
    const modal = document.getElementById('dashboardModal');
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
    loadDashboard();
}

function closeDashboard() {
    document.getElementById('dashboardModal').classList.remove('show');
    document.body.style.overflow = 'auto';
}

// Close modal when clicking outside
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.classList.remove('show');
        document.body.style.overflow = 'auto';
    }
}

// Course Selection
function selectCourse(courseName, coursePrice) {
    // Redirect to the elite checkout page with parameters
    const encodedName = encodeURIComponent(courseName);
    window.location.href = `checkout.html?course=${encodedName}&price=${coursePrice}`;
}

// Check for return from checkout
document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('action') === 'dashboard') {
        setTimeout(openDashboard, 1000);
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    initStripe();
    setupMobileMenu();
    checkUserAccess();
    setupNavbarScroll();
});

// Payment Processing
async function processPayment(event) {
    event.preventDefault();
    
    const customerName = document.getElementById('customerName').value;
    const customerEmail = document.getElementById('customerEmail').value;
    const payBtn = document.getElementById('payBtn');
    
    if (!customerName || !customerEmail) {
        showNotification('error', 'Please fill in all security fields.');
        return;
    }
    
    payBtn.disabled = true;
    payBtn.textContent = 'SECURELY PROCESSING...';
    
    try {
        // Simulated premium processing
        await new Promise(resolve => setTimeout(resolve, 2500));
        
        saveCourseAccess(customerName, customerEmail, selectedCourseData);
        showNotification('success', 'Access Granted. Welcome to the Elite Level.');
        
        closePaymentModal();
        setTimeout(() => openDashboard(), 800);
        
    } catch (error) {
        showNotification('error', `Transaction Failed: ${error.message}`);
    } finally {
        payBtn.disabled = false;
        payBtn.textContent = 'Pay Now';
    }
}

function saveCourseAccess(name, email, course) {
    const purchaseData = {
        studentName: name,
        studentEmail: email,
        courseName: course.name,
        coursePrice: course.price,
        purchaseDate: new Date().toISOString(),
        expirationDate: calculateExpirationDate(),
        accessStatus: 'active',
        id: Math.random().toString(36).substr(2, 9).toUpperCase()
    };
    
    let courses = JSON.parse(localStorage.getItem('purchasedCourses')) || [];
    courses.push(purchaseData);
    localStorage.setItem('purchasedCourses', JSON.stringify(courses));
    localStorage.setItem('currentUser', JSON.stringify({ name, email }));
}

function calculateExpirationDate() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 6, now.getDate()).toISOString();
}

function checkCourseExpiration(course) {
    const expirationDate = new Date(course.expirationDate);
    const now = new Date();
    const isExpired = now > expirationDate;
    const daysRemaining = Math.max(0, Math.ceil((expirationDate - now) / (1000 * 60 * 60 * 24)));
    
    return { isExpired, daysRemaining };
}

function checkUserAccess() {
    const courses = JSON.parse(localStorage.getItem('purchasedCourses')) || [];
    const updated = courses.map(course => {
        const { isExpired } = checkCourseExpiration(course);
        return { ...course, accessStatus: isExpired ? 'expired' : 'active' };
    });
    localStorage.setItem('purchasedCourses', JSON.stringify(updated));
}

function loadDashboard() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const courses = JSON.parse(localStorage.getItem('purchasedCourses')) || [];
    
    if (!currentUser) return;

    renderActiveCourses(courses);
    renderLiveSessions();
    renderProgress(courses);
}

function renderActiveCourses(courses) {
    const container = document.getElementById('activeCourses');
    container.innerHTML = '';
    
    if (courses.length === 0) {
        container.innerHTML = '<div class="premium-empty-state" style="padding: 4rem; text-align: center; background: rgba(255,255,255,0.02); border-radius: 12px; border: 1px dashed var(--glass-border);"><i class="fas fa-terminal" style="font-size: 3rem; color: var(--accent-gold); margin-bottom: 2rem;"></i><p>Welcome, Investor. Your portfolio is currently empty.</p><button class="auth-btn" style="margin-top: 2rem;" onclick="closeDashboard()">AQUIRE ELITE KNOWLEDGE</button></div>';
        return;
    }
    
    courses.forEach(course => {
        const { isExpired, daysRemaining } = checkCourseExpiration(course);
        const card = document.createElement('div');
        card.className = 'course-access-card';
        card.style.cssText = 'background: linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0.5) 100%); border: 1px solid var(--glass-border); padding: 2.5rem; margin-bottom: 2rem; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; isolation: isolate;';
        
        card.innerHTML = `
            <div class="course-info">
                <span style="font-size: 0.7rem; color: var(--accent-gold); letter-spacing: 2px; text-transform: uppercase;">License Type: Premium</span>
                <h4 style="font-size: 1.5rem; margin: 0.5rem 0 1rem;">${course.courseName}</h4>
                <div style="display: flex; gap: 2rem; font-size: 0.85rem;">
                    <p><i class="fas fa-lock-open" style="color: var(--success-green);"></i> Status: <span style="color: ${isExpired ? '#fa5252' : 'var(--success-green)'}">${isExpired ? 'EXPIRED' : 'ACTIVE'}</span></p>
                    <p><i class="fas fa-clock" style="color: var(--accent-gold);"></i> ${daysRemaining} Days Left</p>
                </div>
            </div>
            <div class="course-actions" style="display: flex; flex-direction: column; gap: 1rem; align-items: flex-end;">
                ${isExpired ? 
                    '<button class="course-btn" style="background: rgba(250, 82, 82, 0.1); border-color: #fa5252; color: #fa5252;" onclick="scrollToSection(\'#courses\')">RENEW ACCESS</button>' : 
                    `<button class="auth-btn cta-btn-premium" onclick="accessCourse('${course.courseName}')">ENTER CLASSROOM</button>
                     <a href="#" style="font-size: 0.7rem; color: var(--text-silver); text-decoration: none;" onclick="generateInvoice('${course.id}')"><i class="fas fa-file-invoice"></i> VIEW INVOICE</a>`
                }
            </div>
        `;
        container.appendChild(card);
    });
}

function generateInvoice(id) {
    showNotification('success', `Generating Secure Invoice ${id}...`);
    setTimeout(() => {
        alert(`Elite Invoice #${id}\nStatus: PAID\nDate: ${new Date().toLocaleDateString()}\nJ Traders Global Group`);
    }, 1000);
}

function renderLiveSessions() {
    const container = document.getElementById('upcomingSessions');
    container.innerHTML = `
        <div class="session-card" style="background: rgba(0, 217, 142, 0.03); border: 1px solid var(--success-green); padding: 3rem; border-radius: 12px; margin-bottom: 2rem;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem;">
                <span class="session-time" style="color: var(--success-green); background: rgba(0, 217, 142, 0.1); padding: 0.5rem 1rem; border-radius: 4px;">RECORDED VAULT</span>
                <i class="fas fa-play-circle" style="color: var(--success-green);"></i>
            </div>
            <h3>PRE-RECORDED ALPHA RECAP</h3>
            <p style="color: var(--text-silver); margin-bottom: 2rem;">Access the deep dive into liquidity pools and institutional order blocks from our elite strategy archives.</p>
            <button class="auth-btn" style="width: 100%; border: 1px solid var(--success-green); background: transparent; color: var(--success-green);">WATCH NOW</button>
        </div>
    `;
}

function renderProgress(courses) {
    const container = document.getElementById('progressContent');
    const active = courses.filter(c => !checkCourseExpiration(c).isExpired).length;
    const total = courses.length;
    const percent = total > 0 ? Math.floor((active / total) * 100) : 0;
    
    container.innerHTML = `
        <div class="risk-item" style="margin-top: 1rem; border: 1px solid var(--accent-gold); background: linear-gradient(135deg, rgba(212, 175, 55, 0.05) 0%, transparent 100%);">
            <div class="risk-icon" style="color: var(--accent-gold);"><i class="fas fa-vault"></i></div>
            <h3 style="font-family: 'Outfit', sans-serif;">KNOWLEDGE ASSET VALUE</h3>
            <div style="width: 100%; height: 8px; background: rgba(255, 255, 255, 0.05); border-radius: 10px; margin: 2rem 0; overflow: hidden;">
                <div style="width: ${percent}%; height: 100%; background: var(--gold-gradient); box-shadow: 0 0 15px var(--accent-gold);"></div>
            </div>
            <p>Your institutional learning bandwidth is ${percent}% utilized. You have ${total} acquired licenses.</p>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-top: 2rem;">
            <div style="padding: 2rem; border: 1px solid var(--glass-border); border-radius: 8px; text-align: center;">
                <h5 style="color: var(--accent-gold); font-size: 0.7rem; text-transform: uppercase;">Trade Alerts</h5>
                <p style="font-size: 2rem; font-weight: 700;">842</p>
            </div>
            <div style="padding: 2rem; border: 1px solid var(--success-green); border-radius: 8px; text-align: center;">
                <h5 style="color: var(--success-green); font-size: 0.7rem; text-transform: uppercase;">Live Desk Hours</h5>
                <p style="font-size: 2rem; font-weight: 700;">48h</p>
            </div>
        </div>
    `;
}

function accessCourse(name) {
    showNotification('success', `Accessing ${name} high-security server...`);
}

function handleLogin(event) {
    event.preventDefault();
    const email = event.target.querySelector('input[type="email"]').value;
    localStorage.setItem('currentUser', JSON.stringify({ name: email.split('@')[0], email }));
    closeLoginModal();
    openDashboard();
}

function showNotification(type, message) {
    const note = document.createElement('div');
    note.className = `notification ${type}`;
    note.style.cssText = `
        position: fixed; top: 30px; right: 30px; padding: 1.5rem 2.5rem;
        background: ${type === 'success' ? 'var(--gold-gradient)' : '#fa5252'};
        color: ${type === 'success' ? 'var(--primary-black)' : 'white'};
        font-weight: 800; border-radius: 4px; z-index: 9999;
        box-shadow: 0 10px 40px rgba(0,0,0,0.5); transform: translateX(120%);
        transition: transform 0.5s cubic-bezier(0.68, -0.55, 0.27, 1.55);
        text-transform: uppercase; letter-spacing: 1px;
    `;
    note.textContent = message;
    document.body.appendChild(note);
    setTimeout(() => note.style.transform = 'translateX(0)', 100);
    setTimeout(() => {
        note.style.transform = 'translateX(120%)';
        setTimeout(() => note.remove(), 500);
    }, 4000);
}

// Tab Switching
function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(tabName).classList.add('active');
    event.target.classList.add('active');
}

// Mobile Menu Toggle
function setupMobileMenu() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    if (hamburger) {
        hamburger.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            hamburger.classList.toggle('open');
        });
    }

    // Close menu when clicking links
    document.querySelectorAll('.nav-menu a').forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
            hamburger.classList.remove('open');
        });
    });
}

// Animations & Observer Logic
const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

window.onload = () => {
    // Select all elements to be animated
    const animElements = document.querySelectorAll('section, .course-card, .session-card, .risk-item, .trust-badge, .testimonial-card');
    
    animElements.forEach(el => {
        el.classList.add('reveal-on-scroll');
        observer.observe(el);
    });
    
    // Safety timeout: If components don't reveal in 3s, show them anyway
    setTimeout(() => {
        animElements.forEach(el => el.classList.add('visible'));
    }, 3000);

    // Auto login check for UI
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser) {
        document.querySelectorAll('.auth-btn').forEach(btn => {
            btn.textContent = 'My Account';
        });
    }
};

// Global scroll utils
function scrollToSection(id) {
    const el = document.querySelector(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
}
