// --- Constants & State ---
const MESSAGES_KEY = 'timeCapsule_messages';
let messages = [];

// --- DOM Elements ---
const themeToggleBtn = document.getElementById('theme-toggle');
const capsuleForm = document.getElementById('capsule-form');
const emailInput = document.getElementById('email');
const messageInput = document.getElementById('message');
const deliveryDateInput = document.getElementById('delivery-date');
const messagesList = document.getElementById('messages-list');
const emptyState = document.getElementById('empty-state');
const toastContainer = document.getElementById('toast-container');
const animationOverlay = document.getElementById('animation-overlay');

// Modal Elements
const modal = document.getElementById('message-modal');
const closeModalBtn = document.getElementById('close-modal');
const modalDate = document.getElementById('modal-date');
const modalText = document.getElementById('modal-text');

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    // Set min date for date picker to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    deliveryDateInput.min = tomorrow.toISOString().split('T')[0];

    // Load initial theme and messages
    loadTheme();
    loadMessages();

    // Start timer to update countdowns every minute
    setInterval(renderMessages, 60000);
});

// --- Theme Management ---
function loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    
    // Check if dark theme was saved, or if user prefers dark theme natively
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeToggleBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
    } else {
        document.documentElement.removeAttribute('data-theme');
        themeToggleBtn.innerHTML = '<i class="fa-solid fa-moon"></i>';
    }
}

themeToggleBtn.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    
    // Toggle between light and dark
    if (currentTheme === 'dark') {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('theme', 'light');
        themeToggleBtn.innerHTML = '<i class="fa-solid fa-moon"></i>';
    } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
        themeToggleBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
    }
});

// --- Data Management ---
function loadMessages() {
    const saved = localStorage.getItem(MESSAGES_KEY);
    if (saved) {
        try {
            messages = JSON.parse(saved);
        } catch (e) {
            console.error("Failed to parse messages", e);
            messages = [];
        }
    }
    
    // Sort messages by target date (closest unlock date first)
    messages.sort((a, b) => new Date(a.targetDate) - new Date(b.targetDate));
    renderMessages();
}

function saveMessages() {
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
}

// --- Form Handling ---
capsuleForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();
    const text = messageInput.value.trim();
    const targetDate = deliveryDateInput.value;

    if (!email || !text || !targetDate) return;

    // Validate that the date is not in the past
    const todayStr = new Date().toISOString().split('T')[0];
    
    if (targetDate < todayStr) {
        alert("Please select today or a date in the future.");
        return;
    }

    // Update UI to show loading state (optional, but good UX)
    const submitBtn = capsuleForm.querySelector('button[type="submit"]');
    const originalBtnHTML = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sealing...';
    submitBtn.disabled = true;

    try {
        const response = await fetch('/save-message', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email,
                message: text,
                date: targetDate
            })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            // Reset form
            emailInput.value = '';
            messageInput.value = '';
            deliveryDateInput.value = '';
            
            if (animationOverlay) {
                animationOverlay.classList.remove('hidden');
                // trigger reflow
                void animationOverlay.offsetWidth;
                animationOverlay.classList.add('active');
                
                setTimeout(() => {
                    animationOverlay.classList.remove('active');
                    setTimeout(() => {
                        animationOverlay.classList.add('hidden');
                        
                        const newMessage = {
                            id: Date.now().toString(),
                            text: text,
                            targetDate: targetDate, // Store as YYYY-MM-DD
                            createdAt: new Date().toISOString()
                        };
                        messages.push(newMessage);
                        saveMessages();
                        loadMessages(); // Re-render the list
                    }, 500);
                }, 3500);
            } else {
                showToast("Capsule scheduled successfully!");
                const newMessage = {
                    id: Date.now().toString(),
                    text: text,
                    targetDate: targetDate, // Store as YYYY-MM-DD
                    createdAt: new Date().toISOString()
                };
                messages.push(newMessage);
                saveMessages();
                loadMessages(); // Re-render the list
            }
        } else {
            showToast(data.message || "Failed to seal capsule.", "danger");
        }
    } catch (error) {
        console.error("Error saving message:", error);
        showToast("Error saving message. Please try again.", "danger");
    } finally {
        submitBtn.innerHTML = originalBtnHTML;
        submitBtn.disabled = false;
    }
});

