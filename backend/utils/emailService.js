// utils/emailService.js
const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Verify connection
transporter.verify((error, success) => {
    if (error) {
        console.error(' Email transporter error:', error);
    } else {
        console.log(' Email server is ready to send messages');
    }
});

// Send email function
const sendEmail = async (options) => {
    try {
        const mailOptions = {
            from: `"STILL STANDING" <${process.env.EMAIL_FROM}>`,
            to: options.to,
            subject: options.subject,
            html: options.html,
            text: options.text || options.html.replace(/<[^>]*>/g, '')
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(` Email sent: ${info.messageId}`);
        return info;
    } catch (error) {
        console.error(' Error sending email:', error);
        throw error;
    }
};

// Email templates
const emailTemplates = {
    welcome: (user) => ({
        subject: 'Welcome to STILL STANDING',
        html: `
            <h2>Welcome to STILL STANDING, ${user.name}!</h2>
            <p>Thank you for joining our community of resilience and support.</p>
            <p>We're here to walk with you through your journey of healing and growth.</p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
                <p><strong>Getting Started:</strong></p>
                <ul>
                    <li>Explore our support resources</li>
                    <li>Book your first session with a peer counselor</li>
                    <li>Join our community discussions</li>
                    <li>Start tracking your progress in your personal dashboard</li>
                </ul>
            </div>
            
            <p><strong>Remember:</strong> You are not alone. We're here for you 24/7.</p>
            
            <p>Emergency Support: ${process.env.EMERGENCY_PHONE}</p>
            <p>WhatsApp Support: ${process.env.EMERGENCY_WHATSAPP}</p>
            
            <br>
            <p>With hope and solidarity,</p>
            <p>The STILL STANDING Team</p>
        `
    }),

    bookingReminder: (booking) => ({
        subject: 'Reminder: Your Support Session Tomorrow',
        html: `
            <h2>Session Reminder</h2>
            <p>Hello ${booking.user_name},</p>
            <p>This is a reminder about your support session tomorrow.</p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
                <p><strong>Session Details:</strong></p>
                <p>Date: ${new Date(booking.booking_date).toLocaleDateString()}</p>
                <p>Time: ${booking.booking_time}</p>
                <p>Session Type: ${booking.session_type.replace('-', ' ')}</p>
                ${booking.counselor_name ? `<p>Counselor: ${booking.counselor_name}</p>` : ''}
                ${booking.meeting_link ? `<p>Meeting Link: <a href="${booking.meeting_link}">${booking.meeting_link}</a></p>` : ''}
            </div>
            
            <p><strong>Preparation Tips:</strong></p>
            <ul>
                <li>Find a quiet, private space for the session</li>
                <li>Have a glass of water nearby</li>
                <li>Think about what you'd like to discuss</li>
                <li>Remember, this is a judgment-free zone</li>
            </ul>
            
            <p>To reschedule or cancel, please visit your booking portal.</p>
            
            <br>
            <p>We look forward to supporting you,</p>
            <p>The STILL STANDING Team</p>
        `
    }),

    crisisCheckIn: (user) => ({
        subject: 'Checking In - STILL STANDING',
        html: `
            <h2>We're Thinking of You</h2>
            <p>Hello ${user.name},</p>
            <p>We noticed it's been a while since we heard from you and wanted to check in.</p>
            <p>Remember, it's okay to not be okay, and we're here whenever you need support.</p>
            
            <div style="background: #e8f4fc; padding: 20px; border-radius: 5px; margin: 20px 0;">
                <p><strong>If you're struggling today:</strong></p>
                <ul>
                    <li>Call our 24/7 crisis line: ${process.env.EMERGENCY_PHONE}</li>
                    <li>Text us on WhatsApp: ${process.env.EMERGENCY_WHATSAPP}</li>
                    <li>Book an immediate session through your portal</li>
                </ul>
            </div>
            
            <p><strong>Coping strategies for today:</strong></p>
            <ul>
                <li>Take 5 deep breaths</li>
                <li>Drink a glass of water</li>
                <li>Step outside for 5 minutes</li>
                <li>Write down one thing you're grateful for</li>
            </ul>
            
            <p>You matter. Your journey matters. We're here for you.</p>
            
            <br>
            <p>With care,</p>
            <p>The STILL STANDING Team</p>
        `
    })
};

module.exports = {
    sendEmail,
    emailTemplates
};