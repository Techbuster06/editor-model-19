
// =======================================================
// TWIN-CLOUDS PHASE 2: CORE JAVASCRIPT (main.js)
// TEST MODE (Firebase + Gemini API Disabled)
// =======================================================

// -------------------------------------------------------
// A. FIREBASE (Disabled for Local Testing)
// -------------------------------------------------------
console.warn("⚠️ Firebase & Gemini API are currently disabled for testing.");

// Mock Firebase functions
function initializeApp() { return {}; }
function getAuth() { return {}; }
function signInAnonymously() { console.log("Mock: signInAnonymously() called"); }
function onAuthStateChanged(auth, callback) { 
  console.log("Mock: onAuthStateChanged triggered"); 
  callback({ uid: "mockUser123" }); 
}
function getFirestore() { return {}; }
function collection() { return {}; }
function addDoc(path, data) { 
  console.log("Mock: Saving post to Firestore:", data);
  return Promise.resolve();
}
function query() { return {}; }
function onSnapshot(q, callback) { console.log("Mock: Listening for scheduled posts"); callback({ forEach: ()=>{} }); }

// -------------------------------------------------------
// B. FIRESTORE LOGIC (Mock)
// -------------------------------------------------------
let currentUserId = "mockUser123";

async function savePostToFirestore(postData) {
  console.log("🟢 Mock Firestore Save:", postData);
  alert("✅ (Test Mode) Post saved locally!");
}

function listenForScheduledPosts() {
  console.log("📅 Mock: Listening for posts (test mode)");
}

// -------------------------------------------------------
// C. MOCK AUTH FLOW
// -------------------------------------------------------
onAuthStateChanged({}, (user) => {
  if (user) {
    currentUserId = user.uid;
    listenForScheduledPosts();
    if (document.getElementById('calendarGrid')) {
      console.log("Mock: renderCalendar() skipped in test mode");
    }
  } else {
    signInAnonymously();
  }
});

// -------------------------------------------------------
// D. Gemini API (Disabled for Local Testing)
// -------------------------------------------------------
async function fetchGeminiResponse(prompt) {
  console.log("Mock Gemini called with prompt:", prompt);
  return `✨ Mock AI Response for: "${prompt}"`;
}

// -------------------------------------------------------
// E. Handle AI Generation Button
// -------------------------------------------------------
async function handleAIGeneration(e) {
  e.preventDefault();

  const promptInput = document.getElementById("topic");
  const toneSelect = document.getElementById("tone");
  const formatSelect = document.getElementById("format");
  const outputContainer = document.getElementById("ai-results-output");
  const generateBtn = document.getElementById("ai-generate-btn");

  const prompt = promptInput.value.trim();
  const tone = toneSelect.value;
  const format = formatSelect.value;

  if (prompt.length < 5) {
    alert("Please enter a longer prompt (at least 5 characters)!");
    return;
  }

  const originalText = generateBtn.textContent;
  generateBtn.textContent = "Generating...";
  generateBtn.disabled = true;
  outputContainer.innerHTML = `<div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Simulating AI generation...</div>`;

  try {
    const result = await fetchGeminiResponse(prompt);
    const formattedResult = result.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    outputContainer.innerHTML = `
      <div class="result-box">
        <p class="result-meta">Generated for: ${format} | Tone: ${tone}</p>
        <p class="ai-output-text">${formattedResult}</p>
        <div class="result-actions">
          <button class="btn btn-secondary"><i class="fas fa-copy"></i> Copy</button>
          <button class="btn btn-accent"><i class="fas fa-calendar-plus"></i> Schedule</button>
        </div>
      </div>
    `;
  } catch (error) {
    outputContainer.innerHTML = `<p class="error-message">Error generating content: ${error.message}</p>`;
    console.error("AI Generation Error:", error);
  } finally {
    generateBtn.textContent = originalText;
    generateBtn.disabled = false;
  }
}

// -------------------------------------------------------
// D. INSTAGRAM FEED
// -------------------------------------------------------
const INSTAGRAM_ID = "17841477231695125";
const ACCESS_TOKEN = "EAAVgkpIbjnwBP2oLQEnysRZCzKnMf9sMJ0cFv99MyS0NQXBmPjS3lLk8iosIOoyAZA7syFzNLZBr7De7irByp2gZAA08wUCLzZAxUxbg7uROnEaFhu5ffRUToQD8d76BPoqal88NLTgWGjdGSdqGOC9vSBC98QCHwYbEXAlkIWsheTrdiRtq9yJHkVsgVZAZBIF2KZCXNJgLmOSE9PJYMCX1";
const FEED_CONTAINER_ID = "instagram-feed-container";
async function fetchInstagramFeed() {
    const container = document.getElementById(FEED_CONTAINER_ID);
    if (!container) return;


    container.innerHTML = "";
    const endpoint = `https://graph.facebook.com/v19.0/${INSTAGRAM_ID}/media?fields=caption,media_url,media_type,permalink,timestamp,thumbnail_url,like_count,comments_count&access_token=${ACCESS_TOKEN}&limit=6`;
    try {
        const res = await fetch(endpoint);
        // 🚨 NEW CRITICAL CHECK: If the response is not OK (e.g., 400, 403, 500)
    if (!res.ok) {
        const errorData = await res.json();
        // Use console.error for developers and innerHTML for users
        console.error("Instagram API Error:", errorData); 
        container.innerHTML = `<p class="error-message">Failed to load feed: ${errorData.error.message || res.statusText}. Please check Access Token permissions.</p>`;
        return;
    }
        const data = await res.json();
        const posts = data.data || [];
        if (posts.length === 0) {
            container.innerHTML = "<p>No posts found.</p>";
            return;
        }
        posts.forEach(post => {
            const card = document.createElement("a");
            card.href = post.permalink;
            card.target = "_blank";
            card.classList.add("instagram-post-card");
            const mediaHTML = post.media_type === "VIDEO"
                ? `<div class="video-overlay"><i class="fas fa-play"></i></div><img src="${post.thumbnail_url || post.media_url}" alt="Video">`
                : `<img src="${post.media_url}" alt="Image">`;
           card.innerHTML = `
    ${mediaHTML}
    <div class="overlay">
        <div class="overlay-content">
            <span><i class="fas fa-heart"></i> ${post.like_count || 0}</span>
            <span><i class="fas fa-comment"></i> ${post.comments_count || 0}</span>
        </div>
    </div>`;
            container.appendChild(card);
        });
    } catch (err) {
        container.innerHTML = `<p class="error-message">Failed to load Instagram feed.</p>`;
    }
}
document.addEventListener("DOMContentLoaded", () => {

    // Hamburger Menu Toggle
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('nav-links');
    // ... (rest of your DOMContentLoaded code) ...
});

