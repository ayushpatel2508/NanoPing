import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

export const sendEmail = async (to: string, subject: string, html: string) => {
    // Standard secure SMTP Connection
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.ethereal.email",
        port: Number(process.env.SMTP_PORT) || 587,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        },
        tls: {
            rejectUnauthorized: false // Skip SSL certificate validation for local dev
        }
    });

    try {
        const info = await transporter.sendMail({
            from: `"Ping Website Alerts" <${process.env.SMTP_USER || "alerts@pingwebsite.com"}>`,
            to,
            subject,
            html,
        });
        
        // If testing without a real SMTP, Ethereal provides a fake inbox link to view the email!
        if (process.env.SMTP_HOST === "smtp.ethereal.email") {
            console.log("[EMAIL MOCK] Preview URL: %s", nodemailer.getTestMessageUrl(info));
        }
        
        return info;
    } catch (error) {
        console.error("[sendEmail Utility] Error physically communicating with SMTP Server:", error);
        throw error; // Let BullMQ catch this so it triggers the Delayed Retry
    }
};
