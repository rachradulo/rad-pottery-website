console.log('[my-requests.js] Script start');

let isFirestoreReady = false;
let isDomReady = false;
let initializationTimeout = null;
const MAX_INIT_WAIT_MS = 10000; // 10 seconds

// Function to show loading state
function showLoading() {
    console.log('Showing loading state');
    const container = document.getElementById('requests-container');
    if (container && !container.querySelector('.loading-message')) {
        container.innerHTML = `
            <div class="message-container loading-message">
                <p>Loading all pottery requests...</p>
            </div>`;
    } else if (!container) {
        console.error('showLoading: requests-container not found!');
    }
}

// Function to hide loading state
function hideLoading() {
    console.log('Hiding loading state');
    const container = document.getElementById('requests-container');
    const loadingElement = container ? container.querySelector('.loading-message') : null;
    if (loadingElement) {
        loadingElement.remove();
    }
}

function checkAllReady() {
    const status = { Firestore: isFirestoreReady, DOM: isDomReady };
    console.log('Checking all systems status:', status);
    return isFirestoreReady && isDomReady;
}

function handleInitializationError(reason) {
    console.error(`Initialization failed: ${reason}`);
    clearTimeout(initializationTimeout);
    hideLoading();
    const container = document.getElementById('requests-container');
    if (container) {
        container.innerHTML = `
            <div class="message-container error-message">
                <p>Failed to load necessary components (${reason}). Please try refreshing the page.</p>
                <p>Status: Firestore Ready=${isFirestoreReady}, DOM Ready=${isDomReady}</p>
            </div>`;
    } else {
        console.error('handleInitializationError: requests-container not found!');
    }
}

// Function to check and load ALL requests (no Rownd check)
async function loadAllRequests() {
    console.log('Attempting to load ALL requests...');
    
    if (!checkAllReady()) { 
        console.log('Not all systems ready, loadAllRequests aborted.');
        return; 
    }
    
    clearTimeout(initializationTimeout);
    console.log('Firestore and DOM ready, proceeding with loading all requests');
    hideLoading(); 

    try {
        // Query for ALL requests
        console.log('Querying Firestore for ALL requests...');
        if (!window.firestoreApp?.db) {
             console.error('Firestore DB object not available!');
             showErrorMessage('Firestore connection failed.');
             return;
        }
        // Get all documents from the collection, ordered by creation time
        const snapshot = await window.firestoreApp.db.collection('pottery-requests')
            .orderBy('createdAt', 'desc')
            .get();

        console.log('Query results:', snapshot.size, 'documents found');
        
        const requests = [];
        snapshot.forEach((doc) => {
            const data = doc.data();
            console.log(`Processing Document ID: ${doc.id}, Data:`, data);

            let timestamp; // Variable to hold the processed timestamp
            // Check if createdAt exists and is a Firestore Timestamp
            if (data.createdAt && typeof data.createdAt.toDate === 'function') { 
                // It looks like a Timestamp, try converting
                try {
                    timestamp = data.createdAt.toDate();
                } catch (dateError) {
                    console.warn(`Document ${doc.id}: Error converting createdAt to Date, even though toDate exists:`, dateError);
                    timestamp = new Date(); // Fallback on conversion error
                }
            } else {
                // Log details if it's missing or not a Timestamp
                console.warn(`Document ${doc.id}: createdAt field is missing or not a Firestore Timestamp. Type: ${typeof data.createdAt}, Value:`, data.createdAt);
                timestamp = new Date(); // Fallback to current date
            }

            requests.push({
                id: doc.id, // Keep the document ID
                ...data,
                // Use the processed timestamp
                timestamp: timestamp 
            });
        });

        displayRequests(requests);
    } catch (error) {
        console.error('Error in loadAllRequests:', error);
        console.error('Error stack:', error.stack);
        hideLoading(); 
        showErrorMessage('Error loading requests: ' + error.message);
    }
}