// -------------------------------------------------------
// AI STUDIO LOGIC (COMBINED HANDLERS)
// -------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
    // A. INPUT MODE SWITCH HANDLER
    const mode = document.getElementById("inputMode");
    const area = document.getElementById("recycleInputArea");
    const fileSec = document.getElementById("fileUploadSection");
    const urlSec = document.getElementById("urlInputSection");
    const textSec = document.getElementById("textInputSection");

    if (mode) {
        mode.addEventListener("change", () => {
            const value = mode.value;
            area.style.display = value === "topic" ? "none" : "block";
            fileSec.style.display = value === "file" ? "block" : "none";
            urlSec.style.display = value === "url" ? "block" : "none";
            textSec.style.display = value === "text" ? "block" : "none";
        });
    }

   // ✅ CONNECT GEMINI LIVE GENERATION
document.getElementById("ai-generate-btn")?.addEventListener("click", handleAIGeneration);
});

// -------------------------------------------------------
// SCHEDULER: CAMPAIGN TEMPLATE HANDLER (ENHANCED)
// -------------------------------------------------------
/**
 * Creates a typewriter animation effect in a textarea element.
 * @param {HTMLTextAreaElement} element - The textarea element to target.
 * @param {string} text - The full text to be typed out.
 * @param {number} delay - The delay (in milliseconds) between each character.
 */
function typewriterEffect(element, text, delay = 40) {
  element.value = ''; 
  let i = 0;
  // 1. Add 'typing' class for CSS cursor animation
  element.classList.add('typing'); 
  element.classList.remove('prefilled'); // Remove 'prefilled' temporarily

  function type() {
    if (i < text.length) {
      element.value += text.charAt(i);
      i++;
      setTimeout(type, delay);
    } else {
      // 2. When complete, remove 'typing' and add 'prefilled'
      element.classList.remove('typing'); 
      element.classList.add('prefilled'); 
    }
  }
  type();
}
document.addEventListener("DOMContentLoaded", () => {
    // 1. SCHEDULER: Define all constants once at the start
    const templateSelect = document.getElementById("campaignTemplate");
    const caption = document.getElementById("caption");
    const platform = document.getElementById("platform");
    const timeInput = document.getElementById("scheduleTime");
    const note = document.getElementById("templateNote");
    // New constant for the tip
    const linkedinTip = document.getElementById("linkedinTip"); 

    // 2. SCHEDULER: Campaign Template Handler Logic
    if (templateSelect) {
        templateSelect.addEventListener("change", () => {
            const val = templateSelect.value;
            note.style.display = "none";
            if (!val) return;

            const now = new Date();
            let preset = {};

            switch (val) {
                case "productLaunch":
                    preset = {
                        caption: "🚀 Launching our brand new product! Stay tuned for exclusive offers.",
                        platform: "Instagram",
                        time: new Date(now.getTime() + 2 * 60 * 60 * 1000)
                    };
                    break;
                case "eventHype":
                    preset = {
                        caption: "🎉 Join our upcoming event this weekend! RSVP today. #Event #Hype",
                        platform: "LinkedIn",
                        time: new Date(now.getTime() + 4 * 60 * 60 * 1000)
                    };
                    break;
                case "weeklyTips":
                    preset = {
                        caption: "💡 Weekly Tip: Consistency builds engagement. Stay visible!",
                        platform: "X",
                        time: new Date(now.getTime() + 24 * 60 * 60 * 1000)
                    };
                    break;
                // <<< ADDED NEW B2B TEMPLATE CASE >>>
                case "thoughtLeadership":
                    preset = {
                        caption: "The future of B2B marketing relies on authentic content, not just automation. Here are three steps to get started:\n\n1. Identify 3 core value topics.\n2. Write simple, short paragraphs.\n3. End with a question to drive comments.",
                        platform: "LinkedIn",
                        time: new Date(now.getTime() + 10 * 60 * 60 * 1000)
                    };
                    break;
                // <<< END NEW CASE >>>
                case "custom":
                default:
                    preset = {};
            }
            
            // This is the correct placement for updatePredictiveScore()
            updatePredictiveScore();

            if (caption && preset.caption) {
                typewriterEffect(caption, preset.caption, 40); 
            }

            if (platform && preset.platform) platform.value = preset.platform;

            if (timeInput && preset.time) {
                const formatted = preset.time.toISOString().slice(0, 16);
                timeInput.value = formatted;
            }

            // Show confirmation note with a delay
            setTimeout(() => {
                note.style.display = "block";
            }, 200);
        });
    }

    // 3. SCHEDULER: LinkedIn Tip Visibility Logic
    // This logic runs once on load, and attaches listeners to the platform/template selectors.
    if (platform && linkedinTip) {
        
        const toggleLinkedInTip = () => {
            // Check if the currently selected value is 'LinkedIn'
            if (platform.value === "LinkedIn") {
                linkedinTip.style.display = "block"; // SHOW the tip
            } else {
                linkedinTip.style.display = "none";  // HIDE the tip for other platforms
            }
        };

        // A. Initial check (CRUCIAL: Shows the tip if LinkedIn is the default on load)
        toggleLinkedInTip(); 

        // B. Listener for platform changes (User manually selects a different platform)
        platform.addEventListener("change", toggleLinkedInTip);

        // C. Listener for template changes (A template sets the platform value, e.g., to LinkedIn)
        templateSelect.addEventListener("change", toggleLinkedInTip);
    }
    
    // ... (Any other global logic for the scheduler page goes here, like calendar setup) ...

});


// -------------------------------------------------------
// E. DASHBOARD & ANALYTICS BUTTON FIXES
// -------------------------------------------------------
// -------------------------------------------------------
// E. DASHBOARD & MODAL LOGIC (UPDATED)
// -------------------------------------------------------


let currentOnboardingStep = 1;
const TOTAL_ONBOARDING_STEPS = 3;


function hideOnboardingModal() {
    const modal = document.getElementById('onboardingModal');
    if (modal) {
        modal.style.display = 'none';
    }
}


// Function to control which onboarding step is visible
function showOnboardingStep(stepNumber) {
    // Hide all steps first
    document.querySelectorAll('.onboarding-step').forEach(step => {
        step.style.display = 'none';
    });


    // Show the desired step
    const targetStep = document.getElementById(`step${stepNumber}`);
    if (targetStep) {
        targetStep.style.display = 'block'; // Or 'flex' depending on your layout
    }


    // Update button visibility (You need to ensure you have these button IDs in your HTML)
    document.getElementById('onboardingNext1').style.display = (stepNumber === 1 || stepNumber === 2) ? 'inline-flex' : 'none';
    document.getElementById('onboardingDone').style.display = (stepNumber === TOTAL_ONBOARDING_STEPS) ? 'inline-flex' : 'none';
    document.getElementById('onboardingSkip2').style.display = 'inline-flex';
   
    // NEW: Control the visibility of the back button
    document.getElementById('onboardingBack').style.display = (stepNumber > 1) ? 'inline-flex' : 'none';
}


