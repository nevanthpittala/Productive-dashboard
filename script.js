const dashboard = document.querySelector(".dashboard");
const featureView = document.getElementById("feature-view");
const featureContent = document.getElementById("feature-content");
const backBtn = document.getElementById("back-btn");
const featureCards = document.querySelectorAll(".feature-card");
let currentFeature = null;
let tasks = [];
let plannerData = [];
let editIndex = null;
let plannerInterval = null;

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