/**
 * domState
 *
 * Simple JavaScript library for building user interfaces
 *
 * @link		https://github.com/Yakubko/dom-state
 * @author		Yakub
 * @version 	1.0.0
 */
"use strict";

function _classCallCheck(instance, Constructor) {
	if (!_instanceof(instance, Constructor)) {
		throw new TypeError("Cannot call a class as a function");
	}
}

function _typeof(obj) {
	"@babel/helpers - typeof";
	if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
		_typeof = function _typeof(obj) {
			return typeof obj;
		};
	} else {
		_typeof = function _typeof(obj) {
			return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
		};
	}
	return _typeof(obj);
}

function _instanceof(left, right) {
	if (right != null && typeof Symbol !== "undefined" && right[Symbol.hasInstance]) {
		return !!right[Symbol.hasInstance](left);
	} else {
		return left instanceof right;
	}
}

var DomState = (function () {
	"use strict";

	// Private data definitions
	var privateData = {
		// Root dom data
		root: {
			// root dom
			element: null,
			// root dom id
			elementId: "dom-state-root-element",
			// root dom compilator
			compiledComponent: null,
		},
		// Global store
		store: {},
		// Registred factories
		factories: {},
		// Registred components
		components: {},
	};

	// Group of private function
	var privateFunctions = {
		/**
		 * Render user interface or change based on
		 */
		render: function render() {
			privateData.root.compiledComponent(privateData.store);
		},

		/**
		 * Create element from string and assign data, functions from props
		 *
		 * @param {string}	template		String html template
		 * @param {object}	props			For component element
		 */
		createElement: function createElement(template, props) {
			// Create dom element
			var el = document.createElement("DIV");
			el.innerHTML = template.trim();
			el = el.firstChild;
			el.parentElement.removeChild(el);

			// Walk through all child nodes and look for component elements
			(function compileComponentElements(mainElement) {
				for (var i = 0; i < mainElement.childNodes.length; i++) {
					var childElement = mainElement.childNodes[i];

					switch (childElement.nodeType) {
						case Node.ELEMENT_NODE:
							// If it's component element and have any attributes
							if (childElement.attributes.length > 0) {
								if (privateData.components[childElement.tagName]) {
									childElement._domStateProps = {};
								}

								// Walk through all attributes and assign data to props for element
								for (var c = 0; c < childElement.attributes.length; c++) {
									// Convert from kebab case to camelCase
									var nodeCamelCaseName = childElement.attributes[c].name.replace(/-([a-z])/g, function (g) {
										return g[1].toUpperCase();
									});

									if (privateData.components[childElement.tagName]) {
										childElement._domStateProps[nodeCamelCaseName] = childElement.attributes[c].value;
									}

									// If node value is in {{propsName}} syntax
									var compileVars = childElement.attributes[c].nodeValue.match(/{{(.*?)}}/gm);
									if (compileVars && compileVars.length > 0) {
										compileVars = compileVars[0].replace(/{{|}}/gm, "");

										if (privateData.components[childElement.tagName]) {
											// Assign value from props
											childElement._domStateProps[nodeCamelCaseName] = compileVars.split(".").reduce(function (obj, i) {
												return obj && obj[i] ? obj[i] : null;
											}, props);
										} else if (childElement.attributes[c].name.startsWith("on")) {
											// Bind event function from props
											childElement.addEventListener(
												childElement.attributes[c].name.substr(2),
												compileVars.split(".").reduce(function (obj, i) {
													return obj && obj[i] ? obj[i] : null;
												}, props)
											);
											childElement.removeAttribute(childElement.attributes[c].name);
										}
									}
								}
							}

							// Recursion walk
							if (childElement.children) {
								compileComponentElements(childElement);
							}
							break;
					}
				}
			})({
				childNodes: [el],
			});

			return el;
		},

		/**
		 * Create component object with assigned factories
		 *
		 * @param {function|[]}	component		Component definition
		 */
		createComponent: function createComponent(component) {
			if (!Array.isArray(component)) {
				component = [component];
			}

			var i = 0,
				tmpParams = [undefined];

			// Wallk through array items
			for (var i = 0; i < component.length; i++) {
				// If isn't last loop, then item as factory name and add him to attributes for component class
				if (i + 1 < component.length) {
					tmpParams.push(privateData.factories[component[i]]);
				}
				// Last item is component functions
				else {
					// Create component function with factories
					var tmpClass = component[i].bind.apply(component[i], tmpParams);
					var ret = new tmpClass();

					// Assign global properties to component new function
					ret.component = {
						render: privateFunctions.render,
						createElement: privateFunctions.createElement,
					};
					ret.store = {};
					ret.props = {};
					return ret;
				}
			}
		},

		/**
		 * Compile element object and create list of nodes depended from scope state.
		 *
		 * @param {object}	element					DOMElement object
		 * @param {object}	previousWatchNodes		List of previous watched nodes
		 * @returns Function connected to element accepting scope value
		 */
		compile: function compile(element, previousWatchNodes) {
			var watchNodes = [];

			// Walk through all child nodes and look for component elements
			(function compileComponentElements(mainElement) {
				for (var i = 0; i < mainElement.childNodes.length; i++) {
					var childElement = mainElement.childNodes[i];

					switch (childElement.nodeType) {
						case Node.ELEMENT_NODE:
							// If it's component element
							if (privateData.components[childElement.tagName]) {
								// Create watcher name
								var watcherName = childElement.tagName + (childElement.attributes.key ? "|" + childElement._domStateProps.key : "");

								// Create watcher
								var newWather = {
									name: watcherName,
									// Assign prop attributes from dom element
									props: childElement._domStateProps,

									node: childElement,
									compiled: null,
									prevState: {
										store: undefined,
										props: undefined,
									},
									component: null,
								};

								// Clean dom object
								delete childElement._domStateProps;

								// Look for previous watcher. This will save lot resources
								if (previousWatchNodes) {
									for (var c in previousWatchNodes) {
										if (previousWatchNodes[c].name == watcherName) {
											// Replace dom elemet with previous generated dom element
											if (childElement.parentNode) {
												childElement.parentNode.replaceChild(previousWatchNodes[c].node, childElement);
											}

											// Assign data from previous watcher
											newWather.node = previousWatchNodes[c].node;
											newWather.compiled = previousWatchNodes[c].compiled;
											newWather.prevState = previousWatchNodes[c].prevState;
											newWather.component = previousWatchNodes[c].component;
										}
									}
								}

								// If it's new watcher or didn't find previous watcher create new component function
								if (newWather.component === null) {
									newWather.component = privateFunctions.createComponent(privateData.components[childElement.tagName]);
								}

								// Assign watcher to list
								watchNodes.push(newWather);
							}
							// Recursion walk
							else if (childElement.children) {
								compileComponentElements(childElement);
							}

							break;
					}
				}
			})({ childNodes: [element] });

			/**
			 * Create return function
			 *
			 * @param {object}	scope		Global store object
			 */
			var retFunction = function retFunction(scope) {
				var watcher, componentElement;

				// Walk through all watchers
				for (var x in watchNodes) {
					watcher = watchNodes[x];

					switch (watcher.node.nodeType) {
						case Node.ELEMENT_NODE:
							// Update component store and props
							watcher.component.store = scope;
							watcher.component.props = watcher.props;

							var fromCache = true;
							// Check if is something changed
							if (watcher.component.watchStore || watcher.component.props) {
								var watch = [];

								// Check global store changes if component is watching to them
								if (watcher.component.watchStore) {
									watch = watch.concat(
										watcher.component.watchStore.map(function (item) {
											return "store." + item;
										})
									);
								}

								// Check changes in props values
								if (watcher.props) {
									watch = watch.concat(
										Object.keys(watcher.props).map(function (item) {
											return "props." + item;
										})
									);
								}

								// Compare only using values towards component previous used values
								fromCache = privateFunctions.deepCompare(
									watch, // List of watched items
									{ store: privateData.store, props: watcher.props }, // Current values state
									watcher.prevState // Previous component values state
								);
							}

							if (!watcher.compiled || !fromCache) {
								// Create compiled function
								watcher.compiled = privateFunctions.compile(
									watcher.component.render(),
									watcher.compiled ? watcher.compiled.watchNodes : undefined
								);
							}

							// Recursion walk
							componentElement = watcher.compiled(scope);

							// Replace old element with componentElement if its new.
							if (componentElement.parentNode == null) {
								if (watcher.node.parentNode) {
									watcher.node.parentNode.replaceChild(componentElement, watcher.node);
								}

								watcher.node = componentElement;
							}

							break;
					}
				}

				return element;
			};

			// Assign list of watchers to return function
			retFunction.watchNodes = watchNodes;
			return retFunction;
		},

		/**
		 * One big compoaration methode :)
		 *
		 * @param {[]}		valuesMap		List of path to values witch want to compare
		 * @param {object}	newValue		New scope values
		 * @param {object}	oldValue		Old scope values. This attribute will updated, by reference, after comparing with new scope values by valuesMap
		 */
		deepCompare: function deepCompare(valuesMap, newValue, oldValue) {
			var compareOnly = {};
			var i, l, leftChain, rightChain;

			function compare2Objects(compareOnly, x, y) {
				var p;

				if (isNaN(x) && isNaN(y) && typeof x === "number" && typeof y === "number") {
					return true;
				}

				if (x === y) {
					return true;
				}

				if (
					(typeof x === "function" && typeof y === "function") ||
					(_instanceof(x, Date) && _instanceof(y, Date)) ||
					(_instanceof(x, RegExp) && _instanceof(y, RegExp)) ||
					(_instanceof(x, String) && _instanceof(y, String)) ||
					(_instanceof(x, Number) && _instanceof(y, Number))
				) {
					return x.toString() === y.toString();
				}

				if (!(_instanceof(x, Object) && _instanceof(y, Object))) {
					return false;
				}

				if (x.isPrototypeOf(y) || y.isPrototypeOf(x)) {
					return false;
				}

				if (x.constructor !== y.constructor) {
					return false;
				}

				if (x.prototype !== y.prototype) {
					return false;
				}

				if (leftChain.indexOf(x) > -1 || rightChain.indexOf(y) > -1) {
					return false;
				}

				for (p in y) {
					if (compareOnly) {
						if (!compareOnly.hasOwnProperty(p)) {
							continue;
						} else if (Object.keys(compareOnly[p]).length > 0 && !x.hasOwnProperty(p)) {
							x[p] = _typeof(y[p]) === "object" ? JSON.parse(JSON.stringify(y[p])) : y[p];
						}
					}

					if (y.hasOwnProperty(p) !== x.hasOwnProperty(p)) {
						return false;
					} else if (_typeof(y[p]) !== _typeof(x[p])) {
						return false;
					}
				}

				for (p in x) {
					if (compareOnly) {
						if (!compareOnly.hasOwnProperty(p)) {
							continue;
						} else if (Object.keys(compareOnly[p]).length > 0 && !y.hasOwnProperty(p)) {
							y[p] = _typeof(x[p]) === "object" ? JSON.parse(JSON.stringify(x[p])) : x[p];
						}
					}

					if (y.hasOwnProperty(p) !== x.hasOwnProperty(p)) {
						return false;
					} else if (_typeof(y[p]) !== _typeof(x[p])) {
						return false;
					}

					switch (_typeof(x[p])) {
						case "object":
						case "function":
							leftChain.push(x);
							rightChain.push(y);

							if (
								!compare2Objects(
									compareOnly && compareOnly.hasOwnProperty(p) && Object.keys(compareOnly[p]).length !== 0 ? compareOnly[p] : null,
									x[p],
									y[p]
								)
							) {
								return false;
							}

							leftChain.pop();
							rightChain.pop();
							break;

						default:
							if (x[p] !== y[p]) {
								return false;
							}

							break;
					}
				}

				return true;
			}

			for (var i in valuesMap) {
				valuesMap[i].split(".").reduce(function (obj, i) {
					if (!obj) {
						obj = {};
					}

					if (!obj[i]) {
						obj[i] = {};
					}

					return obj[i];
				}, compareOnly);
			}

			rightChain = leftChain = [];

			if (!compare2Objects(Object.keys(compareOnly).length === 0 ? null : compareOnly, newValue, oldValue)) {
				if (Object.keys(compareOnly).length !== 0) {
					var replace = function replace(map, from, to) {
						if (!from) {
							from = {};
						}

						if (!to) {
							to = {};
						}

						Object.keys(to).forEach(function (key) {
							delete to[key];
						});
						Object.keys(map).forEach(function (key) {
							to[key] = _typeof(from[key]) === "object" ? JSON.parse(JSON.stringify(from[key])) : from[key];

							if (Object.keys(map[key]).length !== 0) {
								replace(map[key], from[key], to[key]);
							}
						});
					};

					replace(compareOnly, newValue, oldValue);
				}

				return false;
			}

			return true;
		},
	};

	/**
	 * Public domState class
	 */
	var DomStatePublic = function DomStatePublic() {
		_classCallCheck(this, DomStatePublic);

		// Proxy access to global store
		this.store = privateData.store;

		// Update global store form outside
		this.setStore = function (store) {
			this.store = privateData.store = store;
			privateFunctions.render();
		};

		/**
		 * Configuration methode
		 *
		 * @param {Object}	[config]					domState global configuration
		 * @param {string}	[config.rootElementId]		Root element id
		 * @param {Object}	[initialStoreState] 		Initial store state value
		 */
		this.settings = function () {
			var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
			var initialStoreState = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

			if (_typeof(initialStoreState) === "object" && initialStoreState !== null) {
				this.store = privateData.store = initialStoreState;
			}

			if (config) {
				if (config.rootElementId) {
					privateData.root.elementId = config.rootElementId;
				}
			}
		};

		/**
		 * Registre new component
		 *
		 * @param {string}		name			Component unique name. Name is insensitive
		 * @param {function|[]}	definition		Component definition. When array last item must be function and other items are factory names.
		 */
		this.addComponent = function (name, definition) {
			privateData.components[name.toUpperCase()] = definition;
		};

		/**
		 * Registre new factory
		 *
		 * @param {string}	name			Factory unique name. Name is insensitive
		 * @param {any}		definition		Factory definition
		 */
		this.addFactory = function (name, definition) {
			privateData.factories[name] = definition;
		};

		/**
		 * Run domState for root element
		 */
		this.run = function () {
			privateData.root.element = document.getElementById(privateData.root.elementId);
			privateData.root.compiledComponent = privateFunctions.compile(privateData.root.element);
			privateFunctions.render();
		};
	};

	// Return public class
	return DomStatePublic;
})();
