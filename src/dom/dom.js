'use strict';

import core from '../core';
import object from '../object/object';
import DomEventHandle from '../events/DomEventHandle';

class dom {
	/**
	 * Adds the requested CSS classes to an element.
	 * @param {!Element} element The element to add CSS classes to.
	 * @param {string} classes CSS classes to add.
	 */
	static addClasses(element, classes) {
		if (!core.isObject(element) || !core.isString(classes)) {
			return;
		}

		if ('classList' in element) {
			dom.addClassesWithNative_(element, classes);
		} else {
			dom.addClassesWithoutNative_(element, classes);
		}
	}

	/**
	 * Adds the requested CSS classes to an element using classList.
	 * @param {!Element} element The element to add CSS classes to.
	 * @param {string} classes CSS classes to add.
	 * @protected
	 */
	static addClassesWithNative_(element, classes) {
		classes.split(' ').forEach(function(className) {
			element.classList.add(className);
		});
	}

	/**
	 * Adds the requested CSS classes to an element without using classList.
	 * @param {!Element} element The element to add CSS classes to.
	 * @param {string} classes CSS classes to add.
	 * @protected
	 */
	static addClassesWithoutNative_(element, classes) {
		var elementClassName = ' ' + element.className + ' ';
		var classesToAppend = '';

		classes = classes.split(' ');

		for (var i = 0; i < classes.length; i++) {
			var className = classes[i];

			if (elementClassName.indexOf(' ' + className + ' ') === -1) {
				classesToAppend += ' ' + className;
			}
		}

		if (classesToAppend) {
			element.className = element.className + classesToAppend;
		}
	}

	/**
	 * Appends a child node with text or other nodes to a parent node. If
	 * child is a HTML string it will be automatically converted to a document
	 * fragment before appending it to the parent.
	 * @param {!Element} parent The node to append nodes to.
	 * @param {!(Element|NodeList|string)} child The thing to append to the parent.
	 * @return {!Element} The appended child.
	 */
	static append(parent, child) {
		if (core.isString(child)) {
			child = dom.buildFragment(child);
		}
		if (child instanceof NodeList) {
			var childArr = Array.prototype.slice.call(child);
			for (var i = 0; i < childArr.length; i++) {
				parent.appendChild(childArr[i]);
			}
		} else {
			parent.appendChild(child);
		}
		return child;
	}

	/**
	 * Helper for converting a HTML string into a document fragment.
	 * @param {string} htmlString The HTML string to convert.
	 * @return {!Element} The resulting document fragment.
	 */
	static buildFragment(htmlString) {
		var tempDiv = document.createElement('div');
		tempDiv.innerHTML = '<br>' + htmlString;
		tempDiv.removeChild(tempDiv.firstChild);

		var fragment = document.createDocumentFragment();
		while (tempDiv.firstChild) {
			fragment.appendChild(tempDiv.firstChild);
		}
		return fragment;
	}

	/**
	 * Checks if the first element contains the second one.
	 * @param {!Element} element1
	 * @param {!Element} element2
	 * @return {boolean}
	 */
	static contains(element1, element2) {
		if (core.isDocument(element1)) {
			// document.contains is not defined on IE9, so call it on documentElement instead.
			return element1.documentElement.contains(element2);
		} else {
			return element1.contains(element2);
		}
	}

	/**
	 * Listens to the specified event on the given DOM element, but only calls the
	 * callback with the event when it triggered by elements that match the given
	 * selector.
	 * @param {!Element} element The container DOM element to listen to the event on.
	 * @param {string} eventName The name of the event to listen to.
	 * @param {string} selector The selector that matches the child elements that
	 *   the event should be triggered for.
	 * @param {!function(!Object)} callback Function to be called when the event is
	 *   triggered. It will receive the normalized event object.
	 * @return {!DomEventHandle} Can be used to remove the listener.
	 */
	static delegate(element, eventName, selector, callback) {
		var customConfig = dom.customEvents[eventName];
		if (customConfig && customConfig.delegate) {
			eventName = customConfig.originalEvent;
			callback = customConfig.handler.bind(customConfig, callback);
		}
		return dom.on(
			element,
			eventName,
			dom.handleDelegateEvent_.bind(null, selector, callback)
		);
	}

