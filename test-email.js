require('dotenv').config();

async function sendTestEmail() {
    console.log('📧 Enviando correo de prueba...');

    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: 'Happy & Healthy Pets <onboarding@resend.dev>',
                to: process.env.NOTIFICATION_EMAIL,
                subject: '🎉 ¡Correo de Prueba - Happy & Healthy Pets!',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <div style="background: linear-gradient(135deg, #16a34a, #22c55e); color: white; padding: 30px; border-radius: 16px; text-align: center;">
                            <h1 style="margin: 0;">🐾 ¡Funciona!</h1>
                            <p style="margin: 10px 0 0;">Tu sistema de notificaciones está configurado correctamente</p>
                        </div>
                        <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 16px 16px; text-align: center;">
                            <p style="color: #475569;">A partir de ahora recibirás notificaciones por email cada vez que haya una venta en tu tienda.</p>
                            <p style="color: #16a34a; font-weight: 600;">Happy & Healthy Pets 🐾</p>
                        </div>
                    </div>
                `
            })
        });

        const data = await response.json();

        if (response.ok) {
            console.log('✅ ¡Correo enviado exitosamente!');
            console.log('📬 Revisa tu bandeja de entrada:', process.env.NOTIFICATION_EMAIL);
        } else {
            console.error('❌ Error:', data);
        }
    } catch (error) {
        console.error('❌ Error al enviar:', error);
    }
}

sendTestEmail();
