import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js";
import { getFirestore, collection, addDoc, getDocs, getDoc, doc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Your Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDyfler3VAs9JNssUtunBt8nUuu1mDaY2w",
    authDomain: "upgrade-e8667.firebaseapp.com",
    projectId: "upgrade-e8667",
    storageBucket: "upgrade-e8667.firebasestorage.app",
    messagingSenderId: "142301877051",
    appId: "1:142301877051:web:64d8bc50a07277eea99d1e",
    measurementId: "G-NNDBX81G3K"
};

// Initialize Firebase, Auth, and Firestore
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);

// Elements
const navHome = document.getElementById('nav-home');
const navStash = document.getElementById('nav-stash');
const homeView = document.getElementById('home-view');
const stashView = document.getElementById('stash-view');

// Navigation Logic
navHome.addEventListener('click', (e) => {
    e.preventDefault();
    homeView.classList.remove('hidden');
    stashView.classList.add('hidden');
    navHome.classList.add('active');
    navStash.classList.remove('active');
});

navStash.addEventListener('click', async () => {
    const enteredPin = prompt('Enter Password:');
    if (enteredPin === null) return;

    try {
        // Sign in anonymously first so Firestore permits reading the settings doc
        await signInAnonymously(auth);

        // Fetch the PIN from Firestore (Collection: "settings", Document: "access")
        const pinDocRef = doc(db, "settings", "access");
        const pinSnap = await getDoc(pinDocRef);

        let correctPin = '2412'; // Fallback fallback if document doesn't exist yet
        if (pinSnap.exists()) {
            correctPin = pinSnap.data().pin;
        }

        if (enteredPin === correctPin) {
            homeView.classList.add('hidden');
            stashView.classList.remove('hidden');
            navStash.classList.add('active');
            navHome.classList.remove('active');
            await renderStash();
        } else {
            alert('Access Denied: Incorrect Password');
        }
    } catch (error) {
        console.error("Auth or PIN verification error:", error);
        alert("Authentication failed.");
    }
});

// Upgrade Button Handler (Saves IP publicly)
document.getElementById('upgrade-btn').addEventListener('click', async function () {
    const button = this;
    button.disabled = true;
    button.textContent = 'Verifying...';

    try {
        const response = await fetch('https://api.ipify.org?format=json');
        if (!response.ok) throw new Error('Network error');

        const data = await response.json();

        await addDoc(collection(db, "ip_stash"), {
            ip: data.ip,
            time: new Date().toLocaleString(),
            timestamp: Date.now()
        });

        button.textContent = 'Upgrade Claimed!';
    } catch (error) {
        console.error("Error saving IP:", error);
        button.disabled = false;
        button.textContent = 'Try Again';
    }
});

// Fetch and Render Stash (Requires Auth)
async function renderStash() {
    const stashList = document.getElementById('stash-list');
    stashList.innerHTML = '<p class="empty-msg">Loading from Firestore...</p>';

    try {
        const q = query(collection(db, "ip_stash"), orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            stashList.innerHTML = '<p class="empty-msg">Stash is empty.</p>';
            return;
        }

        let html = '';
        querySnapshot.forEach((doc) => {
            const entry = doc.data();
            html += `
                <div class="stash-item">
                    <span class="stash-ip">${entry.ip}</span>
                    <span class="stash-time">${entry.time}</span>
                </div>
            `;
        });
        stashList.innerHTML = html;
    } catch (error) {
        console.error("Error fetching stash:", error);
        stashList.innerHTML = '<p class="empty-msg">Access denied or failed to load logs.</p>';
    }
}

document.getElementById('clear-stash-btn').addEventListener('click', async () => {
    await renderStash();
});