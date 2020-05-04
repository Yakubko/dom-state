"use strict";

var domState = new DomState();

domState.settings(null, {
	lang: "en",
	tasks: [
		{ id: 1, done: true, title: "Hit the gym" },
		{ id: 2, done: false, title: "Meet George" },
		{ id: 3, done: true, title: "Read a book" },
		{ id: 4, done: false, title: "Organize office" },
		{ id: 5, done: false, title: "Buy eggs" },
	],

	addTask: null,
});

domState.addFactory("translations", {
	en: {
		title: "To Do List",
	},
	sk: {
		title: "Zoznam uloh",
	},
});

domState.addComponent("todo-list", [
	"translations",
	function (translations) {
		this.watchStore = ["addTask"];

		this.onclick = () => {
			this.store.addTask = this.store.addTask ? null : {};
			this.component.render();
		};

		this.render = () => {
			var el = this.component.createElement(
				`<div class="card m-5 shadow">
					<div class="card-body">
						` +
					(this.store.addTask === null
						? `<button onclick="{{onClick}}" class="float-right btn btn-primary" name="add-task">Add task</button>`
						: `<button onclick="{{onClick}}" class="float-right btn btn-secondary ml-1" >Cancel</button>`) +
					`
						<h4 class="card-title mb-4 mt-1">
							<i class="fa fa-list"></i>&nbsp;${translations[this.store.lang].title}
						</h4>
						<hr />

						` +
					(this.store.addTask === null ? "<task-list></task-list>" : "<new-task-form></new-task-form>") +
					`
					</div>
				</div>`,
				{
					onClick: this.onclick,
				}
			);

			return el;
		};
	},
]);

domState.addComponent("new-task-form", function () {
	var taskPlaceholderList = ["Hit the gym", "Meet George", "Read a book", "Organize office"];

	this.submitNewTask = (event) => {
		event.preventDefault();

		var task = event.srcElement.elements.task.value;
		if (task) {
			event.srcElement.elements.task.classList.remove("is-invalid");
			this.store.addTask = null;
			this.store.tasks.push({
				id: +new Date(),
				done: false,
				title: task,
			});

			this.component.render();
		} else {
			event.srcElement.elements.task.classList.add("is-invalid");
		}
	};

	this.render = () => {
		var taskPlaceholder = taskPlaceholderList[Math.floor(Math.random() * taskPlaceholderList.length)];
		var el = this.component.createElement(
			`<form onsubmit="{{submitNewTask}}">
				<div class="row">
					<div class="form-group col-md-10">
						<input class="form-control" name="task" placeholder="e.g.: ${taskPlaceholder}" />
					</div>
					<div class="col-md-2">
						<button type="submit" class="btn btn-primary btn-block">Save</button>
					</div>
				</div>
			</form>`,
			{
				submitNewTask: this.submitNewTask,
			}
		);

		return el;
	};
});

domState.addComponent("task-list", function () {
	this.watchStore = ["tasks"];

	this.toggleTaskDone = (taskId) => {
		var index = this.store.tasks.findIndex((task) => task.id == taskId);

		this.store.tasks[index].done = !this.store.tasks[index].done;
		this.component.render();
	};

	this.removeTask = (taskId) => {
		var index = this.store.tasks.findIndex((task) => task.id == taskId);

		this.store.tasks.splice(index, 1);
		this.component.render();
	};

	this.render = () => {
		var el = this.component.createElement(`<ul class="list-group list-group-flush"></ul>`);
		if (this.store.tasks.length > 0) {
			this.store.tasks.sort((a, b) => a.id - b.id).sort((a, b) => a.done);
			this.store.tasks.map(function (task) {
				el.appendChild(
					this.component.createElement(
						`<task-list-item key="${task.id}" task="{{object}}" toggle-task-done="{{toggleTaskDone}}" remove-task="{{removeTask}}"></task-list-item>`,
						{
							object: task,
							toggleTaskDone: () => this.toggleTaskDone(task.id),
							removeTask: () => this.removeTask(task.id),
						}
					)
				);
			}, this);
		} else {
			el.appendChild(this.component.createElement('<p class="mb-0 text-center text-secondary">Your task list is empty, nice job :)</p>'));
		}

		return el;
	};
});

domState.addComponent("task-list-item", function () {
	this.render = () => {
		var el = this.component.createElement(
			`<li class="list-group-item d-flex justify-content-between align-items-center` +
				(this.props.task.done ? " text-secondary" : "") +
				`">
				` +
				(this.props.task.done ? `<s>${this.props.task.title}</s>` : `${this.props.task.title}`) +
				`

				<div>` +
				(this.props.task.done
					? `
					<button onclick="{{toggleTaskDone}}" class="btn border-0 btn-transition btn-outline-secondary">
						<i class="fa fa-ban"></i>
					</button>
				`
					: `
					<button onclick="{{toggleTaskDone}}" class="btn border-0 btn-transition btn-outline-success">
						<i class="fa fa-check"></i>
					</button>
				`) +
				`
					<button onclick="{{removeTask}}" class="btn border-0 btn-transition btn-outline-danger">
						<i class="fa fa-trash"></i>
					</button>
				</div>
			</li>`,
			{
				removeTask: this.props.removeTask,
				toggleTaskDone: this.props.toggleTaskDone,
			}
		);

		return el;
	};
});

document.addEventListener("DOMContentLoaded", domState.run);