	/**
	 * Inserts node in document as last element.
	 * @param {Element} node Element to remove children from.
	 */
	static enterDocument(node) {
		dom.append(document.body, node);
	}

	/**
	 * Removes node from document.
	 * @param {Element} node Element to remove children from.
	 */
	static exitDocument(node) {
		if (node.parentNode) {
			node.parentNode.removeChild(node);
		}
	}

	/**
	 * This is called when an event is triggered by a delegate listener (see
	 * `dom.delegate` for more details).
	 * @param {string} selector The selector or element that matches the child
	 *   elements that the event should be triggered for.
	 * @param {!function(!Object)} callback Function to be called when the event
	 *   is triggered. It will receive the normalized event object.
	 * @param {!Event} event The event payload.
	 * @return {boolean} False if at least one of the triggered callbacks returns
	 *   false, or true otherwise.
	 */
	static handleDelegateEvent_(selector, callback, event) {
		dom.normalizeDelegateEvent_(event);

		var currentElement = event.target;
		var returnValue = true;

		while (currentElement && !event.stopped) {
			if (core.isString(selector) && dom.match(currentElement, selector)) {
				event.delegateTarget = currentElement;
				returnValue &= callback(event);
			}
			if (currentElement === event.currentTarget) {
				break;
			}
			currentElement = currentElement.parentNode;
		}
		event.delegateTarget = null;

		return returnValue;
	}

	/**
	 * Checks if the given element has the requested css class.
	 * @param {!Element} element
	 * @param {string} className
	 * @return {boolean}
	 */
	static hasClass(element, className) {
		if ('classList' in element) {
			return dom.hasClassWithNative_(element, className);
		} else {
			return dom.hasClassWithoutNative_(element, className);
		}
	}

	/**
	 * Checks if the given element has the requested css class using classList.
	 * @param {!Element} element
	 * @param {string} className
	 * @return {boolean}
	 * @protected
	 */
	static hasClassWithNative_(element, className) {
		return element.classList.contains(className);
	}

	/**
	 * Checks if the given element has the requested css class without using classList.
	 * @param {!Element} element
	 * @param {string} className
	 * @return {boolean}
	 * @protected
	 */
	static hasClassWithoutNative_(element, className) {
		return (' ' + element.className + ' ').indexOf(' ' + className + ' ') >= 0;
	}

	/**
	 * Checks if the given element is empty or not.
	 * @param {!Element} element
	 * @return {boolean}
	 */
	static isEmpty(element) {
		return element.childNodes.length === 0;
	}

	/**
	 * Check if an element matches a given selector.
	 * @param {Element} element
	 * @param {string} selector
	 * @return {boolean}
	 */
	static match(element, selector) {
		if (!element || element.nodeType !== 1) {
			return false;
		}

		var p = Element.prototype;
		var m = p.matches || p.webkitMatchesSelector || p.mozMatchesSelector || p.msMatchesSelector || p.oMatchesSelector;
		if (m) {
			return m.call(element, selector);
		}

		return dom.matchFallback_(element, selector);
	}

	/**
	 * Check if an element matches a given selector, using an internal implementation
	 * instead of calling existing javascript functions.
	 * @param {Element} element
	 * @param {string} selector
	 * @return {boolean}
	 * @protected
	 */
	static matchFallback_(element, selector) {
		var nodes = document.querySelectorAll(selector, element.parentNode);
		for (var i = 0; i < nodes.length; ++i) {
			if (nodes[i] === element) {
				return true;
			}
		}
		return false;
	}

	/**
	 * Normalizes the event payload for delegate listeners.
	 * @param {!Event} event
	 */
	static normalizeDelegateEvent_(event) {
		event.stopPropagation = dom.stopPropagation_;
		event.stopImmediatePropagation = dom.stopImmediatePropagation_;
	}

