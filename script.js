const modal = document.getElementById('modal');
const highImage = './src/high.png';
const mediumImage = './src/medium.png';
const lowImage = './src/low.png';

const showModal = () => {
	modal.classList.add('modal-open');
};

const hideModal = () => {
	modal.classList.remove('modal-open');
	// Clear form fields
	document.getElementById('title').value = '';
	document.getElementById('description').value = '';
	document.getElementById('storyPoint').value = 'select';
	document.getElementById('priority').value = 'Select';
};

const createTask = () => {
	let title = document.getElementById('title').value;
	let description = document.getElementById('description').value;
	let storyPoint = document.getElementById('storyPoint').value;
	let priority = document.getElementById('priority').value;
	let status = 'new';

	if (!title) {
		alert('Title is required');
		return;
	} else if (!description) {
		alert('Description is required');
		return;
	} else if (!storyPoint || storyPoint === 'select') {
		alert('Story Point is required');
		return;
	} else if (!priority || priority === 'Select') {
		alert('Priority is required');
		return;
	}

	const newTask = {
		id: Date.now().toString(), // Ensuring ID is a string
		title: title,
		description: description,
		priority: priority,
		storyPoint: storyPoint,
		status: status,
	};

	let taskList = JSON.parse(localStorage.getItem('taskList')) || [];
	taskList.push(newTask);
	localStorage.setItem('taskList', JSON.stringify(taskList));

	// Force immediate UI update
	renderTasks();
	hideModal();
};

// Get the correct image path based on priority
const getPriorityImage = (priority) => {
	if (!priority) return '';

	switch (priority.toLowerCase()) {
		case 'high':
			return highImage;
		case 'medium':
			return mediumImage;
		case 'low':
			return lowImage;
		default:
			return '';
	}
};

// Migrate old tasks to ensure all have IDs
const migrateTaskData = () => {
	let taskList = JSON.parse(localStorage.getItem('taskList')) || [];
	let needsMigration = false;

	// Add IDs to tasks that don't have them
	taskList = taskList.map((task) => {
		if (!task.id) {
			needsMigration = true;
			return {
				...task,
				id: Date.now().toString() + Math.random().toString(36).substr(2, 9), // Ensure unique ID
			};
		}
		// Ensure status is valid and defaults to 'new' if missing
		if (!task.status) {
			needsMigration = true;
			task.status = 'new';
		}
		return task;
	});

	if (needsMigration) {
		localStorage.setItem('taskList', JSON.stringify(taskList));
	}

	return taskList;
};

const renderTasks = () => {
	// Ensure all tasks have IDs before rendering
	let taskList = migrateTaskData();

	// Clear all task containers first
	document.querySelectorAll('.tasks').forEach((column) => {
		column.innerHTML = '';
	});

	// Add tasks to their respective columns
	taskList.forEach((task) => {
		const taskElement = document.createElement('div');
		taskElement.classList.add('task');
		taskElement.setAttribute('draggable', 'true');
		taskElement.setAttribute('data-id', task.id);
		taskElement.setAttribute('data-priority', task.priority?.toLowerCase() || 'medium');

		taskElement.innerHTML = `
            <h4>${task.title}</h4>
            <p>${task.description}</p>
            <div class="task-info">
                <span class="priority"><img src="${getPriorityImage(task.priority)}" alt="${task.priority}" width="16" />${task.priority}</span>
                <span class="story-point">Points: ${task.storyPoint}</span>
            </div>
        `;

		// Add drag event listeners to the new task element
		taskElement.addEventListener('dragstart', handleDragStart);
		taskElement.addEventListener('dragend', handleDragEnd);

		// Find the correct column and append the task
		// Make sure we have a valid status, defaulting to 'new' if not
		const columnId = task.status || 'new';
		const column = document.getElementById(columnId);

		if (column) {
			column.appendChild(taskElement);
		} else {
			// Fallback to 'new' column if status column doesn't exist
			console.log(`Column with ID '${columnId}' not found. Placing task in 'new' column.`);
			document.getElementById('new')?.appendChild(taskElement);
		}
	});

	// Set up drag and drop after rendering
	setupDragAndDrop();
};

// Drag and Drop functions
function handleDragStart(e) {
	this.classList.add('dragging');
	e.dataTransfer.setData('text/plain', this.getAttribute('data-id'));
	e.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd() {
	this.classList.remove('dragging');
}

function handleDragOver(e) {
	e.preventDefault();
	this.classList.add('drag-over');
	return false;
}

function handleDragEnter(e) {
	e.preventDefault();
	this.classList.add('drag-over');
}

function handleDragLeave() {
	this.classList.remove('drag-over');
}

function handleDrop(e) {
	e.preventDefault();
	this.classList.remove('drag-over');

	const taskId = e.dataTransfer.getData('text/plain');
	if (!taskId) return false;

	const taskElement = document.querySelector(`[data-id="${taskId}"]`);
	if (!taskElement) return false;

	// Get the column id (which corresponds to status)
	const newStatus = this.id;

	// Update task in localStorage
	let taskList = JSON.parse(localStorage.getItem('taskList')) || [];

	// Find the task with safe error handling
	const taskIndex = taskList.findIndex((task) => task && task.id && task.id === taskId);

	if (taskIndex !== -1) {
		taskList[taskIndex].status = newStatus;
		localStorage.setItem('taskList', JSON.stringify(taskList));
		console.log(`Task ${taskId} status updated to ${newStatus}`);
	}

	// Add task to the new column
	this.appendChild(taskElement);

	return false;
}

function setupDragAndDrop() {
	const columns = document.querySelectorAll('.tasks');

	// Remove existing event listeners to prevent duplicates
	columns.forEach((column) => {
		column.removeEventListener('dragover', handleDragOver);
		column.removeEventListener('dragenter', handleDragEnter);
		column.removeEventListener('dragleave', handleDragLeave);
		column.removeEventListener('drop', handleDrop);
	});

	// Add fresh event listeners
	columns.forEach((column) => {
		column.addEventListener('dragover', handleDragOver);
		column.addEventListener('dragenter', handleDragEnter);
		column.addEventListener('dragleave', handleDragLeave);
		column.addEventListener('drop', handleDrop);
	});
}

// Debug function to check localStorage state
function debugTaskState() {
	const taskList = JSON.parse(localStorage.getItem('taskList')) || [];
	console.log('Current task state:', taskList);
}

// Initialize the app
window.onload = function () {
	console.log('Window loaded. Rendering tasks...');
	migrateTaskData();
	renderTasks();
	debugTaskState();

	// Add event listener for browser storage events
	window.addEventListener('storage', function (e) {
		if (e.key === 'taskList') {
			console.log('Storage event detected. Rerendering tasks...');
			renderTasks();
		}
	});
};

// Ensure we have event listeners even if the window load event already fired
document.addEventListener('DOMContentLoaded', function () {
	console.log('DOM content loaded. Setting up event listeners...');

	// Set up form submission handling
	document.querySelector('.crt-tsk-btn')?.addEventListener('click', function () {
		showModal();
	});

	// Ensure modal is working properly
	const closeModalBtn = document.querySelector('.cancel-modal');
	if (closeModalBtn) {
		closeModalBtn.addEventListener('click', hideModal);
	}

	// Initialize tasks if not already done
	if (!document.querySelector('.task')) {
		renderTasks();
	}
});