function advanceOnboarding() {
    currentOnboardingStep++;
    if (currentOnboardingStep <= TOTAL_ONBOARDING_STEPS) {
        showOnboardingStep(currentOnboardingStep);
    } else {
        hideOnboardingModal();
    }
}


// 👇 PASTE THE NEW FUNCTION HERE
function retreatOnboarding() {
    currentOnboardingStep--;
    if (currentOnboardingStep >= 1) {
        showOnboardingStep(currentOnboardingStep);
    } else {
        // If they click Back on the first step, reset to step 1
        currentOnboardingStep = 1;
    }
}
// 👆 END NEW FUNCTION


function showOnboardingModal(date = null) {
    const modal = document.getElementById('onboardingModal');
    if (modal) {
        modal.style.display = 'flex';
        // Start at the first step
        currentOnboardingStep = 1;
        showOnboardingStep(currentOnboardingStep);
       
        if (date) {
            console.log(`Scheduling for ${date}`);
        }
    }
}
// main.js (Add these functions)


// Function to show the new post modal
function showNewPostModal() {
    const modal = document.getElementById('newPostModal');
    if (modal) {
        modal.style.display = 'flex';
        // Add a class to the body to prevent background scrolling if needed
        document.body.classList.add('modal-open');
    }
}


// Function to hide the new post modal
function hideNewPostModal() {
    const modal = document.getElementById('newPostModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.classList.remove('modal-open');
    }
}


function setupDashboardButtons() {
    const newPostBtn = document.getElementById("newPostBtn");
    const queuePostBtn = document.getElementById("queuePostBtn");
    // Check if we are on the Scheduler page (which has the calendar grid)
    const isSchedulerPage = document.getElementById('calendarGrid');


    if (newPostBtn) {
        newPostBtn.addEventListener("click", (e) => {
            e.preventDefault();
           
            if (isSchedulerPage) {
                // ✅ SCHEDULER: Opens the Welcome Box/Onboarding Modal
                showOnboardingModal();
            } else {
                // ✅ DASHBOARD/ANALYTICS: Opens the New Post Dialog
                showNewPostModal();
            }
        });
    }


    // main.js (inside setupDashboardButtons)


if (queuePostBtn) {
    queuePostBtn.addEventListener("click", (e) => {
        e.preventDefault();
        // Current: alert("Queue Post clicked! (Functionality not implemented yet)");
       
        // Optional: More advanced mock
        queuePostBtn.disabled = true;
        queuePostBtn.textContent = "Scheduling...";
        setTimeout(() => {
            queuePostBtn.textContent = "Scheduled!";
            setTimeout(() => {
                queuePostBtn.textContent = "Queue Post";
                queuePostBtn.disabled = false;
            }, 1000);
        }, 1500);
    });
}
}


// -------------------------------------------------------
// F. CHARTS (Dashboard + Analytics)
// -------------------------------------------------------
function initChart(id, config) {
    const canvas = document.getElementById(id);
    if (!canvas || typeof Chart === "undefined") return;
    const ctx = canvas.getContext("2d");
    if (canvas.chart) canvas.chart.destroy();
    canvas.chart = new Chart(ctx, config);
}


function initCharts() {
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: "#FFD54F" } } },
        scales: {
            x: { ticks: { color: "#FFD54F" }, grid: { color: "rgba(255,255,255,0.05)" } },
            y: { ticks: { color: "#FFD54F" }, grid: { color: "rgba(255,255,255,0.05)" } }
        }
    };


    initChart("overviewChart", {
        type: "bar",
        data: {
            labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
            datasets: [{
                label: "Engagement",
                data: [12, 19, 8, 15, 22, 30, 25],
                backgroundColor: (ctx) => {
                    const chart = ctx.chart;
                    const { ctx: c, chartArea } = chart;
                    if (!chartArea) return;
                    const grad = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                    grad.addColorStop(0, "#00E5FF");
                    grad.addColorStop(1, "#0097A7");
                    return grad;
                },
                borderRadius: 8
            }]
        },
        options
    });


    initChart("engagementChart", {
        type: "doughnut",
        data: {
            labels: ["Likes", "Comments", "Shares"],
            datasets: [{
                data: [145, 32, 18],
                backgroundColor: ["#FFD54F", "#00E5FF", "#4DD0E1"],
                borderWidth: 0
            }]
        },
        options: { ...options, cutout: "65%" }
    });

    // main.js (Add this block inside the initCharts function)

    initChart("platformChart", {
        type: "doughnut",
        data: {
            labels: ["LinkedIn", "Facebook", "Instagram", "Twitter"],
            datasets: [{
                // Mock data representing platform impressions (e.g., total impressions: 15.2K)
                data: [6000, 4500, 3200, 1500],
                // Platform-specific colors for easy identification
                backgroundColor: ["#0A66C2", "#4267B2", "#C13584", "#1DA1F2"], 
                borderWidth: 0
            }]
        },
        // Re-use the common options, but set a cutout for the doughnut effect
        options: { 
            ...options, 
            cutout: "65%",
            plugins: {
                legend: { 
                    position: 'bottom', // Move legend to the bottom
                    labels: { 
                        color: "#FFD54F" 
                    } 
                } 
            },
        }
    });

// ... The rest of the initCharts function continues here


    initChart("growthChart", {
        type: "line",
        data: {
            labels: ["Day 1", "Day 15", "Day 30", "Day 45", "Day 60", "Day 75", "Day 90"],
            datasets: [
                { label: "Total Reach", data: [2000, 2400, 3100, 3500, 4100, 4800, 5500], borderColor: "#00E5FF", fill: true, backgroundColor: "rgba(0,229,255,0.1)", tension: 0.4 },
                { label: "Followers", data: [1500, 1650, 1800, 2050, 2200, 2450, 2700], borderColor: "#FFD54F", tension: 0.4 }
            ]
        },
        options
    });


    initChart("engagementComparisonChart", {
        type: "bar",
        data: {
            labels: ["Likes", "Comments", "Shares", "Saves"],
            datasets: [
                { label: "Facebook", data: [180, 45, 12, 5], backgroundColor: "#4267B2" },
                { label: "Instagram", data: [350, 75, 20, 30], backgroundColor: "#C13584" },
                { label: "LinkedIn", data: [90, 20, 8, 2], backgroundColor: "#0A66C2" }
            ]
        },
        options: { ...options, scales: { x: { stacked: true }, y: { stacked: true } } }
    });


 // ... (The engagementComparisonChart block ends here)
