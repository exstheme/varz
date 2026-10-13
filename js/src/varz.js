/*! VARZ.js | MIT | https://varz.dev */
'use strict';
/**
 * VARZ.js - the .vz class from data attributes, no other JavaScript needed.
 *
 * CLICKS: an element with data-varz is a trigger
 *   data-vz-toggle / data-vz-activate / data-vz-deactivate - what gets / loses the class, comma separated:
 *     self, parent, grandparent, child, prev, next, children, siblings, parentSiblings, siblingsChildren,
 *     parentSiblingsChildren, selectorSiblings, selector (elements matching data-vz-selector)
 *   data-vz-selector - CSS selector for "selector" / "selectorSiblings"
 *   data-vz-deactivate-on - click (outside), esc, scroll (the page), resize (the viewport width changes)
 *   data-vz-self-deactivation - no activation when the trigger (or its parent) is already active (accordion)
 *   data-vz-prevent - no default action (a link that opens a popup still works without JavaScript)
 *
 * ACCESSIBILITY (see varz.activator.a11y): ARIA states follow the class; data-vz-focus, data-vz-trap,
 *   data-vz-lock on the element that opens
 * SCROLL (varz.scroll): data-vz-event="inview" | "scrolled" | "spy"
 * KEYBOARD (varz.keys): arrow keys in role="tablist" (automatic) and data-vz-keys groups
 * SIZE (varz.size): data-vz-size="--name" - the element's height as a CSS variable on <html>
 *
 * Events on every element whose class changes: "varz-activated" / "varz-deactivated" - they do not bubble
 * (listen on the element, or on document in the capture phase).
 *
 * Shared by the VARZ components (varz-slider.js, varz-lightbox.js, varz-video.js): varz.util, varz.media.
 *
 * TODO: styles and props in data attributes to add and remove when toggling; delayed toggling.
 */
var varz = varz ? varz : {};

/** the active class */
varz.className = varz.className || 'vz';

/* ---------- shared helpers ---------- */

varz.util = varz.util
	? varz.util
	: {
			reducedMotion: function () {
				return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
			},

			/** visible, focusable elements inside root */
			focusable: function (root) {
				return Array.prototype.filter.call(
					root.querySelectorAll('a[href],button:not([disabled]),input:not([type="hidden"]),select,textarea,[tabindex]'),
					function (el) {
						return el.getAttribute('tabindex') !== '-1' && (el.offsetWidth || el.offsetHeight || el.getClientRects().length);
					}
				);
			},

			/** "%1$s of %2$s" (numbered) or "%s" (in order) with the arguments */
			format: function (text) {
				var args = Array.prototype.slice.call(arguments, 1);
				var i = 0;
				return String(text).replace(/%(\d)\$s|%s/g, function (all, n) {
					return args[n ? n - 1 : i++];
				});
			},

			/** hidden + display:none - an inline --d (VARZ display) wins over the hidden attribute alone */
			show: function (el, on) {
				el.hidden = !on;
				el.style.display = on ? '' : 'none';
			},

			number: function (value, fallback) {
				var n = parseFloat(value);
				return isNaN(n) ? fallback : n;
			},

			/** el itself and its descendants matching selector */
			within: function (el, selector) {
				if (!el || !el.querySelectorAll) {
					return [];
				}
				var found = Array.prototype.slice.call(el.querySelectorAll(selector));
				return el.matches && el.matches(selector) ? [el].concat(found) : found;
			},

			/**
			 * fn() once per frame after elements were added to the page (AJAX, Customizer partials) - one
			 * MutationObserver for every subscriber, made on the first one.
			 */
			added: [],
			onAdded: function (fn) {
				var U = varz.util;
				U.added.push(fn);
				if (U.observer || !('MutationObserver' in window)) {
					return;
				}
				var queued = false;
				U.observer = new MutationObserver(function (records) {
					if (queued) {
						return;
					}
					var added = records.some(function (r) {
						return r.addedNodes.length;
					});
					if (!added) {
						return;
					}
					queued = true;
					window.requestAnimationFrame(function () {
						queued = false;
						U.added.forEach(function (f) {
							f();
						});
					});
				});
				U.observer.observe(document.documentElement, { childList: true, subtree: true });
			},

			/** fn() when the document is ready */
			ready: function (fn) {
				if (document.readyState === 'loading') {
					document.addEventListener('DOMContentLoaded', fn);
				} else {
					fn();
				}
			},
		};