// --- UI Rendering ---
function renderMessages() {
    messagesList.innerHTML = '';
    
    // Show empty state if no messages
    if (messages.length === 0) {
        emptyState.classList.remove('hidden');
    } else {
        emptyState.classList.add('hidden');
        // Render each message card
        messages.forEach(msg => {
            const card = createMessageCard(msg);
            messagesList.appendChild(card);
        });
    }
}

function createMessageCard(msg) {
    const now = new Date().getTime();
    
    // Parse the target date properly (Local Midnight)
    const [year, month, day] = msg.targetDate.split('-');
    const targetDateObj = new Date(year, month - 1, day, 0, 0, 0);
    const targetMs = targetDateObj.getTime();
    
    // Determine if the message is unlocked
    const isUnlocked = now >= targetMs;
    
    const card = document.createElement('div');
    card.className = 'message-card';
    
    // --- Header ---
    const header = document.createElement('div');
    header.className = 'card-header';
    
    const statusBadge = document.createElement('span');
    statusBadge.className = `status-badge ${isUnlocked ? 'status-unlocked' : 'status-locked'}`;
    statusBadge.innerHTML = isUnlocked ? 
        '<i class="fa-solid fa-lock-open"></i> Unlocked' : 
        '<i class="fa-solid fa-lock"></i> Locked';
        
    const countdown = document.createElement('div');
    countdown.className = 'countdown';
    countdown.textContent = isUnlocked ? 'Ready to read' : getCountdownText(targetMs, now);
    
    header.appendChild(statusBadge);
    header.appendChild(countdown);
    
    // --- Body ---
    const body = document.createElement('div');
    body.className = 'card-body';
    
    const textPreview = document.createElement('p');
    if (isUnlocked) {
        textPreview.textContent = msg.text;
    } else {
        // Obfuscate text if locked
        textPreview.textContent = `This message is locked until ${formatDate(targetDateObj)}`;
        textPreview.className = 'locked-text';
    }
    
    body.appendChild(textPreview);
    
    // --- Footer ---
    const footer = document.createElement('div');
    footer.className = 'card-footer';
    
    // View Button
    const viewBtn = document.createElement('button');
    viewBtn.className = 'btn-icon btn-view';
    viewBtn.innerHTML = '<i class="fa-solid fa-eye"></i> View';
    viewBtn.disabled = !isUnlocked;
    if (isUnlocked) {
        viewBtn.addEventListener('click', () => openModal(msg, targetDateObj));
    }
    
    // Delete Button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn-icon btn-delete';
    deleteBtn.innerHTML = '<i class="fa-solid fa-trash"></i> Delete';
    deleteBtn.addEventListener('click', () => deleteMessage(msg.id));
    
    footer.appendChild(viewBtn);
    footer.appendChild(deleteBtn);
    
    card.appendChild(header);
    card.appendChild(body);
    card.appendChild(footer);
    
    return card;
}

function deleteMessage(id) {
    if (confirm("Are you sure you want to delete this time capsule? This cannot be undone.")) {
        messages = messages.filter(m => m.id !== id);
        saveMessages();
        renderMessages();
        showToast("Capsule deleted.", "danger");
    }
}

// --- Helpers ---
function getCountdownText(targetMs, nowMs) {
    const diff = targetMs - nowMs;
    if (diff <= 0) return '';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `Unlocks in ${days}d ${hours}h`;
    if (hours > 0) return `Unlocks in ${hours}h ${minutes}m`;
    return `Unlocks in ${minutes}m`;
}

function formatDate(date) {
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

function showToast(message, type = "success") {
    const toast = document.createElement('div');
    toast.className = 'toast';
    
    // Override color for danger/error toasts
    if (type === "danger") {
        toast.style.backgroundColor = "var(--danger-color)";
    }
    
    toast.innerHTML = `<i class="fa-solid fa-circle-check"></i> ${message}`;
    
    toastContainer.appendChild(toast);
    
    // Remove toast after animation completes
    setTimeout(() => {
        toast.classList.add('fade-out');
        toast.addEventListener('animationend', () => {
            toast.remove();
        });
    }, 3000);
}

// --- Modal Handling ---
function openModal(msg, targetDateObj) {
    modalText.textContent = msg.text;
    modalDate.textContent = `Delivered on ${formatDate(targetDateObj)}`;
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
}

function closeModal() {
    modal.classList.add('hidden');
    document.body.style.overflow = ''; // Restore scrolling
}

// Close modal via button
closeModalBtn.addEventListener('click', closeModal);

// Close modal by clicking outside
modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        closeModal();
    }
});

// Close modal with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
        closeModal();
    }
});