// In main.js, inside the initCharts function
// REPLACE the entire block for initChart("bestDaysChart", ...) with this:


    initChart("bestDaysChart", {
        type: "bar",
        data: {
            labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
            datasets: [{
                label: "Avg Engagement Score",
                data: [75, 80, 90, 65, 85, 50, 40],
                // ... (Keep your custom background gradient logic)
                // 🛠️ START OF COLOR CHANGE 🛠️
                backgroundColor: (ctx) => {
                    const chart = ctx.chart;
                    const { ctx: c, chartArea } = chart;
                    if (!chartArea) return;
                   
                    // Create a horizontal gradient using your existing blue tones
                    const grad = c.createLinearGradient(chartArea.left, 0, chartArea.right, 0);
                   
                    // Lighter Sky Blue (consistent with your other charts)
                    grad.addColorStop(0, "rgba(0, 229, 255, 0.5)"); // #00E5FF with transparency
                   
                    // Darker Blue/Cyan (consistent with your other charts)
                    grad.addColorStop(1, "#0097A7"); // A deep cyan/teal for the end of the bar
                   
                    return grad;
                },
                // Change the border color to match the blue tone
                borderColor: "#00E5FF",
                // 🛠️ END OF COLOR CHANGE 🛠️
                borderWidth: 1,
                borderRadius: 6
            }]
        },
        // Manually re-specify options, including the required indexAxis
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false } // Hide the legend
            },
            indexAxis: 'y', // CRITICAL: Makes it horizontal
            scales: {
                x: {
                    ticks: { color: "#FFD54F" },
                    grid: { color: "rgba(255,255,255,0.05)" },
                    title: { display: true, text: 'Engagement Score', color: "#FFD54F" }
                },
                y: {
                    ticks: { color: "#FFD54F" },
                    grid: { display: false } // Hide horizontal grid lines
                }
            }
        }
    });
} 
// ---------- Quick Video Editor improved logic ----------
document.addEventListener("DOMContentLoaded", () => {
  // elements
  const editorModal = document.getElementById("quickVideoEditor");
  const quickVideoBtns = document.querySelectorAll(".quick-video-btn");
  const closeBtn = document.getElementById("closeEditor");
  const videoPreview = document.getElementById("videoPreview");
  const overlayContainer = document.querySelector(".overlay-container") || document.getElementById("videoContainer");
  const toolbar = document.getElementById("floatingToolbar");
  const videoContainer = document.getElementById("videoContainer");
  const textToolbar = document.getElementById("textToolbar");
  const trashBin = document.getElementById("trashBin");

  // open modal
  quickVideoBtns.forEach(btn => btn.addEventListener("click", e => {
    e.preventDefault();
    if (!editorModal) return;
    editorModal.style.display = "flex";
    videoPreview.play();
  }));

  // close
  if (closeBtn) closeBtn.addEventListener("click", () => { editorModal.style.display = "none"; videoPreview.pause(); });

  // play/pause
  const playPauseBtn = document.getElementById("playPause");
  if (playPauseBtn) playPauseBtn.addEventListener("click", () => {
    if (videoPreview.paused) { videoPreview.play(); playPauseBtn.textContent = "⏸️"; }
    else { videoPreview.pause(); playPauseBtn.textContent = "▶️"; }
  });

  // add text
  const addTextBtn = document.getElementById("addText");
  addTextBtn && addTextBtn.addEventListener("click", () => {
    const text = document.createElement("div");
    text.className = "editable-text";
    text.contentEditable = "false";             // start non-editing
    text.textContent = "Tap to edit";
    // place center
    const rect = videoContainer.getBoundingClientRect();
    text.style.left = (rect.width/2 - 80) + "px";
    text.style.top = (rect.height/2 - 16) + "px";
    overlayContainer.appendChild(text);
    makeDraggable(text);
    // focus on double-click to edit
    text.addEventListener("dblclick", () => enterEditMode(text));
    text.addEventListener("click", (ev) => { activeText = text; ev.stopPropagation(); });
  });

  // replace video
  const fileInput = document.getElementById("videoInput");
  const replaceBtn = document.getElementById("replaceVideo");
  replaceBtn && replaceBtn.addEventListener("click", () => fileInput.click());
  fileInput && fileInput.addEventListener("change", e => {
    const file = e.target.files[0];
    if (file) { const url = URL.createObjectURL(file); videoPreview.src = url; videoPreview.play(); }
  });

  // aspect ratio - resizes videoContainer
  function setAspect(mode) {
    if (!videoContainer) return;
    if (mode === "square") { videoContainer.style.width = "60vh"; videoContainer.style.height = "60vh"; }
    else if (mode === "vertical") { videoContainer.style.width = "45vh"; videoContainer.style.height = "80vh"; }
    else { videoContainer.style.width = "80vh"; videoContainer.style.height = "45vh"; }
  }
  document.getElementById("aspectSquare")?.addEventListener("click", () => setAspect("square"));
  document.getElementById("aspectVertical")?.addEventListener("click", () => setAspect("vertical"));
  document.getElementById("aspectHorizontal")?.addEventListener("click", () => setAspect("horizontal"));

  // filters / presets
  const filtersBtn = document.getElementById("filtersBtn");
  const filterPresets = document.getElementById("filterPresets");
  const filtersMenu = document.getElementById("filtersMenu");
  const brightness = document.getElementById("brightnessRange");
  const blur = document.getElementById("blurRange");
  const contrast = document.getElementById("contrastRange");

  filtersBtn && filtersBtn.addEventListener("click", () => {
    // toggle presets first, then sliders
    if (filterPresets && filterPresets.style.display === "flex") { filterPresets.style.display = "none"; if (filtersMenu) filtersMenu.style.display = "flex"; }
    else if (filtersMenu && filtersMenu.style.display === "flex") { filtersMenu.style.display = "none"; }
    else if (filterPresets) { filterPresets.style.display = "flex"; }
  });

  filterPresets && filterPresets.querySelectorAll("button").forEach(btn => btn.addEventListener("click", () => {
    videoPreview.className = "";
    const f = btn.dataset.filter;
    if (f && f !== "none") videoPreview.classList.add(`filter-${f}`);
    filterPresets.style.display = "none";
  }));

  function applyFilters() {
    if (!videoPreview) return;
    videoPreview.style.filter = `brightness(${brightness?.value || 100}%) blur(${blur?.value || 0}px) contrast(${contrast?.value || 100}%)`;
  }
  [brightness, blur, contrast].forEach(i => i && i.addEventListener("input", applyFilters));

  // sound
  const soundBtn = document.getElementById("soundBtn");
  const audioInput = document.getElementById("audioInput");
  const audioEl = document.getElementById("bgMusic");
  soundBtn && soundBtn.addEventListener("click", () => audioInput.click());
  audioInput && audioInput.addEventListener("change", e => {
    const file = e.target.files[0];
    if (file) { audioEl.src = URL.createObjectURL(file); audioEl.play(); }
  });

  // emoji
  const emojiBtn = document.getElementById("emojiBtn");
  const emojiMenu = document.getElementById("emojiMenu");
  emojiBtn && emojiBtn.addEventListener("click", () => { emojiMenu.style.display = emojiMenu.style.display === "block" ? "none" : "block"; });
  emojiMenu && emojiMenu.querySelectorAll("span").forEach(s => s.addEventListener("click", () => {
    const emoji = document.createElement("div");
    emoji.className = "editable-text";
    emoji.textContent = s.textContent;
    emoji.contentEditable = "false";
    overlayContainer.appendChild(emoji);
    // place center
    const r = videoContainer.getBoundingClientRect();
    emoji.style.left = (r.width/2 - 20) + "px";
    emoji.style.top = (r.height/2 - 20) + "px";
    makeDraggable(emoji);
    emojiMenu.style.display = "none";
  }));

  // inline text toolbar & selection handling
  const toolbarColor = document.getElementById("toolbarColor");
  let activeText = null;
  let isDragging = false;
  let draggedEl = null;

  // show inline toolbar when user selects within an editable text
  document.addEventListener("mouseup", (ev) => {
    setTimeout(() => { // slight delay for selection
      const sel = window.getSelection();
      if (!sel || !sel.rangeCount) { hideTextToolbar(); return; }
      const range = sel.getRangeAt(0);
      if (!range || range.collapsed) { hideTextToolbar(); return; }
      // ensure selection is inside an .editable-text
      const node = range.startContainer;
      const editable = node.nodeType === 3 ? node.parentElement.closest('.editable-text') : node.closest && node.closest && node.closest('.editable-text');
      if (editable) {
        activeText = editable;
        // position toolbar above selection (approx using bounding rect)
        const rect = range.getBoundingClientRect();
        const containerRect = videoContainer.getBoundingClientRect();
        textToolbar.style.left = Math.min(containerRect.right - 30, Math.max(20, rect.left - containerRect.left + rect.width/2)) + "px";
        textToolbar.style.top = (rect.top - containerRect.top - 44) + "px";
        textToolbar.style.display = "flex";
      } else {
        hideTextToolbar();
      }
    }, 10);
  });

  // toolbar actions (B/I/U + color)
  textToolbar.querySelectorAll("button").forEach(btn => btn.addEventListener("click", () => {
    const cmd = btn.dataset.cmd;
    // use execCommand to apply styling to selection within contentEditable
    document.execCommand(cmd, false, null);
    // keep toolbar visible
    window.getSelection().removeAllRanges();
    hideTextToolbar();
  }));
  toolbarColor && toolbarColor.addEventListener("input", (e) => {
    document.execCommand("foreColor", false, e.target.value);
    hideTextToolbar();
  });

  function hideTextToolbar() { if (textToolbar) textToolbar.style.display = "none"; }

  // double-click -> enter edit mode; single click selects
  function enterEditMode(el) {
    el.contentEditable = "true";
    el.classList.add("editing");
    el.focus();
    // create a caret at end
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }
  // exit edit mode on click outside
  document.addEventListener("click", (e) => {
    if (activeText && !e.target.closest('.editable-text')) {
      if (activeText.classList.contains('editing')) {
        activeText.contentEditable = "false";
        activeText.classList.remove("editing");
      }
      activeText = null;
      hideTextToolbar();
    }
  });

  // ---- Draggable + Trash behavior ----
  function makeDraggable(el) {
    let offsetX = 0, offsetY = 0;
    el.addEventListener("mousedown", (e) => {
      // if editing, don't drag
      if (el.classList.contains("editing")) return;
      isDragging = true;
      draggedEl = el;
      const rect = el.getBoundingClientRect();
      const containerRect = overlayContainer.getBoundingClientRect();
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;
      // activate trash
      trashBin.style.display = "block";
      trashBin.classList.add("active");
      document.body.style.userSelect = "none";
    });

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);

    function onMouseMove(e) {
      if (!isDragging || !draggedEl) return;
      const containerRect = overlayContainer.getBoundingClientRect();
      let left = e.clientX - containerRect.left - offsetX;
      let top = e.clientY - containerRect.top - offsetY;
      // clamp inside container
      left = Math.max(0, Math.min(left, containerRect.width - draggedEl.offsetWidth));
      top = Math.max(0, Math.min(top, containerRect.height - draggedEl.offsetHeight));
      draggedEl.style.left = left + "px";
      draggedEl.style.top = top + "px";

      // check if over trash
      const trashRect = trashBin.getBoundingClientRect();
      const elRect = draggedEl.getBoundingClientRect();
      const overlap = !(elRect.right < trashRect.left || elRect.left > trashRect.right || elRect.bottom < trashRect.top || elRect.top > trashRect.bottom);
      if (overlap) trashBin.classList.add("active");
      else trashBin.classList.remove("active");
    }

    function onMouseUp(e) {
      if (!isDragging) return;
      // check if dropped inside trash -> remove
      const trashRect = trashBin.getBoundingClientRect();
      const elRect = draggedEl.getBoundingClientRect();
      const overlap = !(elRect.right < trashRect.left || elRect.left > trashRect.right || elRect.bottom < trashRect.top || elRect.top > trashRect.bottom);
      if (overlap) {
        draggedEl.remove();
      }
      // cleanup
      isDragging = false;
      draggedEl = null;
      trashBin.style.display = "none";
      trashBin.classList.remove("active");
      document.body.style.userSelect = "";
    }
  }

  // speed: small auto-hide toolbar
  let hideTimer;
  document.addEventListener("mousemove", () => {
    if (!toolbar) return;
    toolbar.classList.remove("hidden");
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => toolbar.classList.add("hidden"), 3000);
  });

  // initial: attach makeDraggable to any existing editable-texts
  document.querySelectorAll(".editable-text").forEach(el => {
    makeDraggable(el);
    el.addEventListener("dblclick", () => enterEditMode(el));
    el.addEventListener("click", () => activeText = el);
  });

});

