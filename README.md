# dom-state

> Simple JavaScript library for building user interfaces

This the whole library is inspired by React, Redux and AngularJS. Primary usage is designed for web extensions or 3rd-party applications included into another pages.

## Install

Include script in html head. Create new domState object and call run after page is loaded.

```html
<script src="/assets/js/dom-state.min.js"></script>
<script type="application/javascript">
	var domState = new DomState();

	// .... your domState factories, components

	document.addEventListener("DOMContentLoaded", domState.run);
</script>
```

## Settings

Define root element id selector and intitial value for global store

```html
<script type="application/javascript">
	domState.settings(
		{
			// This is also default value and can be omitted
			rootElementId: "dom-state-root-element",
		},
		// Initial value for global store
		{
			lang: "en",

			tasks: [
				{ id: 1, done: true, title: "Hit the gym" },
				{ id: 2, done: false, title: "Meet George" },
			],
		}
	);
</script>
```

## Factories

Define global factories available in component function. Can be object or function.

```html
<script type="application/javascript">
	domState.addFactory("translations", {
		en: {
			title: "Title",
		},
		sk: {
			title: "Názov",
		},
	});

	domState.addComponent("main", [
		"translations",
		function (translations) {
			// this.store.lang == 'en'
			console.log(translations[this.store.lang].title);

			// Your code
		},
	]);
</script>
```

## Component

Main part for building user interface. To register new component, you must call domStat object method addComponent, where first attribute is unique component name (case insensitive) and second attribute is component definition.

### Store

In component you have access to global store from settings initial value. If you want re-render component html when store value was changed, you must add path to value into this.watchStore, you can use dot syntax for nested objects.

```html
<script type="application/javascript">
	domState.addComponent("main", function () {
		// Watch changes in global store lang value
		this.watchStore = ["lang"];

		this.render = () => {
			this.store.lang;

			//  Output: <div>Language: en</div>
			return this.component.createElement(`<div>Language: ${this.store.lang}</div>`);
		};
	});
</script>
```

Change global store value from outside.

```html
<script type="application/javascript">
	var newStore = {
		...domState.store,

		lang: "sk",
	};

	// This will trigger re-rendering all components watching value lang (In component: this.watchStore = ['lang'];)
	domState.setStore(newStore);
</script>
```

### Props

Pros data are data sent from paren component. When you want use same component more than once add unique key attribute.

```html
<script type="application/javascript">
	domState.addComponent("main", function () {
		this.render = () => {
			return this.component.createElement(`<sub-component first-task="{{firstTask}}"></sub-component>`, {
				firstTask: this.store.tasks[0],
			});
		};
	});

	domState.addComponent("sub-component", function () {
		this.render = () => {
			//  Output: <div>Hit the gym</div>
			return this.component.createElement(`<div>${this.props.firstTask.title}</div>`);
		};
	});
</script>
```

### this.component

Is global object available in component function

#### createElement

This function create html element from string (first attribute) and bind events or props to element from second attribute.

```html
<script type="application/javascript">
	domState.addComponent("main", function () {
		this.render = () => {
			return this.component.createElement(
				`
				<div>` +
					// Bind event click with function from second createElement attribute with key name click
					// Everything what is starting with prefix 'on' and value contains {{}} is binded as addEventListener
					`<button onclick="{{click}}"></button>` +
					// Bind props firstTask (converted from kebab-case to camelCase) with value from
					// second createElement attribute with key name firstTaskObject
					`<sub-component first-task="{{firstTaskObject}}"></sub-component>
				</div>
			`,
				{
					click: () => {
						console.log("click");
					},
					firstTaskObject: this.store.tasks[0],
				}
			);
		};
	});
</script>
```

#### render

Trigger for re-rendering. Must be called when global store value was changed

```html
<script type="application/javascript">
	domState.addComponent("main", function () {
		this.render = () => {
			return this.component.createElement(
				`
				<div>` +
					`<button onclick="{{click}}"></button>` +
					`Count: ${this.store.count}
				</div>
			`,
				{
					click: () => {
						this.store.count++;
						this.component.render();
					},
				}
			);
		};
	});
</script>
```