/* ---------- media URLs: YouTube, Vimeo, video files (varz-video.js, varz-lightbox.js) ---------- */

varz.media = varz.media
	? varz.media
	: {
			/** what a URL plays: { type: 'youtube' | 'vimeo' | 'file', src } - src autoplays; null for anything else */
			parse: function (url) {
				var a;
				try {
					a = new URL(url, document.baseURI);
				} catch (e) {
					return null;
				}
				var host = a.hostname.replace(/^(www|m)\./, '');
				var id;
				if (host === 'youtu.be') {
					id = a.pathname.slice(1);
				} else if (/^(youtube\.com|youtube-nocookie\.com)$/.test(host)) {
					id = a.searchParams.get('v') || (a.pathname.match(/^\/(?:embed|shorts|live)\/([^/?#]+)/) || [])[1];
				}
				if (id && /^[\w-]{6,}$/.test(id)) {
					// start time: 90, 90s, 1m30s
					var t = a.searchParams.get('t') || a.searchParams.get('start') || '';
					var m = t.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s?)?$/);
					var start = m ? +(m[1] || 0) * 3600 + +(m[2] || 0) * 60 + +(m[3] || 0) : 0;
					return {
						type: 'youtube',
						src: 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0&playsinline=1' + (start ? '&start=' + start : ''),
					};
				}
				if (/^(player\.)?vimeo\.com$/.test(host)) {
					var v = a.pathname.match(/^\/(?:video\/)?(\d+)(?:\/([\da-f]+))?/);
					if (v) {
						var hash = v[2] || a.searchParams.get('h');
						return { type: 'vimeo', src: 'https://player.vimeo.com/video/' + v[1] + '?autoplay=1' + (hash ? '&h=' + hash : '') };
					}
				}
				if (/\.(mp4|webm|ogv|mov)$/i.test(a.pathname)) {
					return { type: 'file', src: a.href };
				}
				return null;
			},

			/**
			 * The player element: an iframe (YouTube, Vimeo) or a <video> (files), filling its box.
			 * link: the link it plays (video files) - its image becomes the poster (no black flash while loading),
			 * data-vz-captions="captions.vtt" adds a captions track (data-vz-captions-lang, default: the page
			 * language; data-vz-captions-label, default "Captions"), shown by default.
			 * muted: autoplay without a click (browsers only allow it muted).
			 */
			player: function (media, title, link, muted) {
				var el;
				if (media.type === 'file') {
					el = document.createElement('video');
					el.controls = true;
					el.autoplay = true;
					el.playsInline = true;
					el.muted = !!muted;
					el.preload = 'metadata';
					var img = link && link.querySelector('img');
					if (img && (img.currentSrc || img.src)) {
						el.poster = img.currentSrc || img.src;
					}
					var vtt = link && link.getAttribute('data-vz-captions');
					if (vtt) {
						var track = document.createElement('track');
						track.kind = 'captions';
						track.src = vtt;
						track.srclang = link.getAttribute('data-vz-captions-lang') || document.documentElement.lang || 'en';
						track.label = link.getAttribute('data-vz-captions-label') || 'Captions';
						track.default = true;
						el.appendChild(track);
					}
					// the track before the source: it loads with the video
					el.src = media.src;
				} else {
					el = document.createElement('iframe');
					el.src = media.src + (muted ? (media.type === 'youtube' ? '&mute=1' : '&muted=1') : '');
					el.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
					el.allowFullscreen = true;
					el.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
				}
				el.title = title || '';
				el.setAttribute('style', '--d:block;--w:100%;--h:100%;--bw:0;--bgc:#000;');
				return el;
			},
		};

/* ---------- clicks ---------- */

varz.activator = varz.activator
	? varz.activator
	: {
			inited: false,

			/** elements open with data-vz-focus / data-vz-trap / data-vz-lock, in opening order */
			opened: [],

			/** open groups that close on click / esc / scroll / resize: { els, on, opener, width } */
			watching: [],

			/** kept for older code - varz.util.focusable */
			focusable: function (root) {
				return varz.util.focusable(root);
			},

			/** the elements a trigger points at; context 'activate' / 'deactivate' keeps only those that change */
			getElementsArrayToToggle: function (el, toToggle, selector, context, className) {
				className = className || varz.className;
				var all = [];
				toToggle.forEach(function (item) {
					var target;
					switch (item.trim()) {
						case 'self':
							all.push(el);
							break;
						case 'parent':
							all.push(el.parentElement);
							break;
						case 'grandparent':
							all.push(el.parentElement && el.parentElement.parentElement);
							break;
						case 'child':
							all.push(el.firstElementChild);
							break;
						case 'prev':
							all.push(el.previousElementSibling);
							break;
						case 'next':
							all.push(el.nextElementSibling);
							break;
						case 'children':
							all.push.apply(all, el.children);
							break;
						case 'siblings':
							all.push.apply(all, el.parentElement.children);
							break;
						case 'parentSiblings':
							all.push.apply(all, el.parentElement.parentElement.children);
							break;
						case 'siblingsChildren':
							Array.prototype.forEach.call(el.parentElement.children, function (child) {
								all.push.apply(all, child.children);
							});
							break;
						case 'parentSiblingsChildren':
							Array.prototype.forEach.call(el.parentElement.parentElement.children, function (child) {
								all.push.apply(all, child.children);
							});
							break;
						case 'selectorSiblings':
							target = selector && document.querySelector(selector);
							if (target) {
								all.push.apply(all, target.parentElement.children);
							}
							break;
						// 'selector'
						default:
							if (selector) {
								all.push.apply(all, document.querySelectorAll(selector));
							}
					}
				});
				all = all.filter(Boolean);
				if (context === 'deactivate') {
					return all.filter(function (t) {
						return t.classList.contains(className);
					});
				}
				if (context === 'activate') {
					return all.filter(function (t) {
						return !t.classList.contains(className);
					});
				}
				return all;
			},

			/**
			 * Adds / removes / toggles the class on the elements (context: 'activate' | 'deactivate' | 'toggle').
			 * deactivateOn: when the opened elements close by themselves (click, esc, scroll, resize);
			 * opener: the clicked trigger (aria-expanded, focus return). The 5th argument is unused (older code).
			 */
			toggleElementsArray: function (elementsArray, context, className, deactivateOn, unused, opener) {
				var A = varz.activator;
				context = context || 'toggle';
				className = className || varz.className;
				elementsArray.forEach(function (el) {
					var on = context === 'activate' ? true : context === 'deactivate' ? false : !el.classList.contains(className);
					el.classList.toggle(className, on);
					A.a11y(el, on, opener);
					el.dispatchEvent(new Event(on ? 'varz-activated' : 'varz-deactivated'));
				});
				if (context !== 'deactivate' && deactivateOn && deactivateOn.length) {
					A.setDeactivateElementsEvents(elementsArray, className, deactivateOn, opener);
				}
			},

			/** the opened elements close on these events (one listener per event type for every group) */
			setDeactivateElementsEvents: function (elementsArray, className, deactivateOn, opener) {
				var A = varz.activator;
				className = className || varz.className;
				var els = elementsArray.filter(function (el) {
					return el.classList.contains(className);
				});
				if (!els.length) {
					return;
				}
				A.watching = A.watching.filter(function (group) {
					return !els.some(function (el) {
						return group.els.indexOf(el) > -1;
					});
				});
				A.watching.push({
					els: els,
					on: deactivateOn.map(function (s) {
						return s.trim();
					}),
					opener: opener && opener.nodeType === 1 ? opener : null,
					width: window.innerWidth,
					className: className,
				});
			},

			/** closes groups listening to an event - test(group) decides; esc closes only the last one opened */
			close: function (type, test, lastOnly) {
				var A = varz.activator;
				// groups whose elements were closed another way are dropped
				A.watching = A.watching.filter(function (group) {
					return group.els.some(function (el) {
						return el.classList.contains(group.className);
					});
				});
				var groups = A.watching.filter(function (group) {
					return group.on.indexOf(type) > -1 && (!test || test(group));
				});
				if (lastOnly) {
					groups = groups.slice(-1);
				}
				groups.forEach(function (group) {
					A.watching.splice(A.watching.indexOf(group), 1);
					A.toggleElementsArray(
						group.els.filter(function (el) {
							return el.classList.contains(group.className);
						}),
						'deactivate',
						group.className
					);
				});
			},

			/** the elements a trigger points at, with the class changed */
			toggle: function (el, toToggle, context, className, selector, deactivateOn) {
				var A = varz.activator;
				var targets = A.getElementsArrayToToggle(el, toToggle, selector || '', context || 'toggle', className);
				A.toggleElementsArray(targets, context || 'toggle', className, deactivateOn || [], false, el);
			},

			/**
			 * ACCESSIBILITY - runs for every element whose state changes (clicks, deactivate-on events, API calls).
			 * el: the element, active: its new state, opener: the clicked [data-varz] element (remembered while open).
			 * Only attributes present in the markup are updated - nothing is added:
			 * - aria-expanded on buttons with aria-controls="{el id}", on the opener and on [data-varz] buttons that
			 *   are direct children of el and toggle / activate their 'parent' (accordion, dropdown)
			 * - aria-selected / aria-pressed on el itself (tabs, toggle buttons); tabs: tabindex 0 / -1
			 * Opt-in attributes on el:
			 * - data-vz-focus: focus moves in when it opens - value = selector inside el, empty = the first form
			 *   field, else the first focusable element; focus returns to the opener when it closes
			 * - data-vz-trap: Tab / Shift+Tab stay inside while it is open (dialogs, panels)
			 * - data-vz-lock: no page scroll while it is open (html.vz-lock + overflow:hidden)
			 */
			a11y: function (el, active, opener) {
				var A = varz.activator;
				var state = active ? 'true' : 'false';
				if (active && opener) {
					el.vzOpener = opener;
				}
				opener = el.vzOpener;
				var buttons = [];
				if (el.id && window.CSS && CSS.escape) {
					buttons.push.apply(buttons, document.querySelectorAll('[aria-controls~="' + CSS.escape(el.id) + '"][aria-expanded]'));
				}
				if (opener && opener !== el && opener.hasAttribute('aria-expanded')) {
					buttons.push(opener);
				}
				Array.prototype.forEach.call(el.children, function (child) {
					var targets = (child.dataset.vzToggle || '') + ',' + (child.dataset.vzActivate || '');
					if (child.hasAttribute('data-varz') && child.hasAttribute('aria-expanded') && targets.split(',').indexOf('parent') > -1) {
						buttons.push(child);
					}
				});
				buttons.forEach(function (b) {
					b.setAttribute('aria-expanded', state);
				});
				['aria-selected', 'aria-pressed'].forEach(function (name) {
					if (el.hasAttribute(name)) {
						el.setAttribute(name, state);
					}
				});
				// tabs: only the selected tab is in the Tab order (arrow keys move between tabs, see varz.keys)
				if (el.getAttribute('role') === 'tab' && el.hasAttribute('aria-selected')) {
					el.setAttribute('tabindex', active ? '0' : '-1');
				}

				if (!el.hasAttribute('data-vz-focus') && !el.hasAttribute('data-vz-trap') && !el.hasAttribute('data-vz-lock')) {
					return;
				}
				var i = A.opened.indexOf(el);
				if (active && i < 0) {
					A.opened.push(el);
				} else if (!active && i > -1) {
					A.opened.splice(i, 1);
				}
				var lock = A.opened.some(function (o) {
					return o.hasAttribute('data-vz-lock');
				});
				document.documentElement.classList.toggle('vz-lock', lock);
				document.documentElement.style.overflow = lock ? 'hidden' : '';

				if (!el.hasAttribute('data-vz-focus')) {
					return;
				}
				if (active) {
					// an element shown by a visibility / opacity transition cannot take focus at once - next frames
					var tries = 0;
					var focusIn = function () {
						var want = el.getAttribute('data-vz-focus');
						var target = want ? el.querySelector(want) : null;
						if (!target) {
							var items = varz.util.focusable(el);
							target =
								items.filter(function (f) {
									return /^(INPUT|SELECT|TEXTAREA)$/.test(f.tagName);
								})[0] || items[0];
						}
						if (target) {
							target.focus();
						}
						// until the target has it - focus already inside is not enough when the trigger itself is
						// inside the element (a burger in the menu wrapper it opens)
						var done = target ? document.activeElement === target : el.contains(document.activeElement);
						if (!done && ++tries < 20 && A.opened.indexOf(el) > -1) {
							window.requestAnimationFrame(focusIn);
						}
					};
					window.requestAnimationFrame(focusIn);
				} else if (opener && opener.focus && (el.contains(document.activeElement) || document.activeElement === document.body)) {
					opener.focus();
				}
			},

			initDocument: function () {
				var A = varz.activator;
				if (A.inited) {
					return;
				}
				A.inited = true;

				// triggers
				document.addEventListener('click', function (e) {
					var el = e.target.closest && e.target.closest('[data-varz]');
					if (!el) {
						return;
					}
					var data = el.dataset;
					var list = function (value) {
						return value ? value.split(',') : [];
					};
					if (data.vzPrevent !== undefined) {
						e.preventDefault();
					}
					var deactivateOn = list(data.vzDeactivateOn);
					var selector = data.vzSelector || '';
					// a flag: present without a value or with any value but "false"
					var preventActivate =
						data.vzSelfDeactivation !== undefined &&
						data.vzSelfDeactivation !== 'false' &&
						(el.classList.contains(varz.className) || el.parentElement.classList.contains(varz.className));
					// deactivate first, then toggle, finally activate
					if (data.vzDeactivate) {
						A.toggle(el, list(data.vzDeactivate), 'deactivate', varz.className, selector, deactivateOn);
					}
					if (data.vzToggle) {
						A.toggle(el, list(data.vzToggle), 'toggle', varz.className, selector, deactivateOn);
					}
					if (data.vzActivate && !preventActivate) {
						A.toggle(el, list(data.vzActivate), 'activate', varz.className, selector, deactivateOn);
					}
				});

				// deactivate-on: a click outside the open elements (and outside the trigger that opened them -
				// it handles its own click)
				document.addEventListener(
					'click',
					function (e) {
						A.close('click', function (group) {
							var inside = group.els.some(function (el) {
								return el.contains(e.target);
							});
							return !inside && !(group.opener && group.opener.contains(e.target));
						});
					},
					true
				);
				// Esc: the last opened first (a dropdown inside a panel, then the panel)
				document.addEventListener(
					'keyup',
					function (e) {
						if (e.key === 'Escape') {
							A.close('esc', null, true);
						}
					},
					true
				);
				// the page scrolls (not a scroll inside an element)
				document.addEventListener(
					'scroll',
					function (e) {
						if (e.target === document) {
							A.close('scroll');
						}
					},
					{ capture: true, passive: true }
				);
				// the viewport width changes (height changes - a mobile address bar - do not count)
				window.addEventListener(
					'resize',
					function () {
						A.close('resize', function (group) {
							return window.innerWidth !== group.width;
						});
					},
					{ passive: true }
				);

				// data-vz-trap: Tab / Shift+Tab loop inside the last opened trap
				document.addEventListener('keydown', function (e) {
					if (e.key !== 'Tab') {
						return;
					}
					var traps = A.opened.filter(function (o) {
						return o.hasAttribute('data-vz-trap');
					});
					var box = traps[traps.length - 1];
					var items = box ? varz.util.focusable(box) : [];
					if (!items.length) {
						return;
					}
					var first = items[0];
					var last = items[items.length - 1];
					var outside = !box.contains(document.activeElement);
					if (e.shiftKey && (outside || document.activeElement === first)) {
						e.preventDefault();
						last.focus();
					} else if (!e.shiftKey && (outside || document.activeElement === last)) {
						e.preventDefault();
						first.focus();
					}
				});
			},
		};

varz.activator.initDocument();

/* ---------- scroll ---------- */

/**
 * .vz from the scroll position instead of a click (no data-varz needed):
 * - data-vz-event="inview": .vz while the element is in the viewport (reveal animations: --o:0;--vz-o:1)
 *     data-vz-once - keep .vz after the first time
 *     data-vz-threshold - visible part needed, 0-1 (default 0.15; a taller element - that part of the viewport)
 * - data-vz-event="scrolled": .vz once the page is scrolled more than data-vz-offset px (default 100):
 *     back to top button, shrinking sticky header
 * - data-vz-event="spy": on a navigation - .vz on the link (a[href^="#"]) of the current section, the last one
 *     whose top passed data-vz-offset px from the viewport top (default 100 - e.g. a sticky header height);
 *     aria-current is updated ("location" / "false") when the links have it
 * data-vz-activate + data-vz-selector (the same values as for clicks) put .vz on other elements instead.
 */
varz.scroll = varz.scroll
	? varz.scroll
	: {
			inited: false,
			ticking: false,
			scrolled: [],
			spies: [],

			/** .vz on the element or its data-vz-activate targets */
			set: function (el, on) {
				var data = el.dataset;
				var targets = data.vzActivate
					? varz.activator.getElementsArrayToToggle(el, data.vzActivate.split(','), data.vzSelector || '', 'toggle')
					: [el];
				targets = targets.filter(function (t) {
					return t.classList.contains(varz.className) !== on;
				});
				if (targets.length) {
					varz.activator.toggleElementsArray(targets, on ? 'activate' : 'deactivate');
				}
			},

			/** finds the scroll elements (also those added later) - inview ones get an IntersectionObserver each */
			scan: function () {
				var S = varz.scroll;
				var U = varz.util;
				S.scrolled = Array.prototype.slice.call(document.querySelectorAll('[data-vz-event~="scrolled"]'));
				S.spies = Array.prototype.slice.call(document.querySelectorAll('[data-vz-event~="spy"]'));
				document.querySelectorAll('[data-vz-event~="inview"]').forEach(function (el) {
					if (el.vzObserved) {
						return;
					}
					el.vzObserved = true;
					if (!('IntersectionObserver' in window)) {
						S.set(el, true);
						return;
					}
					var once = el.dataset.vzOnce !== undefined;
					var part = Math.min(1, Math.max(0, U.number(el.dataset.vzThreshold, 0.15)));
					var io = new IntersectionObserver(
						function (entries) {
							entries.forEach(function (entry) {
								var view = entry.rootBounds ? entry.rootBounds.height : window.innerHeight;
								var on = entry.isIntersecting && (entry.intersectionRatio >= part || entry.intersectionRect.height >= view * part);
								if (on) {
									S.set(el, true);
									if (once) {
										io.disconnect();
									}
								} else if (!once) {
									S.set(el, false);
								}
							});
						},
						{ threshold: [0, part, 0.25, 0.5, 0.75, 1] }
					);
					io.observe(el);
				});
			},

			/** scrolled + spy, once per frame */
			update: function () {
				var S = varz.scroll;
				var U = varz.util;
				var y = window.scrollY;
				S.scrolled.forEach(function (el) {
					var on = y > U.number(el.dataset.vzOffset, 100);
					if (on !== el.vzScrolled) {
						el.vzScrolled = on;
						S.set(el, on);
					}
				});
				if (!S.spies.length) {
					return;
				}
				var bottom = window.innerHeight + y >= document.documentElement.scrollHeight - 2;
				S.spies.forEach(function (nav) {
					var offset = U.number(nav.dataset.vzOffset, 100);
					var current = null;
					var best = -Infinity;
					var links = Array.prototype.slice.call(nav.querySelectorAll('a[href^="#"]'));
					links.forEach(function (a) {
						var id = decodeURIComponent(a.getAttribute('href').slice(1));
						var section = id && document.getElementById(id);
						if (!section) {
							return;
						}
						var top = section.getBoundingClientRect().top;
						// at the page bottom the last visible section counts, even if it never reaches the offset
						if ((top <= offset + 1 || (bottom && top < window.innerHeight)) && top > best) {
							best = top;
							current = a;
						}
					});
					links.forEach(function (a) {
						var on = a === current;
						if (on !== a.classList.contains(varz.className)) {
							varz.activator.toggleElementsArray([a], on ? 'activate' : 'deactivate');
						}
						if (a.hasAttribute('aria-current')) {
							a.setAttribute('aria-current', on ? 'location' : 'false');
						}
					});
				});
			},

			init: function () {
				var S = varz.scroll;
				if (S.inited) {
					return;
				}
				S.inited = true;
				var frame = function () {
					if (S.ticking) {
						return;
					}
					S.ticking = true;
					window.requestAnimationFrame(function () {
						S.ticking = false;
						S.update();
					});
				};
				varz.util.ready(function () {
					S.scan();
					S.update();
					window.addEventListener('scroll', frame, { passive: true });
					window.addEventListener('resize', frame, { passive: true });
					varz.util.onAdded(function () {
						S.scan();
						frame();
					});
				});
			},
		};

varz.scroll.init();

/* ---------- keyboard ---------- */

/**
 * Arrow keys between the items of a group (WAI-ARIA tabs / toolbar pattern):
 * - role="tablist": automatic - ←/→ (and ↑/↓), Home, End move to a tab and select it (click);
 *   only the selected tab is in the Tab order (tabindex 0 / -1)
 * - data-vz-keys on any other group (toolbar, segmented buttons, menu): the same keys move focus only;
 *   value = selector of the items (default: buttons and links inside)
 */
varz.keys = varz.keys
	? varz.keys
	: {
			inited: false,

			items: function (group) {
				var tablist = group.getAttribute('role') === 'tablist';
				var selector = group.getAttribute('data-vz-keys') || (tablist ? '[role="tab"]' : 'button,a[href]');
				return Array.prototype.filter.call(group.querySelectorAll(selector), function (el) {
					return (
						!el.disabled &&
						el.closest('[role="tablist"],[data-vz-keys]') === group &&
						(el.offsetWidth || el.offsetHeight || el.getClientRects().length)
					);
				});
			},

			/** tablists: the selected tab (else the first) gets tabindex 0, the others -1 */
			scan: function () {
				document.querySelectorAll('[role="tablist"]').forEach(function (group) {
					if (group.vzKeys) {
						return;
					}
					group.vzKeys = true;
					var tabs = varz.keys.items(group);
					var selected =
						tabs.filter(function (t) {
							return t.getAttribute('aria-selected') === 'true';
						})[0] || tabs[0];
					tabs.forEach(function (t) {
						t.setAttribute('tabindex', t === selected ? '0' : '-1');
					});
				});
			},

			init: function () {
				var K = varz.keys;
				if (K.inited) {
					return;
				}
				K.inited = true;
				document.addEventListener('keydown', function (e) {
					var moves = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1, Home: 'first', End: 'last' };
					if (!(e.key in moves) || e.altKey || e.ctrlKey || e.metaKey || !e.target.closest) {
						return;
					}
					var group = e.target.closest('[role="tablist"],[data-vz-keys]');
					if (!group || /^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName)) {
						return;
					}
					var items = K.items(group);
					var i = items.indexOf(e.target);
					if (i < 0) {
						return;
					}
					var move = moves[e.key];
					var n = move === 'first' ? 0 : move === 'last' ? items.length - 1 : (i + move + items.length) % items.length;
					e.preventDefault();
					items[n].focus();
					if (group.getAttribute('role') === 'tablist' && items[n].getAttribute('aria-selected') !== 'true') {
						items[n].click();
					}
				});
				varz.util.ready(function () {
					K.scan();
					varz.util.onAdded(K.scan);
				});
			},
		};