// -------------------------------------------------------
// G. DOMContentLoaded INITIALIZER (FIXED)
// -------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {

    // 1. Initialize features that exist on multiple pages (or are conditional checks)
    if (document.getElementById(FEED_CONTAINER_ID)) fetchInstagramFeed(); // Dashboard only
    if (document.getElementById("ai-generate-btn")) { // AI Studio only
        document.getElementById("ai-generate-btn").addEventListener("click", handleAIGeneration);
    }

    // Attaches listeners for "New Post" and "Queue Post" buttons (Dashboard/Scheduler)
    setupDashboardButtons();

    // Initializes Charts (Dashboard/Analytics only)
    initCharts();

    // Calendar initialization
    if (document.getElementById('calendarGrid')) {
        renderCalendar(currentCalendarDate);
        setupCalendarNavigation();
    }

    // Onboarding modal navigation
    document.getElementById("onboardingNext1")?.addEventListener("click", e => {
        e.preventDefault();
        advanceOnboarding();
    });

    document.getElementById("onboardingNext2")?.addEventListener("click", e => {
        e.preventDefault();
        advanceOnboarding();
    });

    document.getElementById("onboardingDone")?.addEventListener("click", e => {
        e.preventDefault();
        hideOnboardingModal();
    });

    document.getElementById("onboardingSkip2")?.addEventListener("click", e => {
        e.preventDefault();
        hideOnboardingModal();
    });

    document.getElementById("onboardingBack")?.addEventListener("click", e => {
        e.preventDefault();
        retreatOnboarding();
    });
    // -------------------------------------------------------------
    // 4. NEW POST MODAL LISTENERS
    // -------------------------------------------------------------
    document.getElementById('closePostModal')?.addEventListener('click', hideNewPostModal);
    document.getElementById('cancelPost')?.addEventListener('click', hideNewPostModal);
    document.getElementById('schedulePost')?.addEventListener('click', (e) => {
        e.preventDefault();
        const postContent = document.getElementById('postContent')?.value || '';
        if (postContent.trim() !== '') {
            alert(`Draft Scheduled:\n"${postContent.substring(0, 50)}..."`);
            hideNewPostModal();
            document.getElementById('postContent').value = '';
        } else {
            alert("Please enter some content for your post.");
        }
    });

    window.addEventListener('click', (event) => {
        const modal = document.getElementById('newPostModal');
        if (modal && event.target === modal) {
            hideNewPostModal();
        }
    });

    // -------------------------------------------------------------
    // 5. Analytics Export Data Button
    // -------------------------------------------------------------
    const exportDataBtn = document.getElementById("exportDataBtn");
    if (exportDataBtn) {
        exportDataBtn.addEventListener("click", (e) => {
            e.preventDefault();
            exportDataBtn.disabled = true;
            exportDataBtn.textContent = "Exporting...";
            setTimeout(() => {
                alert("Data export initiated!");
                exportDataBtn.textContent = "Export Data";
                exportDataBtn.disabled = false;
            }, 1500);
        });
    }
}); // ✅ END DOMContentLoaded