	/**
	 * Listens to the specified event on the given DOM element. This function normalizes
	 * DOM event payloads and functions so they'll work the same way on all supported
	 * browsers.
	 * @param {!Element|string} element The DOM element to listen to the event on, or
	 *   a selector that should be delegated on the entire document.
	 * @param {string} eventName The name of the event to listen to.
	 * @param {!function(!Object)} callback Function to be called when the event is
	 *   triggered. It will receive the normalized event object.
	 * @param {boolean} opt_capture Flag indicating if listener should be triggered
	 *   during capture phase, instead of during the bubbling phase. Defaults to false.
	 * @return {!DomEventHandle} Can be used to remove the listener.
	 */
	static on(element, eventName, callback, opt_capture) {
		if (core.isString(element)) {
			return dom.delegate(document, eventName, element, callback);
		}
		var customConfig = dom.customEvents[eventName];
		if (customConfig && customConfig.event) {
			eventName = customConfig.originalEvent;
			callback = customConfig.handler.bind(customConfig, callback);
		}
		element.addEventListener(eventName, callback, opt_capture);
		return new DomEventHandle(element, eventName, callback, opt_capture);
	}

	/**
	 * Listens to the specified event on the given DOM element once. This
	 * function normalizes DOM event payloads and functions so they'll work the
	 * same way on all supported browsers.
	 * @param {!Element} element The DOM element to listen to the event on.
	 * @param {string} eventName The name of the event to listen to.
	 * @param {!function(!Object)} callback Function to be called when the event
	 *   is triggered. It will receive the normalized event object.
	 * @return {!DomEventHandle} Can be used to remove the listener.
	 */
	static once(element, eventName, callback) {
		var domEventHandle = this.on(element, eventName, function() {
			domEventHandle.removeListener();
			return callback.apply(this, arguments);
		});
		return domEventHandle;
	}

	/**
	 * Registers a custom event.
	 * @param {string} eventName The name of the custom event.
	 * @param {!Object} customConfig An object with information about how the event
	 *   should be handled.
	 */
	static registerCustomEvent(eventName, customConfig) {
		dom.customEvents[eventName] = customConfig;
	}

	/**
	 * Removes all the child nodes on a DOM node.
	 * @param {Element} node Element to remove children from.
	 */
	static removeChildren(node) {
		var child;
		while ((child = node.firstChild)) {
			node.removeChild(child);
		}
	}

	/**
	 * Removes the requested CSS classes from an element.
	 * @param {!Element} element The element to remove CSS classes from.
	 * @param {string} classes CSS classes to remove.
	 */
	static removeClasses(element, classes) {
		if (!core.isObject(element) || !core.isString(classes)) {
			return;
		}

		if ('classList' in element) {
			dom.removeClassesWithNative_(element, classes);
		} else {
			dom.removeClassesWithoutNative_(element, classes);
		}
	}

	/**
	 * Removes the requested CSS classes from an element using classList.
	 * @param {!Element} element The element to remove CSS classes from.
	 * @param {string} classes CSS classes to remove.
	 * @protected
	 */
	static removeClassesWithNative_(element, classes) {
		classes.split(' ').forEach(function(className) {
			element.classList.remove(className);
		});
	}

	/**
	 * Removes the requested CSS classes from an element without using classList.
	 * @param {!Element} element The element to remove CSS classes from.
	 * @param {string} classes CSS classes to remove.
	 * @protected
	 */
	static removeClassesWithoutNative_(element, classes) {
		var elementClassName = ' ' + element.className + ' ';

		classes = classes.split(' ');

		for (var i = 0; i < classes.length; i++) {
			elementClassName = elementClassName.replace(' ' + classes[i] + ' ', ' ');
		}

		element.className = elementClassName.trim();
	}

	/**
	 * Replaces the first element with the second.
	 * @param {Element} element1
	 * @param {Element} element2
	 */
	static replace(element1, element2) {
		if (element1 && element2 && element1 !== element2 && element1.parentNode) {
			element1.parentNode.insertBefore(element2, element1);
			element1.parentNode.removeChild(element1);
		}
	}

	/**
	 * The function that replaces `stopImmediatePropagation_` for events.
	 * @protected
	 */
	static stopImmediatePropagation_() {
		this.stopped = true;
		Event.prototype.stopImmediatePropagation.call(this);
	}