// Function to show a generic error message
function showErrorMessage(message) {
    const container = document.getElementById('requests-container');
    if (container) {
        container.innerHTML = `
            <div class="message-container error-message">
                <p>${message || 'An unexpected error occurred.'}</p>
            </div>`;
    } else {
        console.error('showErrorMessage: requests-container not found!');
    }
}

// Function to show no requests message (repurposed for all requests)
function showNoRequests() {
    const container = document.getElementById('requests-container');
     if (container) {
        container.innerHTML = `
            <div class="message-container no-requests-message">
                <p>No custom pottery requests found in the database.</p>
                <a href="request.html" class="button">Submit a New Request</a> 
            </div>`;
    } else {
        console.error('showNoRequests: requests-container not found!');
    }
}

// Function to display requests, now grouped by status
function displayRequests(requests) {
    const container = document.getElementById('requests-container');
     if (!container) {
         console.error('displayRequests: requests-container not found!');
         return;
     }
    
    if (!requests || requests.length === 0) {
        showNoRequests();
        return;
    }

    // Group requests by status
    const groupedRequests = {
        pending: [],
        accepted: [],
        rejected: [],
        completed: []
    };

    requests.forEach(req => {
        const status = req.status?.toLowerCase() || 'pending';
        if (groupedRequests[status]) {
            groupedRequests[status].push(req);
        } else {
            console.warn(`Request ${req.id} has unknown status: ${req.status}. Placing in pending.`);
            groupedRequests.pending.push(req);
        }
    });

    let sectionsHTML = `<h2>All Submitted Requests (Admin View)</h2>`; // Build sections first

    const displayOrder = ['pending', 'accepted', 'rejected', 'completed'];

    displayOrder.forEach(status => {
        const reqs = groupedRequests[status];
        if (reqs.length > 0) {
            sectionsHTML += `
                <section class="status-section" id="section-${status}">
                    <h3>${status.charAt(0).toUpperCase() + status.slice(1)} Requests</h3>
                    <div class="requests-grid">
            `;
            sectionsHTML += reqs.map(request => `
                <div class="request-card" data-id="${request.id}">
                    <h4>Request from: ${request.name || 'Unknown'}</h4> 
                    <p><strong>User ID:</strong> ${request.userId || 'N/A'}</p>
                    <p><strong>Email:</strong> ${request.email || 'N/A'}</p>
                    <p><strong>Status:</strong> <span class="status-${request.status?.toLowerCase() || 'pending'}">${request.status || 'Pending'}</span></p>
                    <p><strong>Description:</strong> ${request.requestDetails || 'No description provided'}</p>
                    <p><strong>Timeline:</strong> ${request.timeline || 'Not specified'}</p>
                    <p><strong>Budget:</strong> ${request.budget || 'Not specified'}</p>
                    <p><strong>Submitted:</strong> ${request.timestamp.toLocaleDateString()}</p>
                    <div class="admin-controls">
                         <label for="status-${request.id}">Change Status:</label>
                         <select id="status-${request.id}" name="status">
                             <option value="pending" ${request.status === 'pending' ? 'selected' : ''}>Pending</option>
                             <option value="accepted" ${request.status === 'accepted' ? 'selected' : ''}>Accepted</option>
                             <option value="rejected" ${request.status === 'rejected' ? 'selected' : ''}>Rejected</option>
                             <option value="completed" ${request.status === 'completed' ? 'selected' : ''}>Completed</option>
                         </select>
                         <button class="button secondary" onclick="updateRequestStatus('${request.id}')">Update</button>
                         <button class="button danger" onclick="deleteRequest('${request.id}')">Delete</button>
                    </div>
                </div>
            `).join('');
            sectionsHTML += `
                    </div> <!-- end requests-grid -->
                </section>
            `;
        }
    });

    // Wrap the generated sectionsHTML in a container with padding
    container.innerHTML = `<div class="requests-content-area">${sectionsHTML}</div>`; 
}