// =======================================================
// 6. UTILITY BUTTON LISTENERS (Search, Save Draft, Settings)
// =======================================================


// 6a. Search Bar Functionality (Targets the new form ID: searchForm)
const searchForm = document.getElementById('searchForm');
if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const searchInput = document.getElementById('searchInput')?.value;
        if (searchInput) {
            alert(`Searching for: "${searchInput}"... (Filter functionality not yet implemented)`);
            // Optional: clear input after search
            document.getElementById('searchInput').value = '';
        }
    });
}


// 6b. Dashboard: Save Draft Button (Targets the new button ID: saveDraftBtn)
const saveDraftBtn = document.getElementById('saveDraftBtn');
if (saveDraftBtn) {
    saveDraftBtn.addEventListener('click', async(e) => {
        e.preventDefault();
        // Assuming 'postContent' is the ID of the textarea where the user types
        const postContent = document.getElementById('postContent')?.value || '';
       
        if (postContent.trim() !== '') {
            saveDraftBtn.disabled = true;
            saveDraftBtn.textContent = "Saving...";
           
          setTimeout(async () => {
                await savePostToFirestore({
                    content: postContent,
                    platform: "Instagram",
                    timestamp: new Date().toISOString()
                });
                alert(`Draft saved successfully:\n"${postContent.substring(0, 50)}..."`);
                saveDraftBtn.disabled = false;
                saveDraftBtn.textContent = "Save Draft";
                // NOTE: We don't clear the content or close the modal here,
                // as a saved draft should remain open for editing.
            }, 1000);
        } else {
            alert("Cannot save an empty draft.");
        }
    });
}


// main.js (Locate and replace the 6c block)


