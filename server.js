require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// In-memory array for messages
const messages = [];

// Configure Nodemailer (Use placeholder for email and app password)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Endpoint to save message
app.post('/save-message', (req, res) => {
    const { email, message, date } = req.body;
    
    if (!email || !message || !date) {
        return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    // Generate a unique ID for the message
    const newMessage = {
        id: Date.now().toString(),
        email,
        message,
        date, // scheduled date string (e.g., 'YYYY-MM-DD')
        sent: false,
        createdAt: new Date().toISOString()
    };

    messages.push(newMessage);
    console.log(`New message saved for ${email} scheduled on ${date}`);

    res.status(201).json({ success: true, message: 'Message saved successfully!' });
});

// Function to send email
async function sendEmail(msg) {
    const mailOptions = {
        from: 'YOUR_EMAIL@gmail.com', // Replace with your Gmail
        to: msg.email,
        subject: 'A Message from Your Past Self - TimeCapsule',
        text: `You have received a TimeCapsule message you wrote on ${new Date(msg.createdAt).toLocaleDateString()}:\n\n"${msg.message}"\n\nStay Awesome!`
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Email sent successfully to ${msg.email}`);
        return true;
    } catch (error) {
        console.error(`Error sending email to ${msg.email}:`, error);
        return false;
    }
}

// Scheduler: Run every 1 minute
setInterval(async () => {
    console.log('Scheduler checking for messages to send...');
    
    // Get current date string in YYYY-MM-DD format based on local time
    const today = new Date();
    // Use local time instead of UTC to match user's input accurately
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const currentDateString = `${year}-${month}-${day}`;

    for (let i = 0; i < messages.length; i++) {
        const msg = messages[i];
        
        // If message not sent yet, and current date is on or after scheduled date
        if (!msg.sent && currentDateString >= msg.date) {
            console.log(`Attempting to send message to ${msg.email}...`);
            const success = await sendEmail(msg);
            
            if (success) {
                msg.sent = true;
            }
        }
    }
}, 60000); // 60,000 milliseconds = 1 minute

// Start Server
app.listen(PORT, () => {
    console.log(`===========================================`);
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`===========================================`);
    console.log(`1. To configure email, edit 'server.js' and replace 'YOUR_EMAIL@gmail.com' and 'YOUR_APP_PASSWORD' with your actual Gmail credentials.`);
    console.log(`2. Remember to use a Google App Password, not your regular password.`);
});
