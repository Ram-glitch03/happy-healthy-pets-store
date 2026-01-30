/**
 * Happy & Healthy Pets - Stripe Backend Server
 * Handles payment sessions and webhooks
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
const PORT = process.env.PORT || 3000;

// CORS for frontend - allow all origins in production
app.use(cors());

// Webhook endpoint needs raw body - must be before express.json()
app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.error('⚠️ Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
        case 'checkout.session.completed':
            const session = event.data.object;
            await handleSuccessfulPayment(session);
            break;
        default:
            console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
});

// JSON parsing for other routes
app.use(express.json());

// Create Stripe Checkout Session
app.post('/create-checkout-session', async (req, res) => {
    try {
        const { items, customerInfo } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ error: 'No items provided' });
        }

        // Transform cart items to Stripe line items
        const lineItems = items.map(item => ({
            price_data: {
                currency: 'mxn',
                product_data: {
                    name: item.name,
                    description: 'Suplemento natural para mascotas'
                },
                unit_amount: Math.round(item.price * 100) // Stripe uses cents
            },
            quantity: item.qty
        }));

        // Create checkout session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            success_url: `${process.env.FRONTEND_URL}/gracias.html?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL}/checkout.html`,
            customer_email: customerInfo?.email,
            metadata: {
                customer_name: customerInfo?.name || '',
                customer_phone: customerInfo?.phone || '',
                customer_address: customerInfo?.address || ''
            },
            shipping_address_collection: {
                allowed_countries: ['MX']
            },
            locale: 'es'
        });

        res.json({ url: session.url, sessionId: session.id });
    } catch (error) {
        console.error('Error creating checkout session:', error);
        res.status(500).json({ error: error.message });
    }
});

// Handle successful payment
async function handleSuccessfulPayment(session) {
    console.log('💰 ¡Nueva venta recibida!');
    console.log('----------------------------');
    console.log(`🆔 Session ID: ${session.id}`);
    console.log(`💵 Monto: $${(session.amount_total / 100).toFixed(2)} MXN`);
    console.log(`📧 Email: ${session.customer_email}`);
    console.log(`👤 Cliente: ${session.metadata?.customer_name}`);
    console.log('----------------------------');

    // Send email notification to owner
    if (process.env.NOTIFICATION_EMAIL) {
        await sendEmailNotification(session);
    }

    // Send notification to Discord (if configured)
    if (process.env.DISCORD_WEBHOOK_URL) {
        await sendDiscordNotification(session);
    }
}

// Send email notification using Resend API (or log if not configured)
async function sendEmailNotification(session) {
    const amount = (session.amount_total / 100).toFixed(2);
    const customerName = session.metadata?.customer_name || 'Cliente';
    const customerEmail = session.customer_email || 'No especificado';
    const customerPhone = session.metadata?.customer_phone || 'No especificado';
    const customerAddress = session.metadata?.customer_address || 'No especificada';

    // If Resend API key is configured, send real email
    if (process.env.RESEND_API_KEY) {
        try {
            const response = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    from: 'Happy & Healthy Pets <ventas@resend.dev>',
                    to: process.env.NOTIFICATION_EMAIL,
                    subject: `🎉 ¡Nueva Venta! $${amount} MXN - ${customerName}`,
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                            <div style="background: linear-gradient(135deg, #16a34a, #22c55e); color: white; padding: 30px; border-radius: 16px 16px 0 0; text-align: center;">
                                <h1 style="margin: 0;">🎉 ¡Nueva Venta!</h1>
                                <p style="margin: 10px 0 0; font-size: 24px; font-weight: bold;">$${amount} MXN</p>
                            </div>
                            <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 16px 16px;">
                                <h2 style="color: #1a1a2e; margin-top: 0;">Detalles del Cliente</h2>
                                <table style="width: 100%; border-collapse: collapse;">
                                    <tr><td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;"><strong>👤 Nombre:</strong></td><td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">${customerName}</td></tr>
                                    <tr><td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;"><strong>📧 Email:</strong></td><td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">${customerEmail}</td></tr>
                                    <tr><td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;"><strong>📱 Teléfono:</strong></td><td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">${customerPhone}</td></tr>
                                    <tr><td style="padding: 10px 0;"><strong>📍 Dirección:</strong></td><td style="padding: 10px 0;">${customerAddress}</td></tr>
                                </table>
                                <div style="margin-top: 20px; padding: 15px; background: #dcfce7; border-radius: 8px;">
                                    <p style="margin: 0; color: #16a34a;"><strong>Session ID:</strong> ${session.id}</p>
                                </div>
                            </div>
                        </div>
                    `
                })
            });

            if (response.ok) {
                console.log('✅ Email notification sent to:', process.env.NOTIFICATION_EMAIL);
            } else {
                console.error('❌ Email send failed:', await response.text());
            }
        } catch (error) {
            console.error('❌ Failed to send email notification:', error);
        }
    } else {
        // Log the email that would be sent
        console.log('📧 Email notification (configure RESEND_API_KEY to send):');
        console.log(`   To: ${process.env.NOTIFICATION_EMAIL}`);
        console.log(`   Subject: 🎉 ¡Nueva Venta! $${amount} MXN - ${customerName}`);
    }
}

// Send Discord notification
async function sendDiscordNotification(session) {
    try {
        const response = await fetch(process.env.DISCORD_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                embeds: [{
                    title: '🎉 ¡Nueva Venta en Happy & Healthy Pets!',
                    color: 0x22c55e,
                    fields: [
                        { name: '💵 Monto', value: `$${(session.amount_total / 100).toFixed(2)} MXN`, inline: true },
                        { name: '📧 Email', value: session.customer_email || 'N/A', inline: true },
                        { name: '👤 Cliente', value: session.metadata?.customer_name || 'N/A', inline: false }
                    ],
                    timestamp: new Date().toISOString()
                }]
            })
        });
        console.log('✅ Discord notification sent!');
    } catch (error) {
        console.error('❌ Failed to send Discord notification:', error);
    }
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server (only when running locally, not on Vercel)
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
        console.log(`📦 Stripe integration active`);
    });
}

// Export for Vercel serverless
module.exports = app;
