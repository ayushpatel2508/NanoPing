import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Sends an email using either Resend SDK (if key provided) or standard SMTP.
 */
export const sendEmail = async (to: string, subject: string, html: string) => {
    const resendApiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.EMAIL_FROM || "alerts@pingwebsite.com";

    // --- Option A: Resend SDK (Recommended for production) ---
    if (resendApiKey) {
        const resend = new Resend(resendApiKey);
        try {
            const { data, error } = await resend.emails.send({
                from: `Ping Website Alerts <${fromEmail}>`,
                to: [to],
                subject,
                html,
            });
            if (error) {
                console.error("[sendEmail] Resend error:", error);
                throw error;
            }
            return data;
        } catch (error) {
            console.error("[sendEmail] Resend communication failed:", error);
            // Fallback to SMTP if Resend fails? Usually better to fail and retry via Queue.
            throw error;
        }
    }

    // --- Option B: SMTP (Nodemailer) ---
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.ethereal.email",
        port: Number(process.env.SMTP_PORT) || 587,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        },
        tls: {
            rejectUnauthorized: false // Skip SSL for local dev
        }
    });

    try {
        const info = await transporter.sendMail({
            from: `"Ping Website Alerts" <${process.env.SMTP_USER || fromEmail}>`,
            to,
            subject,
            html,
        });
        
        if (process.env.SMTP_HOST === "smtp.ethereal.email" || !process.env.SMTP_HOST) {
            console.log("[EMAIL MOCK] Preview URL: %s", nodemailer.getTestMessageUrl(info));
        }
        
        return info;
    } catch (error) {
        console.error("[sendEmail] SMTP Error:", error);
        throw error; // Let BullMQ handle retry
    }
};
