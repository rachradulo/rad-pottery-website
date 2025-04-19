// Initialize Rownd
window._rowndConfig = {
    app_key: 'key_x4mufrqf6uehbec91swwb8jv',
    base_url: 'https://api.rownd.io'
};

// Load Rownd script
const script = document.createElement('script');
script.src = 'https://cdn.rownd.io/v1.0/rownd.js';
script.async = true;
document.head.appendChild(script);

// Add event listener for Rownd ready
document.addEventListener('rownd:ready', function() {
    console.log('Rownd is ready!');
    
    // Check initial auth state
    const initialAuth = window.rownd.isAuthenticated();
    console.log('Initial auth state:', initialAuth);
    updateFormVisibility(initialAuth);

    // Handle authentication state changes
    window.rownd.on('auth_state_changed', (auth) => {
        console.log('Auth state changed:', auth);
        updateFormVisibility(auth.is_authenticated);
    });

    // Set up sign in button handler
    const signInButton = document.getElementById('custom-sign-in');
    if (signInButton) {
        signInButton.addEventListener('click', () => {
            window.rownd.requestSignIn();
        });
    }
});

function updateFormVisibility(isAuthenticated) {
    const authRequired = document.getElementById('auth-required');
    const potteryForm = document.getElementById('pottery-request-form');
    
    console.log('Updating visibility. Auth required element:', authRequired);
    console.log('Updating visibility. Form element:', potteryForm);
    
    if (isAuthenticated) {
        if (authRequired) {
            authRequired.style.display = 'none';
            console.log('Hiding auth required section');
        }
        if (potteryForm) {
            potteryForm.style.display = 'block';
            console.log('Showing form');
            // Pre-fill email if available
            const userEmail = window.rownd.getUser()?.data?.email;
            if (userEmail) {
                document.getElementById('email').value = userEmail;
            }
        }
    } else {
        if (authRequired) {
            authRequired.style.display = 'block';
            console.log('Showing auth required section');
        }
        if (potteryForm) {
            potteryForm.style.display = 'none';
            console.log('Hiding form');
        }
    }
}

// Initialize EmailJS
(function() {
    emailjs.init("Bzp3VfjXa97VKf-_8");
})();

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

function showSuccessMessage() {
    const successMessage = document.getElementById('success-message');
    successMessage.classList.add('visible');
    createConfetti();
    
    // Reset form after a slight delay to let user see the success state
    setTimeout(() => {
        document.getElementById('pottery-request-form').reset();
    }, 1000);
}

function closeSuccessMessage() {
    const successMessage = document.getElementById('success-message');
    successMessage.classList.remove('visible');
}

// Form Submission Handler
document.getElementById('pottery-request-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        requestDetails: document.getElementById('request-details').value,
        timeline: document.getElementById('timeline').value,
        budget: document.getElementById('budget').value,
        creativeFreedom: document.getElementById('creative-freedom').value
    };
    
    try {
        // Show loading state
        const submitButton = e.target.querySelector('.submit-btn');
        const originalText = submitButton.textContent;
        submitButton.textContent = 'Sending...';
        submitButton.disabled = true;

        // Send email using EmailJS
        await emailjs.send(
            'service_07weygk',
            'template_iaqojaf',
            formData
        );
        
        // Show success message and confetti
        showSuccessMessage();
        
    } catch (error) {
        console.error('Error submitting form:', error);
        alert('There was an error submitting your request. Please try again or contact me directly at rradulovich2@gmail.com');
    } finally {
        // Reset button state
        submitButton.textContent = originalText;
        submitButton.disabled = false;
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
    // For now, just log the data
    console.log('Form submission:', formData);
    
    // TODO: Implement actual email sending logic
    // This could be using EmailJS, a server endpoint, or another service
    // Example using EmailJS:
    // return emailjs.send(
    //     'YOUR_SERVICE_ID',
    //     'YOUR_TEMPLATE_ID',
    //     formData,
    //     'YOUR_USER_ID'
    // );
    
    // For now, simulate a successful submission
    return Promise.resolve();
} 