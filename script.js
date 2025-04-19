// Team member class to store member data
class TeamMember {
    constructor(name, photoUrl) {
        this.id = Date.now();
        this.name = name;
        this.photoUrl = photoUrl;
        this.isHidden = false;
    }
}

// State management
let teamMembers = [];
let isSpinning = false;
let currentRotation = 0;

// DOM Elements
const spinner = document.querySelector('.spinner');
const selectedPhoto = document.getElementById('selected-photo');
const selectedName = document.getElementById('selected-name');
const spinButton = document.getElementById('spin-button');
const memberNameInput = document.getElementById('member-name');
const memberPhotoInput = document.getElementById('member-photo');
const addMemberButton = document.getElementById('add-member');
const teamList = document.getElementById('team-list');
const winnerAnnouncement = document.getElementById('winner-announcement');

// Create spinner segments container
const spinnerSegments = document.createElement('div');
spinnerSegments.className = 'spinner-segments';
spinner.insertBefore(spinnerSegments, spinner.firstChild);

// Sound effects
const spinSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
const selectSound = new Audio('https://assets.mixkit.co/active_storage/sfx/1434/1434-preview.mp3');

// Event Listeners
addMemberButton.addEventListener('click', addTeamMember);
spinButton.addEventListener('click', spin);

// Add team member
function addTeamMember() {
    const name = memberNameInput.value.trim();
    const photoFile = memberPhotoInput.files[0];

    if (!name || !photoFile) {
        alert('Please enter a name and select a photo');
        return;
    }

    const photoUrl = URL.createObjectURL(photoFile);
    const member = new TeamMember(name, photoUrl);
    teamMembers.push(member);

    // Clear inputs
    memberNameInput.value = '';
    memberPhotoInput.value = '';

    // Update UI
    updateTeamList();
    updateSpinner();
}

// Function to convert degrees to radians
function degToRad(degrees) {
    return degrees * (Math.PI / 180);
}

// Update spinner segments
function updateSpinner() {
    spinner.innerHTML = ''; // Clear previous segments and button
    winnerAnnouncement.textContent = ''; // Clear winner text

    const activeMembers = teamMembers.filter(m => !m.isHidden);
    const numSegments = activeMembers.length;

    if (numSegments === 0) {
        const placeholder = document.createElement('div');
        placeholder.textContent = 'Add members to spin!';
        placeholder.style.textAlign = 'center';
        placeholder.style.padding = '2rem';
        placeholder.style.color = 'var(--rownd-purple-dark)';
        spinner.appendChild(placeholder);
        createSpinButton(true);
        return;
    }

    const segmentAngle = 360 / numSegments;
    const colors = ['var(--rownd-purple)', 'var(--rownd-purple-dark)'];

    activeMembers.forEach((member, index) => {
        const segment = document.createElement('div');
        segment.className = 'spinner-segment';

        // Calculate start and end angles in radians
        const startAngle = degToRad(segmentAngle * index - 90); // Start at top (-90 degrees)
        const endAngle = degToRad(segmentAngle * (index + 1) - 90);

        // Calculate points for SVG path
        // Center point is (50,50), radius is 50
        const startX = 50 + 50 * Math.cos(startAngle);
        const startY = 50 + 50 * Math.sin(startAngle);
        const endX = 50 + 50 * Math.cos(endAngle);
        const endY = 50 + 50 * Math.sin(endAngle);

        // Create SVG path for perfect pie slice
        const largeArcFlag = segmentAngle <= 180 ? 0 : 1;
        const pathData = `M 50,50 L ${startX},${startY} A 50,50 0 ${largeArcFlag} 1 ${endX},${endY} Z`;
        
        segment.style.clipPath = `path('${pathData}')`;
        segment.style.webkitClipPath = `path('${pathData}')`;

        // Create and style content container
        const content = document.createElement('div');
        content.className = 'segment-content';
        content.style.background = colors[index % colors.length];

        // Calculate center angle for content positioning
        const centerAngle = segmentAngle * index + (segmentAngle / 2);
        content.style.transform = `rotate(${centerAngle}deg)`;

        // Add image
        const img = document.createElement('img');
        img.src = member.photoUrl;
        img.alt = member.name;
        img.style.transform = `rotate(${-centerAngle}deg)`;
        content.appendChild(img);

        // Add label with improved positioning
        const label = document.createElement('div');
        label.className = 'segment-label';
        label.textContent = member.name;
        
        // Position label towards outer edge
        const labelAngleRad = degToRad(centerAngle - 90);
        const labelDistance = 35; // Percentage from center
        const labelX = 50 + labelDistance * Math.cos(labelAngleRad);
        const labelY = 50 + labelDistance * Math.sin(labelAngleRad);
        
        label.style.left = `${labelX}%`;
        label.style.top = `${labelY}%`;
        label.style.transform = `translate(-50%, -50%) rotate(${-centerAngle}deg)`;
        content.appendChild(label);

        segment.appendChild(content);
        spinner.appendChild(segment);
    });

    createSpinButton(false);
}

