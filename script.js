const dashboard = document.querySelector(".dashboard");
const featureView = document.getElementById("feature-view");
const featureContent = document.getElementById("feature-content");
const backBtn = document.getElementById("back-btn");
const featureCards = document.querySelectorAll(".feature-card");
const darkModeToggle = document.getElementById("darkModeToggle");
const body = document.body;
let currentFeature = null;
let tasks = [];
let plannerData = [];
let editIndex = null;
let plannerInterval = null;
const breakCompleteSound = new Audio("assets/audio/focus.wav");
const workCompleteSound = new Audio("assets/audio/break.wav");
let goals = [];
async function loadWeather(latitude, longitude){

    const locationEl = document.getElementById("weather-location");
    const dateEl = document.getElementById("weather-date");
    const tempEl = document.getElementById("weather-temp");
    const conditionEl = document.getElementById("weather-condition");
    const humidityEl = document.getElementById("weather-humidity");
    const windEl = document.getElementById("weather-wind");

    try{

        locationEl.textContent = "📍 Loading...";
        tempEl.textContent = "--";
        conditionEl.textContent = "Loading...";

        // Weather API
        const weatherResponse = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code`
        );

        const weatherData = await weatherResponse.json();

        // Reverse Geocoding API (City Name)
        const geoResponse = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
        );

        const geoData = await geoResponse.json();

        const city =
            geoData.address.city ||
            geoData.address.town ||
            geoData.address.village ||
            "Unknown";

        locationEl.textContent = `📍 ${city}`;

        dateEl.textContent = new Date().toDateString();

        tempEl.textContent =
            `${Math.round(weatherData.current.temperature_2m)}°C`;

        humidityEl.textContent =
            `${weatherData.current.relative_humidity_2m}%`;

        windEl.textContent =
            `${weatherData.current.wind_speed_10m} km/h`;

        const code = weatherData.current.weather_code;

        let condition = "Unknown";

        if(code === 0){

            condition = "Clear Sky";

        }else if([1,2,3].includes(code)){

            condition = "Partly Cloudy";

        }else if([45,48].includes(code)){

            condition = "Fog";

        }else if([51,53,55,61,63,65].includes(code)){

            condition = "Rain";

        }else if([71,73,75].includes(code)){

            condition = "Snow";

        }else if([95,96,99].includes(code)){

            condition = "Thunderstorm";

        }

        conditionEl.textContent = condition;

    }
    catch(error){

        locationEl.textContent = "Weather unavailable";
        conditionEl.textContent = "--";
        tempEl.textContent = "--";
        humidityEl.textContent = "--";
        windEl.textContent = "--";

    }

}


// ================= Render Tasks =================
function saveTasks(){

    localStorage.setItem("tasks", JSON.stringify(tasks));

}
function loadTasks(){

    const storedTasks = localStorage.getItem("tasks");

    if(storedTasks){

        tasks = JSON.parse(storedTasks);

    }

}
function savePlanner(){

    localStorage.setItem("plannerData", JSON.stringify(plannerData));

}

function loadPlanner(){

    const storedPlanner = localStorage.getItem("plannerData");

    if(storedPlanner){

        plannerData = JSON.parse(storedPlanner);

    }

}
function saveGoals(){

    localStorage.setItem("goals", JSON.stringify(goals));

}

function loadGoals(){

    const storedGoals = localStorage.getItem("goals");

    if(storedGoals){

        goals = JSON.parse(storedGoals);

    }

}
function convertTo24Hour(time){

    let [hour, minutePeriod] = time.split(":");

    let [minute, period] = minutePeriod.split(" ");

    hour = Number(hour);

    if(period === "AM"){

        if(hour === 12){
            hour = 0;
        }

    }else{

        if(hour !== 12){
            hour += 12;
        }

    }

    return hour;

}

function renderTasks(taskList){

    taskList.innerHTML = "";

    tasks.forEach((task,index)=>{

        const li = document.createElement("li");

        if(task.completed){
            li.classList.add("completed");
        }

        li.innerHTML = `
            <span class="task-text">${task.text}</span>

            <div class="task-actions">

                <button class="important-btn" data-index="${index}" title="Mark Important">
                    <i class="${task.important ? "ri-star-fill" : "ri-star-line"}"></i>
                </button>

                <button class="complete-btn" data-index="${index}" title="Mark Complete">
                    <i class="ri-check-line"></i>
                </button>

                <button class="delete-btn" data-index="${index}" title="Delete Task">
                    <i class="ri-delete-bin-line"></i>
                </button>

            </div>
        `;

        taskList.appendChild(li);

    });

}
function renderGoals(goalList, progressText){

    goalList.innerHTML = "";
    if(goals.length === 0){
    
        goalList.innerHTML = `
            <p class="empty-message">
                No goals yet. Add your first goal!
            </p>
        `;
    
        progressText.textContent = "0 of 0 completed";
        return;
    }

    let completed = 0;

    goals.forEach((goal,index)=>{

        if(goal.completed){
            completed++;
        }

        const li = document.createElement("li");

        if(goal.completed){
            li.classList.add("completed");
        }

        li.innerHTML = `
            <span>${goal.text}</span>

            <div class="goal-actions">

                <button class="complete-goal-btn" data-index="${index}">
                    <i class="ri-check-line"></i>
                </button>

                <button class="delete-goal-btn" data-index="${index}">
                    <i class="ri-delete-bin-line"></i>
                </button>

            </div>
        `;

        goalList.appendChild(li);

    });

    progressText.textContent = `${completed} of ${goals.length} completed`;

}


function renderPlans(plansContainer){

    plansContainer.innerHTML = "";

    const currentHour = new Date().getHours();

    plannerData.forEach((plan,index)=>{

        const card = document.createElement("div");

        card.classList.add("plan-card");

        // Convert planner time to hour number
        const startHour = convertTo24Hour(plan.from);
        const endHour = convertTo24Hour(plan.to);

        if(currentHour >= startHour && currentHour < endHour){
            card.classList.add("current-plan");
        }

        card.innerHTML = `
            <div class="plan-time">
                ${plan.from} - ${plan.to}
            </div>

            <h3>${plan.title}</h3>

            <p>${plan.notes || "No notes added."}</p>

            <div class="plan-actions">

                <button class="edit-plan-btn" data-index="${index}">
                    <i class="ri-pencil-line"></i>
                </button>

                <button class="delete-plan-btn" data-index="${index}">
                    <i class="ri-delete-bin-line"></i>
                </button>

            </div>
        `;

        plansContainer.appendChild(card);

    });

}
function openFeature(featureName){

    if(currentFeature === featureName) return;

    currentFeature = featureName;

    dashboard.classList.add("hidden");
    featureView.classList.remove("hidden");

    if(featureName === "todo"){

        featureContent.innerHTML = `
            <div class="todo-container">

                <h1>Todo List</h1>

                <div class="todo-input">

                    <input
                        type="text"
                        id="task-input"
                        placeholder="Enter a task..."
                    >

                    <button id="add-task-btn">
                        Add Task
                    </button>

                </div>

                <ul id="task-list"></ul>

            </div>
        `;

        const taskInput = document.getElementById("task-input");
        const addTaskBtn = document.getElementById("add-task-btn");
        const taskList = document.getElementById("task-list");

        loadTasks();
        

        renderTasks(taskList);

        addTaskBtn.addEventListener("click",()=>{

            const task = taskInput.value.trim();

            if(task===""){
                alert("Please enter a task.");
                return;
            }

              tasks.push({
                text: task,
                important: false,
                completed: false
            });
            
            saveTasks();
            
            renderTasks(taskList);

            taskInput.value="";

        });

        taskList.addEventListener("click",(event)=>{

            const btn = event.target.closest("button");

            if(!btn) return;

            const index = btn.dataset.index;

            if(btn.classList.contains("delete-btn")){

                tasks.splice(index,1);
                saveTasks();

            }

            if(btn.classList.contains("important-btn")){

                tasks[index].important = !tasks[index].important;
                saveTasks();

            }

            if(btn.classList.contains("complete-btn")){

                tasks[index].completed = !tasks[index].completed;
                saveTasks();

            }

            renderTasks(taskList);

        });

    }
    else if(featureName === "planner"){

        featureContent.innerHTML = `
        
            <div class="planner-container">
    
                <h1>Daily Planner</h1>
    
                <p class="planner-subtitle">
                    Organize your day efficiently.
                </p>
    
                <div class="planner-form">
    
                    <div class="form-group">
    
                        <label>From Time</label>
    
                        <select id="from-time"></select>
    
                    </div>
    
                    <div class="form-group">
    
                        <label>To Time</label>
    
                        <select id="to-time"></select>
    
                    </div>
    
                    <div class="form-group">
    
                        <label>Task Title</label>
    
                        <input
                            type="text"
                            id="plan-title"
                            placeholder="Enter task title..."
                        >
    
                    </div>
    
                    <div class="form-group">
    
                        <label>Notes</label>
    
                        <textarea
                            id="plan-notes"
                            placeholder="Write notes..."
                        ></textarea>
    
                    </div>
    
                    <button id="add-plan-btn">
    
                        <i class="ri-add-line"></i>
    
                        Add Plan
    
                    </button>
    
                </div>
    
                <div class="plans-list">
    
                    <h2>Today's Plans</h2>
    
                    <div id="plans-container">
    
                    </div>
    
                </div>
    
            </div>
    
        `;
        const fromTime = document.getElementById("from-time");
        const toTime = document.getElementById("to-time");
        
        const hours = [];
        
        for(let i = 0; i < 24; i++){
        
            const hour = i % 12 === 0 ? 12 : i % 12;
        
            const period = i < 12 ? "AM" : "PM";
        
            hours.push(`${String(hour).padStart(2,"0")}:00 ${period}`);
        
        }
        
        hours.forEach(hour=>{
        
            fromTime.innerHTML += `
                <option value="${hour}">
                    ${hour}
                </option>
            `;
        
            toTime.innerHTML += `
                <option value="${hour}">
                    ${hour}
                </option>
            `;
        
        });
        const addPlanBtn = document.getElementById("add-plan-btn");
        const planTitle = document.getElementById("plan-title");
        const planNotes = document.getElementById("plan-notes");
        const plansContainer = document.getElementById("plans-container");
        loadPlanner();
        renderPlans(plansContainer);
        if (plannerInterval) {
            clearInterval(plannerInterval);
        }
        
        plannerInterval = setInterval(() => {
        
            renderPlans(plansContainer);
        
        }, 60000);
       plansContainer.addEventListener("click",(event)=>{
            // DELETE
            const deleteBtn = event.target.closest(".delete-plan-btn");
        
            if(deleteBtn){
        
                const index = deleteBtn.dataset.index;
        
                plannerData.splice(index,1);
        
                savePlanner();
        
                renderPlans(plansContainer);
        
                return;
            }
        
            // EDIT
            const editBtn = event.target.closest(".edit-plan-btn");
        
            if(editBtn){
        
                editIndex = editBtn.dataset.index;
        
                const plan = plannerData[editIndex];
        
                fromTime.value = plan.from;
                toTime.value = plan.to;
                planTitle.value = plan.title;
                planNotes.value = plan.notes;
        
                addPlanBtn.innerHTML = `
                    <i class="ri-save-line"></i>
                    Save Changes
                `;
            }
        
        });
        addPlanBtn.addEventListener("click",()=>{
        
            const title = planTitle.value.trim();
            const notes = planNotes.value.trim();
            const from = fromTime.value;
            const to = toTime.value;
        
            if(title === ""){
        
                alert("Please enter a task title.");
                return;
        
            }
            const fromIndex = hours.indexOf(from);
            const toIndex = hours.indexOf(to);
            
            if(fromIndex >= toIndex){
            
                alert("End time must be after start time.");
            
                return;
            
            }
            const overlap = plannerData.some((plan,index)=>{
            
                // Ignore the plan currently being edited
                if(index == editIndex) return false;
            
                const existingFrom = hours.indexOf(plan.from);
                const existingTo = hours.indexOf(plan.to);
            
                return fromIndex < existingTo && toIndex > existingFrom;
            
            });
            
            if(overlap){
            
                alert("This time slot overlaps with another plan.");
            
                return;
            
            }
            if(editIndex !== null){
            
                plannerData[editIndex] = {
            
                    from,
                    to,
                    title,
                    notes
            
                };
            
                editIndex = null;
            
                addPlanBtn.innerHTML = `
                    <i class="ri-add-line"></i>
                    Add Plan
                `;
            
            }else{
            
                plannerData.push({
            
                    from,
                    to,
                    title,
                    notes
            
                });
            
            }
        
            
            plannerData.sort((a,b)=>{
            
                return hours.indexOf(a.from) - hours.indexOf(b.from);
            
            });
            savePlanner();
            
            renderPlans(plansContainer);
            planTitle.value = "";
            planNotes.value = "";
            fromTime.selectedIndex = 0;
            toTime.selectedIndex = 0;
            planTitle.focus();
            editIndex = null;
            addPlanBtn.innerHTML = `
                <i class="ri-add-line"></i>
                Add Plan
            `;
        
        });
    
    }
    else if(featureName === "pomodoro"){
        featureContent.innerHTML = `
          <div class ="pomodoro-container">
             <h1>Pomodoro Timer</h1>
             <p id="session-label" class="session-label">🍅 Work Session</p>
             <div id="timer-display">25:00</div>
             <div class="timer-buttons">
                 <button id="start-btn">
                      Start
                  </button>
                   <button id="pause-btn">
                      Pause
                  </button><button id="reset-btn">
                      Reset
                  </button>
               </div>  
           </div>
          `;

        const timerDisplay = document.getElementById("timer-display");
        const startBtn = document.getElementById("start-btn");
        const pauseBtn = document.getElementById("pause-btn");
        const resetBtn = document.getElementById("reset-btn"); 
        const sessionLabel = document.getElementById("session-label");

        let workTime = 25 * 60;
        let breakTime = 5 * 60;     
        let remainingSeconds = workTime; 
        let isBreak = false;  
        let timer = null; 
        let isRunning = false;
        function updateTimer(){
            const minutes = Math.floor(remainingSeconds / 60);     
            const seconds = remainingSeconds % 60;   
            timerDisplay.textContent =
                `${String(minutes).padStart(2,"0")}:${String(seconds).padStart(2,"0")}`;
        }
        updateTimer();
        startBtn.addEventListener("click", () => {

            if (isRunning) return;
            isRunning = true;      
            timer = setInterval(() => { 
                remainingSeconds--;
                updateTimer();
              if (remainingSeconds <= 0) {
                
                    clearInterval(timer);
                    isRunning = false;
                
                    if (!isBreak) {
                
                        // Play work completion sound
                        workCompleteSound.currentTime = 0;
                        workCompleteSound.play();
                
                        alert("🍅 Work Session Complete! Time for a break.");
                
                        isBreak = true;
                        remainingSeconds = breakTime;
                        sessionLabel.textContent = "☕ Break Session";
                
                    } else {
                
                        // Play break completion sound
                        breakCompleteSound.currentTime = 0;
                        breakCompleteSound.play();
                
                        alert("☕ Break Finished! Back to work.");
                
                        isBreak = false;
                        remainingSeconds = workTime;
                        sessionLabel.textContent = "🍅 Work Session";
                    }
                
                    updateTimer();
                }
            }, 1000);
        });
        pauseBtn.addEventListener("click", () => {
            clearInterval(timer);
            isRunning = false;
        });
        resetBtn.addEventListener("click", () => {     
            clearInterval(timer); 
            isRunning = false;   
            isBreak = false;   
            remainingSeconds = workTime; 
            sessionLabel.textContent = "🍅 Work Session";
            updateTimer();
        });
    }
    else if(featureName === "quote"){
    
        featureContent.innerHTML = `
            <div class="quote-container">
    
                <h1>Motivation Quote</h1>
    
                <div class="quote-card">
    
                    <p id="quote-text">
                        Click "New Quote" to get inspired.
                    </p>
    
                    <h3 id="quote-author"></h3>
    
                </div>
    
                <button id="new-quote-btn">
                    <i class="ri-refresh-line"></i>
                    New Quote
                </button>
    
            </div>
        `;
        const quoteText = document.getElementById("quote-text");
        const quoteAuthor = document.getElementById("quote-author");
        const newQuoteBtn = document.getElementById("new-quote-btn");
        async function getQuote(){
        
            quoteText.textContent = "Loading...";
            quoteAuthor.textContent = "";
        
            try{
        
                const response = await fetch("https://dummyjson.com/quotes/random");
         
                const data = await response.json();
        
                quoteText.textContent = `"${data.quote}"`;
        
                quoteAuthor.textContent = `— ${data.author}`;
        
            }
            catch(error){
        
                quoteText.textContent = "Unable to load quote.";
        
                quoteAuthor.textContent = "";
        
            }
        
        }
        getQuote();
        newQuoteBtn.addEventListener("click", getQuote);
    
    }
    else if(featureName === "goals"){
    
        featureContent.innerHTML = `
            <div class="goals-container">
    
                <h1>Daily Goals</h1>
    
                <div class="goal-input">
    
                    <input
                        type="text"
                        id="goal-input"
                        placeholder="Enter your goal..."
                    >
    
                    <button id="add-goal-btn">
                        Add Goal
                    </button>
    
                </div>
    
                <h3 id="goal-progress">
                    0 of 0 completed
                </h3>
    
                <ul id="goal-list"></ul>
    
            </div>
        `;
        const goalInput = document.getElementById("goal-input");
        const addGoalBtn = document.getElementById("add-goal-btn");
        const goalList = document.getElementById("goal-list");
        const progressText = document.getElementById("goal-progress");
        
        loadGoals();
        
        renderGoals(goalList, progressText);
        addGoalBtn.addEventListener("click",()=>{
        
            const text = goalInput.value.trim();
        
            if(text===""){
        
                alert("Enter a goal.");
                return;
        
            }
        
            goals.push({
        
                text:text,
                completed:false
        
            });
        
            saveGoals();
        
            renderGoals(goalList,progressText);
        
            goalInput.value="";
            goalInput.focus();
        
        });
        goalList.addEventListener("click",(event)=>{
        
            const btn = event.target.closest("button");
        
            if(!btn) return;
        
            const index = btn.dataset.index;
        
            if(btn.classList.contains("complete-goal-btn")){
        
                goals[index].completed = !goals[index].completed;
        
            }
        
            if(btn.classList.contains("delete-goal-btn")){
        
                goals.splice(index,1);
        
            }
        
            saveGoals();
        
            renderGoals(goalList,progressText);
        
        });
    
    }
}

featureCards.forEach(card=>{

    card.addEventListener("click",()=>{

        openFeature(card.dataset.feature);

    });

});

backBtn.addEventListener("click",()=>{

    currentFeature = null;

    featureView.classList.add("hidden");

    dashboard.classList.remove("hidden");

});
if(navigator.geolocation){

    navigator.geolocation.getCurrentPosition(

        (position)=>{

            loadWeather(

                position.coords.latitude,

                position.coords.longitude

            );

        },

        ()=>{

            // Default to Hyderabad if location is denied
            loadWeather(17.3850,78.4867);

        }

    );

}else{

    loadWeather(17.3850,78.4867);

}

// ==========================
// DATE & TIME
// ==========================

const dayName = document.querySelector(".day-name");
const dateValue = document.querySelector(".date-value");
const timeValue = document.querySelector(".time-value");

const hourHand = document.querySelector(".hour-hand");
const minuteHand = document.querySelector(".minute-hand");

function updateDateTime(){

    const now = new Date();

    // Day
    dayName.textContent = now.toLocaleDateString("en-US",{
        weekday:"long"
    });

    // Date
    dateValue.textContent = now.toLocaleDateString("en-GB",{
        day:"2-digit",
        month:"long",
        year:"numeric"
    });

    // Digital Time
    timeValue.innerHTML = now.toLocaleTimeString("en-US",{
        hour:"2-digit",
        minute:"2-digit",
        second:"2-digit",
        hour12:true
    }).replace("AM","<span class='ampm'>AM</span>")
      .replace("PM","<span class='ampm'>PM</span>");

    // Analog Clock
    const hours = now.getHours() % 12;
    const minutes = now.getMinutes();

    const hourRotation = (hours * 30) + (minutes * 0.5);
    const minuteRotation = minutes * 6;

    hourHand.style.transform =
        `translateX(-50%) rotate(${hourRotation}deg)`;

    minuteHand.style.transform =
        `translateX(-50%) rotate(${minuteRotation}deg)`;

}

updateDateTime();

setInterval(updateDateTime,1000);
// =============================
// DYNAMIC BACKGROUND ICON
// =============================

const backgroundIcon = document.getElementById("background-icon");

function updateBackgroundIcon(){

    const hour = new Date().getHours();

    let icon = "";

    if(hour >= 5 && hour < 12){

        icon = "ri-sun-foggy-line";

    }
    else if(hour >= 12 && hour < 17){

        icon = "ri-sun-line";

    }
    else if(hour >= 17 && hour < 20){

        icon = "ri-sunset-line";

    }
    else{

        icon = "ri-moon-clear-line";

    }

    backgroundIcon.innerHTML = `<i class="${icon}"></i>`;

    if(body.classList.contains("dark-mode")){

        backgroundIcon.style.color = "rgba(255,255,255,.08)";

    }
    else{

        backgroundIcon.style.color = "rgba(255,255,255,.18)";

    }

}
updateBackgroundIcon();

setInterval(updateBackgroundIcon,60000);
const savedTheme = localStorage.getItem("theme");

if(savedTheme === "dark"){

    body.classList.add("dark-mode");

    darkModeToggle.checked = true;

}

darkModeToggle.addEventListener("change",()=>{

    if(darkModeToggle.checked){

        body.classList.add("dark-mode");

        localStorage.setItem("theme","dark");

    }
    else{

        body.classList.remove("dark-mode");

        localStorage.setItem("theme","light");

    }
    updateBackgroundIcon();

});