varz.keys.init();

/* ---------- sizes ---------- */

/**
 * data-vz-size="--name": the element's height in px as a CSS variable on <html> - var(--name) anywhere,
 * kept up to date while it changes (ResizeObserver): room under a sticky or transparent header,
 * scroll-padding-top, offsets. data-vz-size="--name width" for the width.
 * Use it with a fallback for the moment before the script runs: --mbs:calc(-1 * var(--name, 80px)).
 */
varz.size = varz.size
	? varz.size
	: {
			inited: false,
			observer: null,
			seen: [],

			/**
			 * writes the size of one element - its layout box (transforms are left out: a scale / slide
			 * animation does not change the value, a height transition is followed frame by frame)
			 */
			set: function (el, entry) {
				var parts = (el.getAttribute('data-vz-size') || '').trim().split(/\s+/);
				if (parts[0].indexOf('--') !== 0 || !el.isConnected) {
					return;
				}
				var width = parts[1] === 'width';
				var box = entry && entry.borderBoxSize && entry.borderBoxSize[0];
				var value = box ? (width ? box.inlineSize : box.blockSize) : width ? el.offsetWidth : el.offsetHeight;
				document.documentElement.style.setProperty(parts[0], Math.round(value * 100) / 100 + 'px');
			},

			/** new data-vz-size elements: measured and observed */
			scan: function () {
				var Z = varz.size;
				Array.prototype.forEach.call(document.querySelectorAll('[data-vz-size]'), function (el) {
					if (Z.seen.indexOf(el) > -1) {
						return;
					}
					Z.seen.push(el);
					Z.set(el);
					if (Z.observer) {
						Z.observer.observe(el);
					}
				});
			},

			init: function () {
				var Z = varz.size;
				if (Z.inited) {
					return;
				}
				Z.inited = true;
				if ('ResizeObserver' in window) {
					Z.observer = new ResizeObserver(function (entries) {
						entries.forEach(function (entry) {
							Z.set(entry.target, entry);
						});
					});
				} else {
					window.addEventListener(
						'resize',
						function () {
							Z.seen.forEach(function (el) {
								Z.set(el);
							});
						},
						{ passive: true }
					);
				}
				varz.util.ready(function () {
					Z.scan();
					varz.util.onAdded(Z.scan);
				});
			},
		};

varz.size.init();
