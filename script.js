let habits = [];
let habitIdCounter = 1;
let userIdentity = "";

// --- Utility Functions ---
function getLastWeekDates() {
  const dates = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    dates.push(date.toISOString().split("T")[0]);
  }
  return dates;
}

function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

// --- Local Storage Management ---
function saveState() {
  localStorage.setItem("atomicHabits", JSON.stringify(habits));
  localStorage.setItem("atomicHabitIdCounter", habitIdCounter);
  localStorage.setItem("atomicUserIdentity", userIdentity);
}

function loadState() {
  const savedHabits = localStorage.getItem("atomicHabits");
  const savedCounter = localStorage.getItem("atomicHabitIdCounter");
  const savedIdentity = localStorage.getItem("atomicUserIdentity");

  if (savedHabits) {
    habits = JSON.parse(savedHabits);
    // Ensure `completed` status for today is reset for new day
    habits.forEach((habit) => {
      const today = getTodayDate();
      if (!habit.completionHistory[today]) {
        habit.completed = false;
      }
    });
  } else {
    initSampleHabits();
  }

  if (savedCounter) {
    habitIdCounter = parseInt(savedCounter);
  }

  if (savedIdentity) {
    userIdentity = savedIdentity;
    document.getElementById("identityText").value = userIdentity;
  }
}

// --- Identity-Based Habits ---
function saveIdentity() {
  userIdentity = document.getElementById("identityText").value.trim();
  saveState();
  alert("Your identity statement has been saved!");
}

// --- Habit Form & Logic ---
function toggleAddForm() {
  const form = document.getElementById("habitForm");
  form.classList.toggle("show");
  if (!form.classList.contains("show")) {
    clearForm();
  }
}

function clearForm() {
  document.getElementById("habitName").value = "";
  document.getElementById("habitCategory").value = "health";
  document.getElementById("habitIdentity").value = "";
  document.getElementById("habitCue").value = "";
  document.getElementById("habitTwoMinute").value = "";
  document.getElementById("habitReward").value = "";
}

function addHabit() {
  const name = document.getElementById("habitName").value.trim();
  const category = document.getElementById("habitCategory").value;
  const identity = document.getElementById("habitIdentity").value.trim();
  const cue = document.getElementById("habitCue").value.trim();
  const twoMinute =
    document.getElementById("habitTwoMinute").value.trim() ||
    `Do 2 minutes of "${name}"`;
  const reward = document.getElementById("habitReward").value.trim();

  if (!name) {
    alert("Please enter a habit name.");
    return;
  }

  const newHabit = {
    id: habitIdCounter++,
    name,
    category,
    identity,
    cue,
    twoMinute,
    reward,
    streak: 0,
    completed: false,
    completionHistory: {},
  };

  habits.push(newHabit);
  saveState();
  renderHabits();
  updateStats();
  toggleAddForm();
}

function toggleHabitCompletion(habitId) {
  const habit = habits.find((h) => h.id === habitId);
  const today = getTodayDate();

  if (habit) {
    habit.completed = !habit.completed;
    habit.completionHistory[today] = habit.completed;

    // Update streak logic: if completed today, increment. If uncompleted today, check history.
    if (habit.completed) {
      habit.streak = calculateCurrentStreak(habit);
    } else {
      // If marking incomplete, recalculate streak from previous day's data
      habit.streak = calculateCurrentStreak(habit);
    }

    saveState();
    renderHabits();
    updateStats();
  }
}

function calculateCurrentStreak(habit) {
  let currentStreak = 0;
  let currentDate = new Date();
  const today = getTodayDate();

  // Check if habit is completed today. If not, streak is 0.
  if (!habit.completionHistory[today]) {
    return 0;
  }

  // Start checking from today backwards
  while (true) {
    const dateString = currentDate.toISOString().split("T")[0];
    if (habit.completionHistory[dateString]) {
      currentStreak++;
      currentDate.setDate(currentDate.getDate() - 1); // Go to previous day
    } else {
      break;
    }
  }
  return currentStreak;
}

function deleteHabit(habitId) {
  if (confirm("Are you sure you want to delete this habit?")) {
    habits = habits.filter((h) => h.id !== habitId);
    saveState();
    renderHabits();
    updateStats();
  }
}