// 6c. Analytics: Settings Button (Targets the new link ID: settingsBtn)
const settingsBtn = document.getElementById('settingsBtn');
if (settingsBtn) {
    settingsBtn.addEventListener('click', (e) => {
        // Prevents the link from navigating or jumping to the top of the page
        e.preventDefault();
       
       window.location.href = 'settings.html';
    });
}
// -------------------------------------------------------
// H. PREDICTIVE SCORE MODULE
// -------------------------------------------------------
function calculatePredictiveScore(text) {
  let score = 0;
  if (!text) return 0;

  const length = text.length;
  const hashtags = (text.match(/#/g) || []).length;

  // base score from length (ideal: 80–200 chars)
  if (length >= 80 && length <= 200) score += 60;
  else if (length > 200 && length <= 300) score += 50;
  else score += 30;

  // hashtags bonus (1–3 optimal)
  if (hashtags === 1) score += 10;
  else if (hashtags === 2 || hashtags === 3) score += 20;
  else if (hashtags > 3) score += 5;

  // time-of-day factor
  const hour = new Date().getHours();
  if (hour >= 8 && hour <= 11) score += 10;     // morning window
  else if (hour >= 18 && hour <= 21) score += 15; // evening prime time
  else score += 5;

  // clamp & round
  return Math.min(100, Math.round(score));
}

function updatePredictiveScore() {
  const captionEl = document.getElementById("caption");
  const boxEl = document.getElementById("predictiveScoreBox");
  if (!captionEl || !boxEl) return;

  const text = captionEl.value.trim();
  const score = calculatePredictiveScore(text);
  let performance = "average";

  if (score > 85) performance = "excellent";
  else if (score > 70) performance = "good";
  else if (score > 50) performance = "fair";
  else performance = "low";

  boxEl.textContent = `AI Predictive Score: ${score}/100 (${performance})`;
}

// attach listener
document.addEventListener("DOMContentLoaded", () => {
  const captionEl = document.getElementById("caption");
  if (captionEl) captionEl.addEventListener("input", updatePredictiveScore);
});

// -------------------------------------------------------
// I. CALENDAR SCHEDULER LOGIC (FIXED CLEAN VERSION)
// -------------------------------------------------------

let currentCalendarDate = new Date();

/**
 * Helper to generate icons for platforms.
 */
function getPlatformIcon(platform) {
  switch (platform.toLowerCase()) {
    case "instagram": return '<i class="fab fa-instagram"></i>';
    case "facebook": return '<i class="fab fa-facebook"></i>';
    case "linkedin": return '<i class="fab fa-linkedin"></i>';
    default: return '<i class="fas fa-link"></i>';
  }
}

// === Render small colored pills for posts on calendar cells ===
function renderPostDetails(cell, posts) {
  try {
    cell.classList.add("has-scheduled-posts");

    let postsContainer = cell.querySelector(".posts");
    if (!postsContainer) {
      postsContainer = document.createElement("div");
      postsContainer.classList.add("posts");
      cell.appendChild(postsContainer);
    }

    postsContainer.innerHTML = "";

    posts.forEach(post => {
      const postPill = document.createElement("div");
      postPill.classList.add("post-pill", `post-${post.platform.toLowerCase()}`);
      postPill.innerHTML = `
        <span class="post-platform-icon" title="${post.platform}">
          ${getPlatformIcon(post.platform)}
        </span>
        <span class="post-time">${post.time}</span>
      `;
      if (post.caption) postPill.title = post.caption;
      postsContainer.appendChild(postPill);
    });
  } catch (err) {
    console.error("Error rendering post details:", err);
  }
}

// -------------------------------------------------------
// AI Suggested Time Mock Logic
// -------------------------------------------------------
const aiSuggestedTimeDisplay = document.getElementById("aiSuggestedTimeDisplay");
const aiSuggestedTimeValue = document.getElementById("aiSuggestedTimeValue");
const useSuggestedTimeBtn = document.getElementById("useSuggestedTimeBtn");

function generateSuggestedTime() {
  const hours = ["9:00 AM", "11:30 AM", "2:00 PM", "5:30 PM", "8:00 PM"];
  return hours[Math.floor(Math.random() * hours.length)];
}

function showSuggestedTime() {
  const suggested = generateSuggestedTime();
  aiSuggestedTimeValue.textContent = suggested;
  aiSuggestedTimeDisplay.querySelector(".time-visual").textContent = "⏰";
  document.getElementById("ai-suggested-note").textContent =
    "AI recommends this time for max engagement!";
}

useSuggestedTimeBtn?.addEventListener("click", () => {
  alert(
    `✅ Suggested time "${aiSuggestedTimeValue.textContent}" applied to your next scheduled post!`
  );
});

// Trigger suggestion when a day cell is clicked
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("day-cell")) {
    showSuggestedTime();
  }
});

// 🌈 AUTO-GENERATED MOCK POSTS — new every month
function generateMonthlyMockPosts() {
  const platforms = ["Instagram", "Facebook", "LinkedIn"];
  const captions = [
    "Morning inspiration post 🌞",
    "Team update 💼",
    "Automation success story 🧠",
    "Midweek motivation 💪",
    "Weekend marketing tips 💡",
    "Creative content showcase 🎨",
    "Evening recap 📊",
    "Daily engagement booster 🚀",
    "Behind the scenes 🎬",
    "Gratitude moment 🙏"
  ];

  const currentMonth = currentCalendarDate.getMonth() + 1; // 1–12
  const currentYear = currentCalendarDate.getFullYear();
  const totalDays = new Date(currentYear, currentMonth, 0).getDate();

  const mockPosts = [];

  // Generate 8–12 colorful posts randomly spread through the month
  const numPosts = Math.floor(Math.random() * 5) + 8; // between 8–12
  for (let i = 0; i < numPosts; i++) {
    const randomDay = Math.floor(Math.random() * totalDays) + 1;
    const day = randomDay < 10 ? `0${randomDay}` : randomDay;
    const month = currentMonth < 10 ? `0${currentMonth}` : currentMonth;
    const dateStr = `${currentYear}-${month}-${day}`;

    const platform =
      platforms[Math.floor(Math.random() * platforms.length)];
    const caption =
      captions[Math.floor(Math.random() * captions.length)];

    const hours = ["9:00 AM", "11:30 AM", "2:00 PM", "5:30 PM", "8:00 PM"];
    const time = hours[Math.floor(Math.random() * hours.length)];

    mockPosts.push({
      date: dateStr,
      posts: [
        { time, platform, caption }
      ]
    });
  }

  return mockPosts;
}

// 🧩 generate for current calendar month
var mockPosts = generateMonthlyMockPosts();

async function loadScheduledPosts() {
  // Clear any old posts visually
  document
    .querySelectorAll(".day-cell.has-scheduled-posts")
    .forEach((cell) => {
      cell.classList.remove("has-scheduled-posts");
      cell.querySelector(".posts")?.remove();
    });

  const currentMonthYear = currentCalendarDate.toISOString().substring(0, 7);
  const allPosts = []; // combine Firestore + mock

  // === 1️⃣ Load from Firestore if user is logged in
  try {
    if (typeof db !== "undefined" && currentUserId) {
      const q = query(collection(db, `users/${currentUserId}/posts`));
      const snapshot = await getDocs(q);

      snapshot.forEach((doc) => {
        const post = doc.data();
        const dateObj = new Date(post.timestamp);
        const dateStr = dateObj.toISOString().substring(0, 10);
        if (dateStr.startsWith(currentMonthYear)) {
          allPosts.push({
            date: dateStr,
            posts: [
              {
                time: dateObj.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
                platform: post.platform || "Instagram",
                caption: post.caption || "",
              },
            ],
          });
        }
      });
    }
  } catch (err) {
    console.error("❌ Firestore load error:", err);
  }

  // === 2️⃣ Add MOCK posts for the same month (but skip duplicates)
  mockPosts.forEach((mock) => {
    if (mock.date.substring(0, 7) === currentMonthYear) {
      // Skip if Firestore already has a post for that same date
      const exists = allPosts.some((real) => real.date === mock.date);
      if (!exists) allPosts.push(mock);
    }
  });

  // === 3️⃣ Render everything
  allPosts.forEach((entry) => {
    const cell = document.querySelector(`.day-cell[data-date="${entry.date}"]`);
    if (cell) renderPostDetails(cell, entry.posts);
  });

  console.log("📅 Loaded posts combined:", allPosts.length);
}
                 
