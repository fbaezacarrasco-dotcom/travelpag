const path = require("path");
const express = require("express");
const nodemailer = require("nodemailer");
const fetch = require("node-fetch");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "src")));

const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.MAILER_HOST,
        port: Number(process.env.MAILER_PORT) || 587,
        secure: process.env.MAILER_SECURE === "true",
        auth: {
            user: process.env.MAILER_USER,
            pass: process.env.MAILER_PASS
        }
    });
};

app.post("/api/contact", async (req, res) => {
    const { nombre, apellidos, correo, mensaje, recaptcha } = req.body || {};

    if (!nombre || !apellidos || !correo || !mensaje || !recaptcha) {
        return res.status(400).json({ success: false, message: "Todos los campos son obligatorios." });
    }

    if (!process.env.RECAPTCHA_SECRET) {
        console.warn("RECAPTCHA_SECRET no configurado");
        return res.status(500).json({ success: false, message: "Configuración de seguridad incompleta." });
    }

    try {
        const verification = await fetch("https://www.google.com/recaptcha/api/siteverify", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                secret: process.env.RECAPTCHA_SECRET,
                response: recaptcha
            })
        });
        const verificationResult = await verification.json();
        console.log("reCAPTCHA verification result:", verificationResult);

        if (!verificationResult.success) {
            const errorCodes = verificationResult["error-codes"] || [];
            console.warn("reCAPTCHA verification failed:", errorCodes);

            return res.status(400).json({
                success: false,
                message: errorCodes.includes("invalid-input-secret") || errorCodes.includes("invalid-input-response")
                    ? "Configuracion de reCAPTCHA invalida. Revisa la llave del sitio y el secret."
                    : "No pudimos verificar que seas humano.",
                errors: errorCodes
            });
        }
    } catch (error) {
        console.error("Error verificando reCAPTCHA", error);
        return res.status(500).json({ success: false, message: "Fallo la verificación de seguridad." });
    }

    try {
        const transporter = createTransporter();
        await transporter.sendMail({
            from: process.env.MAILER_FROM || process.env.MAILER_USER,
            to: process.env.ORDER_COMPANY_EMAIL || process.env.MAILER_USER,
            subject: `Nueva solicitud de ${nombre} ${apellidos}`,
            replyTo: correo,
            html: `
                <p><strong>Nombre:</strong> ${nombre} ${apellidos}</p>
                <p><strong>Correo:</strong> ${correo}</p>
                <p><strong>Mensaje:</strong></p>
                <p>${mensaje}</p>
            `
        });

        res.json({ success: true, message: "¡Correo enviado! Nos contactaremos pronto." });
    } catch (error) {
        console.error("Error enviando correo", error);
        res.status(500).json({ success: false, message: "No pudimos enviar tu mensaje. Intenta nuevamente." });
    }
});

app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "src", "index.html"));
});

app.listen(PORT, () => {
    console.log(`Servidor iniciado en http://localhost:${PORT}`);
});
