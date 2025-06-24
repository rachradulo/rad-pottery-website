// Store user data globally when available (still useful, but less critical now)
let currentUserData = null;
// let submitButton = null; // Removed - button always enabled

// Global variable to cache the user ID - REMOVED
// let cachedRowndUserId = null;

// Simpler Rownd Ready listener
window.addEventListener('rownd:ready', function() {
    console.log('Rownd is ready');
    console.log('Logging window.rownd object:', window.rownd);

    const initialAuth = window.rownd.isAuthenticated();
    console.log('Initial auth state (on ready):', initialAuth);
    updateFormVisibility(initialAuth); // Still useful for showing/hiding form

    // Minimal event listeners
    window.rownd.on('auth_state_changed', (auth) => {
        console.log('>>> EVENT FIRED: auth_state_changed'); 
        updateFormVisibility(auth.is_authenticated);
    });

    window.rownd.on('user_data_updated', (userData) => {
         console.log('>>> EVENT FIRED: user_data_updated');
         console.log('(user_data_updated) window.rownd.user.data:', window.rownd.user?.data);
    });
    console.log('Rownd basic setup complete.');
});

function updateFormVisibility(isAuthenticated) {
    const authRequired = document.getElementById('auth-required');
    const potteryForm = document.querySelector('.request-form');
    console.log('Updating visibility. isAuthenticated:', isAuthenticated);
    
    if (isAuthenticated) {
        if (authRequired) authRequired.style.display = 'none';
        if (potteryForm) {
            potteryForm.style.display = 'block';
            console.log('Showing form');
            // Best-effort email prefill (might still have timing issues, less critical)
            try {
                 const userEmail = window.rownd.user?.data?.email;
                 if (userEmail) {
                    document.getElementById('email').value = userEmail;
                    console.log('Prefilled email (best effort):', userEmail);
                 }
            } catch (err) { console.warn('Could not prefill email', err); }
        }
    } else {
        if (authRequired) authRequired.style.display = 'block';
        if (potteryForm) potteryForm.style.display = 'none';
        console.log('Hiding form');
    }
}

// Initialize EmailJS
// (function() {
//     emailjs.init("Bzp3VfjXa97VKf-_8");
// })();

function createConfetti() {
    const colors = ['#9747FF', '#8033FF', '#B47AFF', '#D4B3FF'];
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.animationDelay = Math.random() * 2 + 's';
        confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
        document.body.appendChild(confetti);
        
        // Remove confetti after animation
        setTimeout(() => confetti.remove(), 3000);
    }
}

function showSuccessMessage(docId) {
    const successMessage = document.getElementById('success-message');
    if (successMessage) {
        // Add the document ID to the success message
        const messageText = successMessage.querySelector('p');
        if (messageText) {
            messageText.innerHTML = `I'll review your custom pottery request and get back to you soon.<br><br>Your request ID: ${docId}`;
        }
        successMessage.style.display = 'block';
        // Reset form
        const form = document.querySelector('.request-form');
        if (form) {
            form.reset();
        }
    }
}

function closeSuccessMessage() {
    const successMessage = document.getElementById('success-message');
    if (successMessage) {
        successMessage.style.display = 'none';
    }
}