// Function to update status (Keep existing)
async function updateRequestStatus(docId) {
    const selectElement = document.getElementById(`status-${docId}`);
    const newStatus = selectElement.value;
    console.log(`Attempting to update request ${docId} to status: ${newStatus}`);

    if (!window.firestoreApp?.db) {
        console.error('Firestore DB not available for update.');
        alert('Error: Firestore connection lost.');
        return;
    }

    try {
        const requestRef = window.firestoreApp.db.collection('pottery-requests').doc(docId);
        await requestRef.update({
            status: newStatus,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp() // Use compat syntax
        });
        console.log(`Successfully updated status for ${docId} to ${newStatus}`);
        alert('Status updated successfully!');
        // Optionally, update the status display text immediately without reloading
        const cardElement = document.querySelector(`.request-card[data-id="${docId}"]`);
        const statusSpan = cardElement ? cardElement.querySelector('.status-pending, .status-accepted, .status-rejected, .status-completed') : null;
        if (statusSpan) {
            statusSpan.textContent = newStatus.charAt(0).toUpperCase() + newStatus.slice(1); // Capitalize
            statusSpan.className = `status-${newStatus.toLowerCase()}`; // Update class for color
        }
        // Consider moving the card to the correct section after update if needed
        // (This requires more complex DOM manipulation or a full reload/re-render)

    } catch (error) {
        console.error(`Error updating status for ${docId}:`, error);
        alert(`Failed to update status: ${error.message}`);
    }
}

// NEW Function to delete a request
async function deleteRequest(docId) {
    console.log(`Attempting to delete request ${docId}`);
    
    // Confirmation dialog
    if (!confirm(`Are you sure you want to permanently delete request ${docId}?`)) {
        console.log('Deletion cancelled by user.');
        return;
    }

    if (!window.firestoreApp?.db) {
        console.error('Firestore DB not available for deletion.');
        alert('Error: Firestore connection lost.');
        return;
    }

    try {
        const requestRef = window.firestoreApp.db.collection('pottery-requests').doc(docId);
        await requestRef.delete();
        console.log(`Successfully deleted document ${docId}`);
        alert('Request deleted successfully!');
        
        // Remove the card from the DOM
        const cardElement = document.querySelector(`.request-card[data-id="${docId}"]`);
        if (cardElement) {
            cardElement.remove();
            // Optional: Check if the section is now empty and remove it or show a message
            const section = cardElement.closest('.status-section');
            if (section && !section.querySelector('.request-card')) {
                 console.log(`Section ${section.id} is now empty.`);
                 // Optionally remove the section header or the whole section
                 // section.remove(); 
            }
        }

    } catch (error) {
        console.error(`Error deleting document ${docId}:`, error);
        alert(`Failed to delete request: ${error.message}`);
    }
}

// --- Initialization Logic --- 

// 1. DOM Ready Listener - Main entry point
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded event fired.');
    isDomReady = true;
    showLoading(); // Show loading now that container exists

    // Check Firestore status immediately
    if (window.firestoreApp?.initialized) {
        console.log('Firestore was ready on DOMContentLoaded.');
        isFirestoreReady = true;
    } else {
        console.log('Firestore NOT ready on DOMContentLoaded, waiting...');
        initializationTimeout = setTimeout(() => {
             if (!isFirestoreReady) {
                 handleInitializationError('Timeout waiting for Firestore');
             }
        }, MAX_INIT_WAIT_MS);
        console.log('Firestore timeout set.');
        
        window.addEventListener('firestoreReady', () => {
             console.log('>>> Firestore ready event received (belatedly) <<<');
             clearTimeout(initializationTimeout);
             isFirestoreReady = true;
             loadAllRequests();
        }, { once: true });
    }

    // Attempt to load requests immediately if Firestore is ready
    loadAllRequests(); 

});

console.log('[my-requests.js] Script end - Initial setup complete.'); 