function renderHabits() {
  const container = document.getElementById("habitsContainer");

  if (habits.length === 0) {
    container.innerHTML = `
                    <div class="empty-state">
                        <h3>No habits yet!</h3>
                        <p>Start building better habits by adding your first one above.</p>
                    </div>
                `;
    return;
  }

  container.innerHTML = habits
    .map((habit) => {
      const today = getTodayDate();
      const isCompletedToday = habit.completionHistory[today];

      return `
                <div class="habit-card ${isCompletedToday ? "completed" : ""}">
                    <div class="habit-header">
                        <div>
                            <div class="habit-name">${habit.name}</div>
                            <span class="habit-category category-${
                              habit.category
                            }">${habit.category}</span>
                        </div>
                        <button onclick="deleteHabit(${
                          habit.id
                        })" style="background: rgba(239, 68, 68, 0.1); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.2); padding: 8px 12px; border-radius: 8px; cursor: pointer; font-weight: 600; transition: all 0.2s ease;">×</button>
                    </div>
                    
                    <div class="habit-details">
                        ${
                          habit.identity
                            ? `<div class="habit-detail"><strong>Identity:</strong> ${habit.identity}</div>`
                            : ""
                        }
                        ${
                          habit.cue
                            ? `<div class="habit-detail"><strong>Cue:</strong> ${habit.cue}</div>`
                            : ""
                        }
                        ${
                          habit.twoMinute
                            ? `<div class="habit-detail"><strong>2-Minute Rule:</strong> ${habit.twoMinute}</div>`
                            : ""
                        }
                        ${
                          habit.reward
                            ? `<div class="habit-detail"><strong>Reward:</strong> ${habit.reward}</div>`
                            : ""
                        }
                    </div>

                    <div class="progress-bar-container">
                        <div class="progress-bar" style="width: ${
                          (habit.streak % 7) * 14.28
                        }%"></div>
                    </div>
                    
                    <div class="habit-actions">
                        <button class="complete-btn ${
                          isCompletedToday ? "completed" : "incomplete"
                        }" 
                                onclick="toggleHabitCompletion(${habit.id})">
                            <span>${isCompletedToday ? "✓" : "○"}</span>
                            ${isCompletedToday ? "Completed" : "Mark Complete"}
                        </button>
                        
                        <div class="streak-display">
                            <span>🔥</span>
                            <span>${habit.streak} day streak</span>
                        </div>
                    </div>
                </div>
            `;
    })
    .join("");
}

function updateStats() {
  const totalHabits = habits.length;
  const today = getTodayDate();
  const completedToday = habits.filter(
    (h) => h.completionHistory[today]
  ).length;
  const longestStreak =
    habits.length > 0 ? Math.max(...habits.map((h) => h.streak)) : 0;

  let totalPossibleCompletions = 0;
  let totalActualCompletions = 0;

  // Calculate for the last 30 days for a more meaningful completion rate
  const relevantDates = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    relevantDates.push(date.toISOString().split("T")[0]);
  }

  habits.forEach((habit) => {
    relevantDates.forEach((date) => {
      totalPossibleCompletions++;
      if (habit.completionHistory[date]) {
        totalActualCompletions++;
      }
    });
  });

  const completionRate =
    totalPossibleCompletions > 0
      ? Math.round((totalActualCompletions / totalPossibleCompletions) * 100)
      : 0;

  document.getElementById("totalHabits").textContent = totalHabits;
  document.getElementById("completedToday").textContent = completedToday;
  document.getElementById("longestStreak").textContent = longestStreak;
  document.getElementById("completionRate").textContent = completionRate + "%";
}

// --- Initial App Load ---
document.addEventListener("DOMContentLoaded", function () {
  loadState(); // Load data from local storage first
  renderHabits();
  updateStats();
});

// --- Sample habits (only if no saved data) ---
function initSampleHabits() {
  habits = [
    {
      id: 1,
      name: "Read 10 pages",
      category: "learning",
      identity: "A lifelong learner",
      cue: "After morning coffee",
      twoMinute: "Read one sentence",
      reward: "Listen to a podcast",
      streak: 0, // Will be recalculated on load if data exists
      completed: false,
      completionHistory: {
        [getTodayDate()]: false,
      }, // Example for today
    },
    {
      id: 2,
      name: "Drink 8 glasses of water",
      category: "health",
      identity: "A hydrated and healthy person",
      cue: "Keep water bottle on desk",
      twoMinute: "Drink one glass of water",
      reward: "Enjoy a square of dark chocolate",
      streak: 0,
      completed: false,
      completionHistory: {
        [getTodayDate()]: false,
      },
    },
    {
      id: 3,
      name: "Meditate for 5 minutes",
      category: "wellness",
      identity: "A calm and mindful individual",
      cue: "First thing in the morning",
      twoMinute: "Take one deep breath",
      reward: "Enjoy a cup of herbal tea",
      streak: 0,
      completed: false,
      completionHistory: {
        [getTodayDate()]: false,
      },
    },
  ];
  habitIdCounter = 4;
  // Simulate some past completions for sample habits to show streaks
  habits.forEach((habit) => {
    getLastWeekDates().forEach((date, index) => {
      // Make them more likely to be complete for longer streaks
      habit.completionHistory[date] = Math.random() < 0.8;
    });
    habit.streak = calculateCurrentStreak(habit);
  });
}
