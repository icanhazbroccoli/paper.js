/*
 * Paper.js
 * 
 * This file is part of Paper.js, a JavaScript Vector Graphics Library,
 * based on Scriptographer.org and designed to be largely API compatible.
 * http://paperjs.org/
 * http://scriptographer.org/
 * 
 * Distributed under the MIT license. See LICENSE file for details.
 * 
 * Copyright (c) 2011, Juerg Lehni & Jonathan Puckey
 * http://lehni.org/ & http://jonathanpuckey.com/
 * 
 * All rights reserved.
 */

var DomElement = new function() {
	function cumulateOffset(el, name, parent, test) {
		var left = name + 'Left',
			top = name + 'Top',
			x = 0,
			y = 0,
			style;
		// If we're asked to calculate positioned offset, stop at any parent
		// element that has relative or absolute position.
		while (el && el.style && (!test || !test.test(
					style = DomElement.getComputedStyle(el, 'position')))) {
			x += el[left] || 0;
			y += el[top] || 0;
			el = el[parent];
		}
		return {
			offset: Point.create(x, y),
			element: el,
			style: style
		};
	}

	function getScrollOffset(el, test) {
		return cumulateOffset(el, 'scroll', 'parentNode', test).offset;
	}

	return {
		getWindow: function(doc) {
			return doc.defaultView || doc.parentWindow;
		},

		getComputedStyle: function(el, name) {
			if (el.currentStyle)
				return el.currentStyle[Base.camelize(name)];
			var style = DomElement.getWindow(el.ownerDocument).getComputedStyle(
					el, null);
			return style ? style.getPropertyValue(Base.hyphenate(name)) : null;
		},

		getOffset: function(el, positioned, scroll) {
			var res = cumulateOffset(el, 'offset', 'offsetParent',
					positioned ? /^(relative|absolute|fixed)$/ : /^fixed$/);
			// We need to handle fixed positioned elements seperately if we're
			// asked to calculate offsets without scrolling removed, by adding
			// the scroll offset to them.
			if (res.style == 'fixed' && !scroll)
				return res.offset.add(getScrollOffset(res.element));
			// Otherwise remove scrolling from the calculated offset if that's
			// what we're asked to do.
			return scroll
					? res.offset.subtract(getScrollOffset(el, /^fixed$/))
					: res.offset;
		},

		getSize: function(el) {
			return Size.create(el.offsetWidth, el.offsetHeight);
		},

		getBounds: function(el, positioned, scroll) {
			return new Rectangle(DomElement.getOffset(el, positioned, scroll),
					DomElement.getSize(el));
		},

		getWindowSize: function() {
			var doc = document.getElementsByTagName(
					document.compatMode === 'CSS1Compat' ? 'html' : 'body')[0];
			return Size.create(
				window.innerWidth || doc.clientWidth,
				window.innerHeight || doc.clientHeight
			);
		},

		/**
		 * Checks if element is invisibile (display: none, ...)
		 */
		isInvisible: function(el) {
			return DomElement.getSize(el).equals([0, 0]);
		},

		/**
		 * Checks if element is visibile in current viewport
		 */
		isVisible: function(el) {
			// See if the scrolled bounds intersect with the windows rectangle
			// which always starts at 0, 0
			return !DomElement.isInvisible(el)
					&& new Rectangle([0, 0], DomElement.getWindowSize())
						.intersects(DomElement.getBounds(el, false, true));
		}
	};
};
