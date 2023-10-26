import express from 'express';
import "dotenv/config";
import nodemailer from "nodemailer";
import helmet from "helmet";
import cors from "cors";
import fileUpload from 'express-fileupload';
import { z } from "zod";

const app = express();
app.use(helmet());
app.use(cors({}));
app.use(express.json());
app.use(fileUpload({
    limits: { fileSize: 50 * 1024 * 1024 },
}));
const port = 3001;

const schema = z.object({
    firstname: z.string(),
    lastname: z.string(),
    email: z.string().email(),
    phone: z.string(),
    relational: z.string(),
    message: z.string(),
});

let configOptions = {
    host: process.env.SMTP_HOST,
    port: 465,
    secure: true,
    tls: {
        rejectUnauthorized: false
    },
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
};

let transporter = nodemailer.createTransport(configOptions);

async function mail(emailBody, emailSubject, attachments = []) {
    const info = await transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: "remif@verywell.fr",
        subject: emailSubject,
        html: emailBody,
        attachments,
    });

    console.log("Message sent: %s", info.messageId);
}

app.post('/', async (req, res) => {
    
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
        return res.sendStatus(400);
    }

    const files = Object.values(req.files || {});

    const attachments = files.map((file) => ({
        filename: file.name,
        content: file.data,
    }));


    let emailSubject = "Nouvelle demande de Devis";
    let emailBody = getemailBody(parsed.data);

    await mail(emailBody, emailSubject, attachments).catch(console.error);

    res.sendStatus(200);
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});

function getemailBody(data) {
    return (
        `
            <html>
            <head>
                <style>

                    body {
                        font-family: Arial, sans-serif;
                        background-color: #f4f4f4;
                    }
                    .container {
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                        background-color: #fff;
                        border-radius: 5px;
                        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                    }
                    .header {
                        background-color: #007BFF;
                        color: #fff;
                        padding: 10px;
                        border-top-left-radius: 5px;
                        border-top-right-radius: 5px;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Nouvelle demande de Devis</h1>
                    </div>
                    <p><strong>Prénom:</strong> ${data.firstname}</p>
                    <p><strong>Nom:</strong> ${data.lastname}</p>
                    <p><strong>Email:</strong> ${data.email}</p>
                    <p><strong>Téléphone:</strong> ${data.phone}</p>
                    <p><strong>Relation:</strong> ${data.relational}</p>
                    <h2>Message:</h2>
                    <p>${data.message}</p>
                </div>
            </body>
            </html>
        `
    )
}