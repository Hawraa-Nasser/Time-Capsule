# 🌊 Time Capsule
A simple and interactive web application that allows users to send messages to their future selves.


## 💡 Idea
Time Capsule is inspired by the concept of writing a message today and receiving it in the future.  
Users can enter their email, write a message, and choose a future date. The system will automatically send the message at the selected time.


## ⚙️ Features
- ✉️ Send messages to a future date
- 📅 Schedule email delivery
- 🌐 Simple and clean user interface
- 🔒 Secure email handling using environment variables


## 🛠️ Technologies Used
- Frontend: HTML, CSS, JavaScript  
- Backend: Node.js + Express  
- Email Service: Nodemailer 


## 🚀 How It Works
1. User enters email, message, and date  
2. The message is stored on the server  
3. The server checks every minute  
4. When the time arrives → email is sent  


## ⚠️ Important Notes
- The server must be running for scheduled emails to be sent  
- Environment variables (.env) are used to keep sensitive data safe  


## 📌 Project Purpose
This project was created as part of the System Management course to practice:
- Backend development  
- Working with APIs  
- Using GitHub  
- Building real-world applications  


## 👩‍💻 Author
Created by a Hawraa Naser as a practical learning project 💙
