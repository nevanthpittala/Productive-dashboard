const dashboard = document.querySelector(".dashboard");
const featureView = document.getElementById("feature-view");
const featureContent = document.getElementById("feature-content");
const backBtn = document.getElementById("back-btn");
const featureCards = document.querySelectorAll(".feature-card");

let currentFeature = null;
let tasks = [];

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