	/**
	 * The function that replaces `stopPropagation` for events.
	 * @protected
	 */
	static stopPropagation_() {
		this.stopped = true;
		Event.prototype.stopPropagation.call(this);
	}

	/**
	 * Checks if the given element supports the given event type.
	 * @param {!Element|string} element The DOM element or element tag name to check.
	 * @param {string} eventName The name of the event to check.
	 * @return {boolean}
	 */
	static supportsEvent(element, eventName) {
		if (dom.customEvents[eventName]) {
			return true;
		}

		if (core.isString(element)) {
			if (!elementsByTag[element]) {
				elementsByTag[element] = document.createElement(element);
			}
			element = elementsByTag[element];
		}
		return 'on' + eventName in element;
	}

	/**
	 * Converts the given argument to a DOM element. Strings are assumed to
	 * be selectors, and so a matched element will be returned. If the arg
	 * is already a DOM element it will be the return value.
	 * @param {string|Element|Document} selectorOrElement
	 * @return {Element} The converted element, or null if none was found.
	 */
	static toElement(selectorOrElement) {
		if (core.isElement(selectorOrElement) || core.isDocument(selectorOrElement)) {
			return selectorOrElement;
		} else if (core.isString(selectorOrElement)) {
			if (selectorOrElement[0] === '#' && selectorOrElement.indexOf(' ') === -1) {
				return document.getElementById(selectorOrElement.substr(1));
			} else {
				return document.querySelector(selectorOrElement);
			}
		} else {
			return null;
		}
	}

	/**
	 * Adds or removes one or more classes from an element. If any of the classes
	 * is present, it will be removed from the element, or added otherwise.
	 * @param {!Element} element The element which classes will be toggled.
	 * @param {string} classes The classes which have to added or removed from the element.
	 */
	static toggleClasses(element, classes) {
		if (!core.isObject(element) || !core.isString(classes)) {
			return;
		}

		if ('classList' in element) {
			dom.toggleClassesWithNative_(element, classes);
		} else {
			dom.toggleClassesWithoutNative_(element, classes);
		}
	}

	/**
	 * Adds or removes one or more classes from an element using classList.
	 * If any of the classes is present, it will be removed from the element,
	 * or added otherwise.
	 * @param {!Element} element The element which classes will be toggled.
	 * @param {string} classes The classes which have to added or removed from the element.
	 */
	static toggleClassesWithNative_(element, classes) {
		classes.split(' ').forEach(function(className) {
			element.classList.toggle(className);
		});
	}

	/**
	 * Adds or removes one or more classes from an element without using classList.
	 * If any of the classes is present, it will be removed from the element,
	 * or added otherwise.
	 * @param {!Element} element The element which classes will be toggled.
	 * @param {string} classes The classes which have to added or removed from the element.
	 */
	static toggleClassesWithoutNative_(element, classes) {
		var elementClassName = ' ' + element.className + ' ';

		classes = classes.split(' ');

		for (var i = 0; i < classes.length; i++) {
			var className = ' ' + classes[i] + ' ';
			var classIndex = elementClassName.indexOf(className);

			if (classIndex === -1) {
				elementClassName = elementClassName + classes[i] + ' ';
			} else {
				elementClassName = elementClassName.substring(0, classIndex) + ' ' +
					elementClassName.substring(classIndex + className.length);
			}
		}

		element.className = elementClassName.trim();
	}

	/**
	 * Triggers the specified event on the given element.
	 * NOTE: This should mostly be used for testing, not on real code.
	 * @param {!Element} element The node that should trigger the event.
	 * @param {string} eventName The name of the event to be triggred.
	 * @param {Object=} opt_eventObj An object with data that should be on the
	 *   triggered event's payload.
	 */
	static triggerEvent(element, eventName, opt_eventObj) {
		var eventObj = document.createEvent('HTMLEvents');
		eventObj.initEvent(eventName, true, true);
		object.mixin(eventObj, opt_eventObj);
		element.dispatchEvent(eventObj);
	}
}

var elementsByTag = {};
dom.customEvents = {};

export default dom;