function renderCalendar(date) {
    const grid = document.getElementById("calendarGrid");
    const monthTitle = document.getElementById("monthTitle");
    if (!grid || !monthTitle) return;


    // Clear previous cells
    grid.innerHTML = "";


    // Get month details
    const year = date.getFullYear();
    const month = date.getMonth();
   
    // Set the month title (e.g., "October 2025")
    monthTitle.textContent = date.toLocaleString('default', { month: 'long', year: 'numeric' });


    // Determine first day of the month and last day of the month
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
   
    // Calculate the offset (how many empty cells before the 1st)
    // .getDay() returns 0 for Sunday, 1 for Monday, etc.
    const startOffset = firstDayOfMonth.getDay();


    // 1. Add 'placeholder' cells for days from previous month
    // Calculate the previous month's days to fill the gap (e.g., September 28, 29, 30)
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startOffset - 1; i >= 0; i--) {
        const prevDay = prevMonthLastDay - i;
        const emptyCell = document.createElement('div');
        emptyCell.classList.add('day-cell', 'muted');
        emptyCell.innerHTML = `<span class="day-number">${prevDay}</span><p class="day-empty">No posts</p>`;
        grid.appendChild(emptyCell);
    }


    // 2. Add 'day' cells for the current month
    for (let day = 1; day <= daysInMonth; day++) {
        // Date format: YYYY-M-D (Note: JavaScript month is 0-indexed, but data-date should be 1-indexed)
        const monthNumber = month + 1 < 10 ? `0${month + 1}` : month + 1;
        const dayNumber = day < 10 ? `0${day}` : day;
        const fullDateString = `${year}-${monthNumber}-${dayNumber}`;
       
        const dayCell = document.createElement('div');
        dayCell.classList.add('day-cell');
        dayCell.setAttribute('data-date', fullDateString);
        dayCell.innerHTML = `<span class="day-number">${day}</span><p class="day-empty">No posts</p>`;
       
        // Add styling/classes for today's date
        const today = new Date();
        if (year === today.getFullYear() && month === today.getMonth() && day === today.getDate()) {
            dayCell.classList.add('today');
        }


       // Add event listener to open new post form/modal on cell click
dayCell.addEventListener('click', () => {
    // When user clicks a date, fill the AI suggested time card for that specific day
    try {
        suggestTimeForDate(fullDateString);
    } catch (err) {
        console.error('Failed to compute suggested time:', err);
    }
    showOnboardingModal(fullDateString);
});

        grid.appendChild(dayCell);
    }


    // 3. Add 'placeholder' cells for days from next month (to fill the final row)
    const totalCells = startOffset + daysInMonth;
    const remainingCells = 42 - totalCells; // 6 rows * 7 days = 42 total cells
   
    if (totalCells <= 35) { // If it's a 5-week month, fill the rest up to 35
        for (let i = 1; i <= (35 - totalCells); i++) {
             const emptyCell = document.createElement('div');
             emptyCell.classList.add('day-cell', 'muted');
             emptyCell.innerHTML = `<span class="day-number">${i}</span><p class="day-empty">No posts</p>`;
             grid.appendChild(emptyCell);
        }
    } else if (totalCells > 35) { // If it's a 6-week month, fill up to 42
        for (let i = 1; i <= (42 - totalCells); i++) {
             const emptyCell = document.createElement('div');
             emptyCell.classList.add('day-cell', 'muted');
             emptyCell.innerHTML = `<span class="day-number">${i}</span><p class="day-empty">No posts</p>`;
             grid.appendChild(emptyCell);
        }
    }
   
   // 🔁 Re-generate new mock posts for the new month
mockPosts = generateMonthlyMockPosts();

// After rendering the structure, load any scheduled posts
loadScheduledPosts();
}

/* ===========================
   AI SUGGESTED TIME (Mocked)
   Injects suggestion into scheduler sidebar when a date is selected
   =========================== */

function getAISuggestedTimeForDate(dateString) {
    // dateString -> "YYYY-MM-DD"
    // Mocked suggestion logic: deterministic-ish based on day value so it doesn't feel random each click
    // (This keeps suggestions looking stable across re-renders in the same month.)
    try {
        const day = parseInt(dateString.split('-')[2], 10);
        const buckets = [
            "09:00 AM", "11:30 AM", "01:00 PM", "03:30 PM", "05:00 PM", "07:30 PM", "09:00 PM"
        ];
        // Use day to pick a bucket (wrap around)
        return buckets[day % buckets.length];
    } catch (err) {
        return "05:00 PM";
    }
}

function suggestTimeForDate(dateString) {
    const valueEl = document.getElementById('aiSuggestedTimeValue');
    const noteEl = document.getElementById('ai-suggested-note');
    if (!valueEl || !noteEl) return;
    const suggested = getAISuggestedTimeForDate(dateString);
    valueEl.textContent = suggested;
    noteEl.textContent = `Suggested for ${dateString} — estimated peak engagement (mock).`;
    // Store the last suggested into session so "Use Suggested Time" can access it
    sessionStorage.setItem('lastSuggestedTime', suggested);
    sessionStorage.setItem('lastSuggestedDate', dateString);
}

// Wire the "Use Suggested Time" button (stores into localStorage to be used by scheduling flow)
document.getElementById('useSuggestedTimeBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    const suggested = sessionStorage.getItem('lastSuggestedTime');
    const date = sessionStorage.getItem('lastSuggestedDate');
    if (!suggested || !date) {
        alert("Please pick a date on the calendar to get a suggestion first.");
        return;
    }
    // Save to localStorage so your scheduler or new post modal can use it
    localStorage.setItem('scheduledSuggestedTime', suggested);
    localStorage.setItem('scheduledSuggestedDate', date);
    // Provide a subtle confirmation
    alert(`Suggested time ${suggested} saved for ${date}. You can now use it when scheduling your post.`);
});

function setupCalendarNavigation() {
    // Navigate to previous month
    // The '?' here prevents the error on pages without the button (like dashboard.html)
    document.getElementById('prevMonth')?.addEventListener('click', () => {
        currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
        renderCalendar(currentCalendarDate);
    });


    // Navigate to next month
    document.getElementById('nextMonth')?.addEventListener('click', () => {
        currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
        renderCalendar(currentCalendarDate);
    });
}
// === AI Coach Rotating Tips ===
const coachTips = [
  "Insight: Your Reels engagement jumped 32% this week — keep posting short videos!",
  "Action: Try scheduling more posts on Fridays — audience is most active.",
  "Tip: Use bright thumbnails — they’re driving 20% more clicks.",
  "Reminder: Add hashtags for trending reach this weekend.",
  "Insight: Carousel posts are performing better than single images lately."
];

function rotateCoachTips() {
  const tip = document.getElementById("coachTip");
  const typing = document.getElementById("coachTyping");
  if (!tip) return;
  let index = 0;
  setInterval(() => {
    typing.style.opacity = 1;
    setTimeout(() => {
      tip.textContent = coachTips[index];
      typing.style.opacity = 0;
      index = (index + 1) % coachTips.length;
    }, 800);
  }, 6000);
}
document.addEventListener("DOMContentLoaded", rotateCoachTips);