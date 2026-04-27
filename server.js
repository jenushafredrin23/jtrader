/**
 * J TRADERS - Backend Server (Optional)
 * Use this for production payment processing
 * 
 * Installation:
 * 1. npm init -y
 * 2. npm install express stripe dotenv cors
 * 3. Create .env file with STRIPE_SECRET_KEY
 * 4. node server.js
 */

const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_YOUR_SECRET_KEY_HERE');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

const PORT = process.env.PORT || 5000;

// ==================== PAYMENT ENDPOINTS ====================

/**
 * Create Payment Intent
 * POST /api/create-payment-intent
 * Body: { amount, courseName, studentEmail }
 */
app.post('/api/create-payment-intent', async (req, res) => {
    try {
        const { amount, courseName, studentEmail } = req.body;

        if (!amount || !courseName || !studentEmail) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Create Stripe payment intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // Convert to subunits (paise for INR)
            currency: 'inr',
            metadata: {
                courseName: courseName,
                studentEmail: studentEmail,
                purchaseDate: new Date().toISOString()
            }
        });

        res.json({
            success: true,
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Confirm Payment
 * POST /api/confirm-payment
 * Body: { paymentIntentId, studentName, studentEmail, courseName, coursePrice }
 */
app.post('/api/confirm-payment', async (req, res) => {
    try {
        const { paymentIntentId, studentName, studentEmail, courseName, coursePrice } = req.body;

        // Retrieve payment intent from Stripe
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        if (paymentIntent.status !== 'succeeded') {
            return res.status(400).json({
                success: false,
                error: 'Payment not completed'
            });
        }

        // Create purchase record
        const purchaseData = {
            studentName: studentName,
            studentEmail: studentEmail,
            courseName: courseName,
            coursePrice: coursePrice,
            purchaseDate: new Date().toISOString(),
            expirationDate: calculateExpirationDate(),
            accessStatus: 'active',
            transactionId: paymentIntent.id,
            stripePaymentIntentId: paymentIntentId
        };

        // TODO: Save to database
        // await savePurchaseToDatabase(purchaseData);

        // Send confirmation email
        await sendConfirmationEmail(studentEmail, purchaseData);

        res.json({
            success: true,
            message: 'Payment confirmed and course access activated',
            purchaseData: purchaseData
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Webhook for Stripe events
 * POST /api/webhook
 */
app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];

    try {
        const event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );

        switch (event.type) {
            case 'payment_intent.succeeded':
                handlePaymentSuccess(event.data.object);
                break;

            case 'payment_intent.payment_failed':
                handlePaymentFailed(event.data.object);
                break;

            case 'charge.refunded':
                handleRefund(event.data.object);
                break;

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        res.json({ received: true });
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(400).send(`Webhook Error: ${error.message}`);
    }
});

// ==================== COURSE ACCESS ENDPOINTS ====================

/**
 * Get Student Courses
 * GET /api/student-courses/:email
 */
app.get('/api/student-courses/:email', async (req, res) => {
    try {
        const { email } = req.params;

        // TODO: Fetch from database
        // const courses = await getCoursesByEmail(email);

        res.json({
            success: true,
            courses: []
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Check Course Access
 * GET /api/check-access/:email/:courseName
 */
app.get('/api/check-access/:email/:courseName', async (req, res) => {
    try {
        const { email, courseName } = req.params;

        // TODO: Check against database
        // const hasAccess = await verifyCourseAccess(email, courseName);

        const hasAccess = true; // Demo
        const expiresIn = 180; // days

        res.json({
            success: true,
            hasAccess: hasAccess,
            expiresIn: expiresIn,
            expirationDate: calculateExpirationDate()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Renew Course Access
 * POST /api/renew-course-access
 */
app.post('/api/renew-course-access', async (req, res) => {
    try {
        const { studentEmail, courseName } = req.body;

        // Extend course for another 6 months
        const newExpirationDate = calculateExpirationDate();

        // TODO: Update in database
        // await updateCourseExpiration(studentEmail, courseName, newExpirationDate);

        res.json({
            success: true,
            message: 'Course access renewed for 6 more months',
            newExpirationDate: newExpirationDate
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ==================== ADMIN ENDPOINTS ====================

/**
 * Get All Purchases (Admin)
 * GET /api/admin/purchases
 * Headers: { Authorization: 'Bearer ADMIN_TOKEN' }
 */
app.get('/api/admin/purchases', authenticateAdmin, async (req, res) => {
    try {
        // TODO: Fetch all purchases from database with pagination
        // const purchases = await getAllPurchases(req.query);

        res.json({
            success: true,
            purchases: [],
            total: 0
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Get Revenue Reports
 * GET /api/admin/revenue
 */
app.get('/api/admin/revenue', authenticateAdmin, async (req, res) => {
    try {
        // TODO: Calculate revenue from database
        const revenue = {
            total: 0,
            thisMonth: 0,
            lastMonth: 0,
            topCourse: '',
            studentCount: 0
        };

        res.json({
            success: true,
            revenue: revenue
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Expire Course Manually
 * POST /api/admin/expire-course
 */
app.post('/api/admin/expire-course', authenticateAdmin, async (req, res) => {
    try {
        const { studentEmail, courseName } = req.body;

        // TODO: Set course status to expired in database
        // await expireCourse(studentEmail, courseName);

        res.json({
            success: true,
            message: `Course ${courseName} expired for ${studentEmail}`
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ==================== UTILITY FUNCTIONS ====================

/**
 * Calculate 6-month expiration date
 */
function calculateExpirationDate() {
    const now = new Date();
    const expirationDate = new Date(now.getFullYear(), now.getMonth() + 6, now.getDate());
    return expirationDate.toISOString();
}

/**
 * Handle successful payment
 */
function handlePaymentSuccess(paymentIntent) {
    console.log('Payment successful:', paymentIntent.id);
    // TODO: Update database, send emails, create course access
}

/**
 * Handle failed payment
 */
function handlePaymentFailed(paymentIntent) {
    console.log('Payment failed:', paymentIntent.id);
    // TODO: Log failed attempt, notify support
}

/**
 * Handle refund
 */
function handleRefund(charge) {
    console.log('Refund processed:', charge.id);
    // TODO: Disable course access, update database
}

/**
 * Send confirmation email
 */
async function sendConfirmationEmail(email, purchaseData) {
    // TODO: Integrate with email service (SendGrid, Mailgun, etc.)
    console.log(`Sending confirmation email to ${email}`, purchaseData);
}

/**
 * Authenticate admin requests
 */
function authenticateAdmin(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];

    if (token === process.env.ADMIN_TOKEN) {
        next();
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
}

// ==================== ERROR HANDLING ====================

app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        success: false,
        error: err.message || 'Internal server error'
    });
});

// ==================== START SERVER ====================

app.listen(PORT, () => {
    console.log(`🚀 J Traders Server running on http://localhost:${PORT}`);
    console.log('💳 Stripe integration ready');
    console.log('📊 Payment processing active');
    console.log('✅ Webhook endpoint: /api/webhook');
});

// ==================== ENVIRONMENT VARIABLES ====================

/**
 * Create .env file with:
 * 
 * # Stripe
 * STRIPE_SECRET_KEY=sk_live_YOUR_SECRET_KEY
 * STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET
 * 
 * # Admin
 * ADMIN_TOKEN=your_secure_admin_token
 * 
 * # Server
 * PORT=5000
 * NODE_ENV=production
 * 
 * # Database (Optional)
 * DB_HOST=localhost
 * DB_USER=root
 * DB_PASS=password
 * DB_NAME=jtraders
 * 
 * # Email (Optional)
 * SENDGRID_API_KEY=your_sendgrid_key
 * EMAIL_FROM=noreply@jtraders.com
 */