// Function to create and add the spin button
function createSpinButton(isDisabled) {
    const existingButton = spinner.querySelector('.spin-button');
    if (existingButton) existingButton.remove(); // Remove if exists

    const button = document.createElement('button');
    button.className = 'spin-button';
    button.innerHTML = '<span>SPIN!</span>';
    button.onclick = spin;
    button.disabled = isDisabled;
    spinner.appendChild(button);
}

// Update team list UI
function updateTeamList() {
    teamList.innerHTML = '';
    teamMembers.forEach(member => {
        const div = document.createElement('div');
        div.className = `team-member ${member.isHidden ? 'hidden' : ''}`;
        div.innerHTML = `
            <img src="${member.photoUrl}" alt="${member.name}">
            <h3>${member.name}</h3>
            <button onclick="toggleHide(${member.id})">${member.isHidden ? 'Unhide' : 'Hide'}</button>
            <button onclick="removeMember(${member.id})" style="background: #ff4444; color: white;">Remove</button>
        `;
        teamList.appendChild(div);
    });
}

// Toggle hide member
function toggleHide(memberId) {
    const member = teamMembers.find(m => m.id === memberId);
    if (member) {
        member.isHidden = !member.isHidden;
        updateTeamList();
        updateSpinner();
    }
}

// Remove team member
function removeMember(memberId) {
    teamMembers = teamMembers.filter(m => m.id !== memberId);
    updateTeamList();
    updateSpinner();
}

// Spin functionality
function spin() {
    if (isSpinning) return;

    const activeMembers = teamMembers.filter(m => !m.isHidden);
    const numSegments = activeMembers.length;
    if (numSegments === 0) {
        alert('No active team members to spin!');
        return;
    }

    isSpinning = true;
    winnerAnnouncement.textContent = ''; // Clear previous winner
    const spinButtonElement = spinner.querySelector('.spin-button');
    if(spinButtonElement) spinButtonElement.disabled = true;
    spinSound.play();

    // Calculate target angle
    const segmentAngle = 360 / numSegments;
    const targetIndex = Math.floor(Math.random() * numSegments);
    const selectedMember = activeMembers[targetIndex];

    // Calculate the angle so the pointer points to the middle of the target segment
    // Pointer is at 0 degrees (top). Target segment middle angle = segmentAngle * targetIndex + segmentAngle / 2
    // We want spinner rotation + target middle angle = 360 * n (or 0)
    const targetRotation = 360 - (segmentAngle * targetIndex + segmentAngle / 2);

    // Add random extra rotations and ensure it spins significantly
    const extraRotations = 360 * (5 + Math.floor(Math.random() * 4)); // 5-8 extra rotations
    const finalRotation = currentRotation + extraRotations + targetRotation;

    // Apply rotation
    spinner.style.transition = 'transform 4s cubic-bezier(0.25, 1, 0.5, 1)';
    spinner.style.transform = `rotate(${finalRotation}deg)`;

    // Store the final rotation (modulo 360) for the next spin
    currentRotation = finalRotation % 360;

    // After animation ends
    setTimeout(() => {
        selectSound.play();
        winnerAnnouncement.textContent = `${selectedMember.name} wins!`;

        // Optional: Add highlight to winner segment
        // This requires more complex logic to identify the correct segment element

        isSpinning = false;
        if(spinButtonElement) spinButtonElement.disabled = false;

        // Reset transition for potential immediate next spin (though unlikely)
        spinner.style.transition = 'none';

    }, 4000); // Match CSS transition duration
}

// Add flash animation CSS (if not already added)
if (!document.getElementById('spinner-animations')) {
    const style = document.createElement('style');
    style.id = 'spinner-animations';
    style.textContent = `
        @keyframes flash {
            0%, 100% { filter: brightness(1); }
            50% { filter: brightness(1.5); }
        }
        .spin-button span {
            display: inline-block;
            transition: transform 0.3s ease;
        }
        .spin-button:hover span {
            transform: scale(1.1) rotate(15deg);
        }
    `;
    document.head.appendChild(style);
}

// Initial setup
updateSpinner();

// Initialize with placeholder
selectedPhoto.src = 'https://via.placeholder.com/150?text=Add+Members';