// Firestore Collection Setup - Accepts userId and userEmail
async function saveRequestToFirestore(formData, userId, userEmail) { 
    try {
        console.log('Starting saveRequestToFirestore...');
        console.log('Checking Firestore initialization...');
        
        if (!window.firestoreApp) {
            throw new Error('Firestore app not found in window object');
        }
        
        if (!window.firestoreApp.db) {
            throw new Error('Firestore db not found in firestoreApp');
        }

        if (!userId) {
            console.error('Validation failed: userId is missing.');
            throw new Error('Invalid user ID provided for saving.');
        }

        // Ensure we have the email from Rownd
        if (!userEmail) {
             console.warn('Rownd user email not provided to saveRequestToFirestore. Falling back to form data if necessary, but ideally Rownd email should be present.');
             // If you absolutely need a fallback:
             // userEmail = formData.email;
             // If not, you might throw an error or leave it blank:
             // throw new Error('User email from Rownd is missing.');
        }

        const requestData = {
            name: formData.name,
            // email: formData.email, // REMOVED - Use email from Rownd argument
            requestDetails: formData.requestDetails,
            timeline: formData.timeline,
            budget: formData.budget,
            creativeControl: formData.creativeControl,
            userId: userId, // User ID from Rownd
            email: userEmail, // Use the email passed in from Rownd
            status: 'pending',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        console.log('Request data prepared:', requestData);
        console.log('Attempting to save to Firestore...');

        // Use the compat version consistently
        const db = window.firestoreApp.db;
        console.log('Got Firestore db instance');

        try {
            const docRef = await db.collection('pottery-requests').add(requestData);
            console.log("Document successfully written with ID: ", docRef.id);
            return docRef.id;
        } catch (firestoreError) {
            console.error("Firestore write error:", firestoreError);
            console.log("Error code:", firestoreError.code);
            console.log("Error message:", firestoreError.message);
            throw new Error(`Firestore write failed: ${firestoreError.message}`);
        }
    } catch (error) {
        console.error("Error in saveRequestToFirestore:", error);
        console.error("Error stack:", error.stack);
        throw error;
    }
}

// Removed getRowndUserDataWithPolling function

// Test Firebase Connection
async function testFirebaseConnection() {
    console.log('Testing Firebase connection...');
    try {
        if (!window.firestoreApp?.db) {
            throw new Error('Firestore DB not initialized');
        }

        // Try to write to test collection
        const testData = {
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            test: 'Connection test'
        };

        console.log('Attempting to write test document...');
        const testRef = await window.firestoreApp.db.collection('test').add(testData);
        console.log('Test document written successfully:', testRef.id);

        // Try to read it back
        const doc = await testRef.get();
        console.log('Test document read successfully:', doc.data());

        // Clean up
        await testRef.delete();
        console.log('Test document deleted successfully');
        
        return true;
    } catch (error) {
        console.error('Firebase connection test failed:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        return false;
    }
}

// Setup form submission on DOMContentLoaded - Using rownd.user.get()
document.addEventListener('DOMContentLoaded', async () => {
    const requestForm = document.querySelector('.request-form');
    const closeButton = document.getElementById('close-success');
    
    if (closeButton) {
        closeButton.addEventListener('click', closeSuccessMessage);
    }

    // Test Firebase connection first
    const isConnected = await testFirebaseConnection();
    console.log('Firebase connection test result:', isConnected);

    if (requestForm) {
        requestForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('Form submitted');

            const formData = {
                name: requestForm.querySelector('#name').value,
                // email: requestForm.querySelector('#email').value, // REMOVED - Field no longer exists
                requestDetails: requestForm.querySelector('#request-details').value,
                timeline: requestForm.querySelector('#timeline').value,
                budget: requestForm.querySelector('#budget').value,
                creativeControl: requestForm.querySelector('#creative-freedom').value
            };
            console.log('Form data (email excluded):', formData);

            try {
                // 1. Check Authentication
                console.log('Checking Rownd authentication (in submit handler)...');
                if (!window.rownd.isAuthenticated()) {
                    throw new Error('User must be authenticated to submit a request');
                }

                // 2. Call rownd.user.get() to fetch data
                console.log('Calling await window.rownd.user.get()...');
                const userData = await window.rownd.user.get();
                console.log('Received data from rownd.user.get():', userData);

                // 3. Extract user ID (using 'user_id')
                const userIdToSave = userData?.user_id; 
                const userEmailFromRownd = userData?.email; // Also get email if available

                if (!userIdToSave) {
                    console.error('Failed to get user_id from rownd.user.get() response.', userData);
                    throw new Error('Could not retrieve Rownd user ID after fetch. Please try again.');
                }
                
                console.log('Using Rownd User ID for save:', userIdToSave);
                console.log('Email from Rownd data:', userEmailFromRownd);

                // 4. Check Firestore status
                console.log('Checking if Firestore is initialized (in submit handler)...');
                if (!window.firestoreApp?.initialized) {
                    throw new Error('Firestore is not initialized');
                }

                // 5. Save to Firestore (passing ID and email)
                console.log('Calling saveRequestToFirestore...');
                const docId = await saveRequestToFirestore(formData, userIdToSave, userEmailFromRownd);
                console.log('Saved to Firestore with ID:', docId);

                // 6. Send email
                console.log('Sending email...');
                await sendEmail(formData);
                console.log('Email sent successfully');

                showSuccessMessage(docId);
            } catch (error) {
                console.error("Error submitting request: ", error);
                // Improved error handling for alert
                let alertMessage = 'There was an error submitting your request. Please check console for details.';
                if (error instanceof Error) {
                    alertMessage = error.message;
                } else if (error && error.text) { // Handle EmailJS specific error format
                    alertMessage = error.text;
                } else if (typeof error === 'string') {
                    alertMessage = error;
                }
                alert(alertMessage);
            }
        });
    }

    // Handle Mobile Menu Toggle (keep this here)
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navLinks.classList.toggle('active');
        });

        // Close menu when clicking a link
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navLinks.classList.remove('active');
            });
        });
    }
});

// Range slider value display
const slider = document.getElementById('creative-freedom');
if (slider) {
    slider.addEventListener('input', function() {
        // Update the slider value display
        const value = this.value;
        const leftLabel = this.parentElement.querySelector('.range-labels span:first-child');
        const rightLabel = this.parentElement.querySelector('.range-labels span:last-child');
        
        // Adjust label opacity based on slider position
        leftLabel.style.opacity = 1 - (value / 100);
        rightLabel.style.opacity = value / 100;
    });
}

// Email Sending Function
async function sendEmail(formData) {
    try {
        const response = await emailjs.send(
            'service_07weygk', // Service ID provided previously
            'template_iaqojaf', // Use the correct Template ID provided by the user
            formData
        );
        console.log('Email sent successfully:', response);
        return response;
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
} 

// Stripe Subscribe Button Logic
const monthlyBtn = document.getElementById('subscribe-monthly');
const yearlyBtn = document.getElementById('subscribe-yearly');

async function redirectToCheckout(priceId) {
    try {
        const response = await fetch('/.netlify/functions/create-checkout-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                priceId,
                successUrl: window.location.origin + '/thank-you.html',
                cancelUrl: window.location.origin + '/index.html'
            })
        });
        const data = await response.json();
        if (data.url) {
            window.location.href = data.url;
        } else {
            alert('Error: ' + (data.error || 'Could not start checkout.'));
        }
    } catch (err) {
        alert('Error: ' + err.message);
    }
}

if (monthlyBtn) {
    monthlyBtn.addEventListener('click', function() {
        redirectToCheckout('price_1RdasuEQCdAZmzAWiPbsBu8a');
    });
}
if (yearlyBtn) {
    yearlyBtn.addEventListener('click', function() {
        redirectToCheckout('price_1RdatiEQCdAZmzAWUhpyM10I');
    });
} 
