/*! VARZ slider | MIT | https://varz.dev */
'use strict';
/**
 * VARZ slider - CSS scroll-snap carousel + a small progressive enhancement. Needs varz.js (varz.util).
 *
 * Without JavaScript the track is a native horizontal scroller with snap points (swipe, trackpad,
 * Shift + wheel, keyboard when focused). This script adds: arrows, dots, autoplay with a pause
 * button, mouse drag, keyboard arrows, loop, the .vz class on the slides in view and accessible labels.
 * Slides out of view are inert (no Tab stops, hidden from screen readers).
 * prefers-reduced-motion: no smooth scrolling (a short fade instead), autoplay does not start by itself.
 *
 * Markup (styles are VARZ inline variables - see slider.html):
 *
 * <div data-varz-slider [data-vz-autoplay="5000"] [data-vz-loop] [data-vz-controls="arrows,dots,play"] aria-label="Featured">
 *     <div data-varz-track>                       scroll container: flex, overflow-x auto, scroll-snap
 *         <div>slide</div> ...                    snap-aligned children, any width (100%, 50% ...)
 *     </div>
 *     <button type="button" data-varz-prev>       optional
 *     <button type="button" data-varz-next>       optional
 *     <div data-varz-dots></div>                  optional, filled with one button per position
 *     <button type="button" data-varz-play>       optional pause / play (.vz while playing)
 * </div>
 *
 * data-vz-controls: the controls the markup does not have are added with default looks (varz.slider.styles):
 *   data-vz-dots="pill" (default) | round | square | line | ring | number - the dots' look
 *   data-vz-arrows="round" (default) | square | outline | plain, + "bar": next to the dots instead of over
 *   the slides (data-vz-arrows="outline bar")
 * Dots are built from the [data-varz-dot] template inside [data-varz-dots] when there is one (cloned),
 * otherwise plain buttons; an element with data-varz-dot-number inside the template gets the dot's number.
 * The active dot and the slides in view get .vz - style them with VARZ state props (--vz-bgc, --p-vz-w ...).
 *
 * Events on the slider element: "varz-slide" { detail: { index, count } } after the position changes.
 * Slides dispatch "varz-activated" / "varz-deactivated" when they come into view / leave it (varz-video.js
 * stops a video in a slide that leaves, data-vz-autoplay starts one that comes in). Autoplay holds while a
 * video in the slider plays ("varz-video-play" / "varz-video-stop").
 *
 * API: varz.slider.init( root? ), varz.slider.go( slider, index ), .next( slider ), .prev( slider )
 * Sliders added to the page later are set up by themselves. Texts: varz.slider.i18n - change before init.
 */
var varz = varz ? varz : {};

varz.slider = varz.slider
	? varz.slider
	: {
			i18n: {
				carousel: 'carousel',
				slide: 'slide',
				/* %1$s current, %2$s total */
				slideOf: '%1$s of %2$s',
				goTo: 'Go to slide %s',
				prev: 'Previous slide',
				next: 'Next slide',
				pause: 'Pause autoplay',
				play: 'Start autoplay',
			},

			/** looks of the controls added by data-vz-controls */
			styles: {
				// over the slides: geometry + one of the arrow looks
				arrow: '--pos:absolute;--t:50%;--tf:translateY(-50%);--d:inline-flex;--ai:center;--jc:center;--w:44px;--h:44px;--p:0;--bw:0;--br:50%;--bgc:rgba(0,0,0,.45);--c:#fff;--cur:pointer;--hov-bgc:rgba(0,0,0,.7);',
				arrows: {
					round: '--br:50%;--bgc:rgba(0,0,0,.45);--c:#fff;--hov-bgc:rgba(0,0,0,.7);',
					square: '--br:8px;--bgc:rgba(0,0,0,.45);--c:#fff;--hov-bgc:rgba(0,0,0,.7);',
					outline: '--br:50%;--bgc:transparent;--bw:2px;--bs:solid;--bc:rgba(255,255,255,.8);--c:#fff;--hov-bgc:rgba(0,0,0,.35);',
					plain: '--w:36px;--br:0;--bgc:transparent;--c:#fff;--o:.85;--hov-o:1;--fil:drop-shadow(0 1px 3px rgba(0,0,0,.6));',
				},
				// next to the dots (data-vz-arrows="... bar"): on the page colors
				arrowBar: '--d:inline-flex;--ai:center;--jc:center;--w:32px;--h:32px;--p:0;--bw:1px;--bs:solid;--bc:var(--vz-c-border);--bgc:transparent;--c:var(--vz-c-dark);--cur:pointer;--hov-bc:var(--vz-c-accent);--hov-c:var(--vz-c-accent);',
				arrowsBar: {
					round: '--br:50%;',
					square: '--br:6px;',
					outline: '--br:50%;--bw:2px;',
					plain: '--bw:0;--br:0;',
				},
				bar: '--d:flex;--jc:center;--ai:center;--g:8px;--mbs:12px;',
				play: '--d:inline-flex;--ai:center;--jc:center;--w:32px;--h:32px;--p:0;--bw:1px;--bs:solid;--bc:var(--vz-c-border);--br:50%;--bgc:transparent;--c:var(--vz-c-dark);--cur:pointer;',
				dots: '--d:flex;--ai:center;--g:2px;',
				dot: '--d:inline-flex;--ai:center;--jc:center;--miw:24px;--h:24px;--p:0 2px;--bw:0;--bgc:transparent;--cur:pointer;',
				dotMark: '--d:block;--w:10px;--h:10px;--br:50%;--bgc:var(--vz-c-border);--p-vz-bgc:var(--vz-c-accent);--tr:background-color .2s,transform .2s;--p-vz-tf:scale(1.3);',
				// the mark inside each dot, per data-vz-dots look (.vz on the dot: --p-vz-)
				dotMarks: {
					round: '--d:block;--w:10px;--h:10px;--br:50%;--bgc:var(--vz-c-border);--p-vz-bgc:var(--vz-c-accent);--tr:background-color .2s,transform .2s;--p-vz-tf:scale(1.3);',
					pill: '--d:block;--w:8px;--h:8px;--br:999px;--bgc:var(--vz-c-border);--p-vz-w:24px;--p-vz-bgc:var(--vz-c-accent);--tr:width .25s,background-color .25s;',
					square: '--d:block;--w:10px;--h:10px;--br:2px;--bgc:var(--vz-c-border);--p-vz-bgc:var(--vz-c-accent);--tr:background-color .2s;',
					line: '--d:block;--w:20px;--h:3px;--br:2px;--bgc:var(--vz-c-border);--p-vz-bgc:var(--vz-c-accent);--tr:background-color .2s;',
					ring: '--d:block;--w:10px;--h:10px;--br:50%;--bw:2px;--bs:solid;--bc:var(--vz-c-border);--bgc:transparent;--p-vz-bc:var(--vz-c-accent);--p-vz-bgc:var(--vz-c-accent);--tr:background-color .2s,border-color .2s;',
					number: '--d:inline-flex;--ai:center;--jc:center;--w:24px;--h:24px;--br:50%;--fs:12px;--fw:600;--lh:1;--c:var(--vz-c-muted);--p-vz-bgc:var(--vz-c-accent);--p-vz-c:#fff;--tr:background-color .2s,color .2s;',
				},
			},

			/** "look extra" attribute value -> [ look, has extra ] with a known look (else the default) */
			look: function (value, looks, fallback, extra) {
				var words = (value || '').trim().split(/\s+/);
				var look = words.filter(function (w) {
					return looks[w];
				})[0];
				return [look || fallback, words.indexOf(extra) > -1];
			},

			init: function (root) {
				(root || document).querySelectorAll('[data-varz-slider]').forEach(function (el) {
					if (!el.varzSlider) {
						varz.slider.setup(el);
					}
				});
			},

			/** data-vz-controls: arrows, dots, play - only those the markup does not have */
			controls: function (el, track) {
				var S = varz.slider;
				var want = (el.getAttribute('data-vz-controls') || '').split(',').map(function (s) {
					return s.trim();
				});
				var icon = function (path, style) {
					return '<svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style="' + style + '"><path d="' + path + '"/></svg>';
				};
				var arrowLook = S.look(el.getAttribute('data-vz-arrows'), S.styles.arrows, 'round', 'bar');
				var inBar = arrowLook[1];
				var arrowBar = S.styles.arrowBar + S.styles.arrowsBar[arrowLook[0]];
				var prev = icon('M15.4 7.4 14 6l-6 6 6 6 1.4-1.4-4.6-4.6z', '--d:block;');
				var next = icon('M8.6 7.4 10 6l6 6-6 6-1.4-1.4 4.6-4.6z', '--d:block;');
				var arrows = want.indexOf('arrows') > -1 && !el.querySelector('[data-varz-prev],[data-varz-next]');
				if (arrows && !inBar) {
					// arrows sit over the track: a positioned wrapper (made when the track is a direct child)
					var wrap = track.parentElement;
					if (wrap === el) {
						wrap = document.createElement('div');
						wrap.setAttribute('style', '--pos:relative;');
						el.insertBefore(wrap, track);
						wrap.appendChild(track);
					}
					wrap.insertAdjacentHTML(
						'beforeend',
						'<button type="button" data-varz-prev style="' + S.styles.arrow + S.styles.arrows[arrowLook[0]] + '--l:12px;">' + prev + '</button>' +
							'<button type="button" data-varz-next style="' + S.styles.arrow + S.styles.arrows[arrowLook[0]] + '--r:12px;">' + next + '</button>'
					);
				}
				var dots = want.indexOf('dots') > -1 && !el.querySelector('[data-varz-dots]');
				var play = want.indexOf('play') > -1 && !el.querySelector('[data-varz-play]');
				var dotLook = S.look(el.getAttribute('data-vz-dots'), S.styles.dotMarks, 'pill')[0];
				var mark = '<span' + (dotLook === 'number' ? ' data-varz-dot-number' : '') + ' style="' + S.styles.dotMarks[dotLook] + '"></span>';
				arrows = arrows && inBar;
				if (dots || play || arrows) {
					el.insertAdjacentHTML(
						'beforeend',
						'<div style="' + S.styles.bar + '">' +
							(play
								? '<button type="button" data-varz-play style="' + S.styles.play + '">' + icon('M8 5v14l11-7z', '--d:block;--w:14px;--h:14px;--p-vz-d:none;') + icon('M6 5h4v14H6zm8 0h4v14h-4z', '--d:none;--w:14px;--h:14px;--p-vz-d:block;') + '</button>'
								: '') +
							(arrows ? '<button type="button" data-varz-prev style="' + arrowBar + '">' + prev + '</button>' : '') +
							(dots ? '<div data-varz-dots style="' + S.styles.dots + '"><button type="button" data-varz-dot style="' + S.styles.dot + '">' + mark + '</button></div>' : '') +
							(arrows ? '<button type="button" data-varz-next style="' + arrowBar + '">' + next + '</button>' : '') +
							'</div>'
					);
				}
			},

			setup: function (el) {
				var S = varz.slider;
				var U = varz.util;
				var track = el.querySelector('[data-varz-track]');
				if (!track) {
					return;
				}
				if (el.hasAttribute('data-vz-controls')) {
					S.controls(el, track);
				}
				var state = {
					el: el,
					track: track,
					slides: [],
					positions: [],
					index: 0,
					loop: el.hasAttribute('data-vz-loop'),
					delay: parseInt(el.getAttribute('data-vz-autoplay'), 10) || 0,
					timer: 0,
					playing: false,
					holds: {},
					prev: el.querySelector('[data-varz-prev]'),
					next: el.querySelector('[data-varz-next]'),
					dots: el.querySelector('[data-varz-dots]'),
					play: el.querySelector('[data-varz-play]'),
				};
				el.varzSlider = state;

				// accessible carousel pattern (WAI-ARIA APG)
				el.setAttribute('role', el.getAttribute('role') || 'region');
				el.setAttribute('aria-roledescription', S.i18n.carousel);
				if (!track.hasAttribute('tabindex')) {
					track.setAttribute('tabindex', '0');
				}
				track.setAttribute('aria-live', state.delay ? 'off' : 'polite');

				if (state.prev) {
					state.prev.setAttribute('aria-label', state.prev.getAttribute('aria-label') || S.i18n.prev);
					state.prev.addEventListener('click', function () {
						S.prev(el);
					});
				}
				if (state.next) {
					state.next.setAttribute('aria-label', state.next.getAttribute('aria-label') || S.i18n.next);
					state.next.addEventListener('click', function () {
						S.next(el);
					});
				}
				if (state.play) {
					state.play.addEventListener('click', function () {
						// an explicit choice wins over hover / focus pauses
						state.holds = {};
						if (state.playing) {
							S.stop(state);
						} else {
							S.start(state);
						}
					});
				}

				// keyboard: arrows while the track (or a slide inside it) has focus
				track.addEventListener('keydown', function (e) {
					if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
						e.preventDefault();
						S[e.key === 'ArrowRight' ? 'next' : 'prev'](el);
					}
				});

				S.drag(state);

				// position after scrolling (arrows, dots, swipe, wheel)
				var frame = 0;
				track.addEventListener(
					'scroll',
					function () {
						cancelAnimationFrame(frame);
						frame = requestAnimationFrame(function () {
							S.update(state);
						});
					},
					{ passive: true }
				);

				// slides in view: .vz + events (varz.js), out of view: inert
				if ('IntersectionObserver' in window) {
					state.observer = new IntersectionObserver(
						function (entries) {
							entries.forEach(function (entry) {
								var on = entry.intersectionRatio >= 0.6;
								entry.target.inert = !on;
								if (on !== entry.target.classList.contains(varz.className)) {
									varz.activator.toggleElementsArray([entry.target], on ? 'activate' : 'deactivate');
								}
							});
						},
						{ root: track, threshold: [0, 0.6, 1] }
					);
				}

				// autoplay pauses while the visitor looks at or works with the slider
				if (state.delay) {
					var hold = function (reason, on) {
						if (on) {
							state.holds[reason] = true;
						} else {
							delete state.holds[reason];
						}
						S.schedule(state);
					};
					el.addEventListener('mouseenter', function () {
						hold('hover', true);
					});
					el.addEventListener('mouseleave', function () {
						hold('hover', false);
					});
					el.addEventListener('focusin', function () {
						hold('focus', true);
					});
					el.addEventListener('focusout', function (e) {
						if (!el.contains(e.relatedTarget)) {
							hold('focus', false);
						}
					});
					// a swipe / drag stops autoplay for good (WCAG 2.2.2: the visitor took control)
					track.addEventListener('pointerdown', function () {
						S.stop(state);
					});
					document.addEventListener('visibilitychange', function () {
						hold('hidden', document.hidden);
					});
					// a video playing in a slide (varz-video.js): no moving on meanwhile
					el.addEventListener('varz-video-play', function () {
						hold('video', true);
					});
					el.addEventListener('varz-video-stop', function () {
						hold('video', false);
					});
				}

				S.measure(state);
				if ('ResizeObserver' in window) {
					new ResizeObserver(function () {
						S.measure(state);
					}).observe(track);
				}
				if (state.delay && !U.reducedMotion()) {
					S.start(state);
				} else {
					S.renderPlay(state);
				}
			},

			/**
			 * Mouse drag (touch scrolls natively): the track follows the pointer with snapping off, then
			 * settles on the next / previous position in the drag direction. A drag is not a click on a link.
			 */
			drag: function (state) {
				var S = varz.slider;
				var U = varz.util;
				var track = state.track;
				var drag = null;
				var dragged = false;
				track.addEventListener('pointerdown', function (e) {
					if (e.pointerType !== 'mouse' || e.button !== 0) {
						return;
					}
					drag = { x: e.clientX, left: track.scrollLeft, index: state.index, moved: false, id: e.pointerId };
				});
				track.addEventListener('pointermove', function (e) {
					if (!drag) {
						return;
					}
					var dx = e.clientX - drag.x;
					if (!drag.moved && Math.abs(dx) > 5) {
						drag.moved = true;
						drag.snap = track.style.scrollSnapType;
						track.style.scrollSnapType = 'none';
						track.setPointerCapture(drag.id);
						state.el.setAttribute('data-varz-dragging', '');
					}
					if (drag.moved) {
						e.preventDefault();
						track.scrollLeft = drag.left - dx;
					}
				});
				var end = function (e) {
					if (!drag) {
						return;
					}
					var d = drag;
					drag = null;
					if (!d.moved) {
						return;
					}
					dragged = true;
					setTimeout(function () {
						dragged = false;
					}, 0);
					state.el.removeAttribute('data-varz-dragging');
					var dx = e.clientX - d.x;
					// at least 40px: one position in that direction, else back to the nearest
					S.update(state);
					var target = Math.abs(dx) < 40 ? state.index : d.index + (dx < 0 ? 1 : -1);
					target = Math.max(0, Math.min(state.positions.length - 1, target));
					track.scrollTo({ left: state.positions[target], behavior: U.reducedMotion() ? 'auto' : 'smooth' });
					// snapping back on once the scroll has settled - turning it on mid-scroll jumps
					setTimeout(
						function () {
							track.style.scrollSnapType = d.snap;
						},
						U.reducedMotion() ? 0 : 450
					);
				};
				track.addEventListener('pointerup', end);
				track.addEventListener('pointercancel', end);
				track.addEventListener(
					'click',
					function (e) {
						if (dragged) {
							e.preventDefault();
							e.stopPropagation();
						}
					},
					true
				);
				// no native "drag the image / link" ghost
				track.addEventListener('dragstart', function (e) {
					e.preventDefault();
				});
			},

			/** slides, reachable scroll positions (several slides in view: fewer positions than slides), dots */
			measure: function (state) {
				var S = varz.slider;
				var track = state.track;
				var slides = Array.prototype.slice.call(track.children);
				var max = track.scrollWidth - track.clientWidth;
				var first = slides.length ? slides[0].offsetLeft : 0;
				var positions = [];
				slides.forEach(function (slide, i) {
					var left = Math.min(Math.max(slide.offsetLeft - first, 0), max);
					if (!positions.length || left - positions[positions.length - 1] > 2) {
						positions.push(left);
					}
					slide.setAttribute('role', slide.getAttribute('role') || 'group');
					slide.setAttribute('aria-roledescription', S.i18n.slide);
					if (!slide.hasAttribute('aria-label') || slide.hasAttribute('data-varz-auto-label')) {
						slide.setAttribute('aria-label', varz.util.format(S.i18n.slideOf, i + 1, slides.length));
						slide.setAttribute('data-varz-auto-label', '');
					}
					if (state.observer && state.slides.indexOf(slide) < 0) {
						state.observer.observe(slide);
					}
				});
				state.slides = slides;
				state.positions = positions.length ? positions : [0];
				S.renderDots(state);
				S.update(state);
			},

			renderDots: function (state) {
				var S = varz.slider;
				var box = state.dots;
				if (!box) {
					return;
				}
				// the template stays in the markup (hidden), generated dots are replaced on every measure
				if (state.dotTemplate === undefined) {
					state.dotTemplate = box.querySelector('[data-varz-dot]');
					if (state.dotTemplate) {
						varz.util.show(state.dotTemplate, false);
					}
				}
				Array.prototype.slice.call(box.querySelectorAll('[data-varz-dot-item]')).forEach(function (dot) {
					dot.remove();
				});
				// one position - nothing to choose from
				if (state.positions.length < 2) {
					return;
				}
				state.positions.forEach(function (left, i) {
					var dot = state.dotTemplate ? state.dotTemplate.cloneNode(true) : document.createElement('button');
					dot.type = 'button';
					varz.util.show(dot, true);
					dot.removeAttribute('data-varz-dot');
					dot.setAttribute('data-varz-dot-item', '');
					dot.setAttribute('aria-label', varz.util.format(S.i18n.goTo, i + 1));
					varz.util.within(dot, '[data-varz-dot-number]').forEach(function (n) {
						n.textContent = i + 1;
					});
					dot.addEventListener('click', function () {
						S.go(state.el, i);
					});
					box.appendChild(dot);
				});
				S.update(state);
			},

			/** current position from the scroll offset; dots, arrows */
			update: function (state) {
				var left = state.track.scrollLeft;
				var index = 0;
				state.positions.forEach(function (p, i) {
					if (Math.abs(p - left) < Math.abs(state.positions[index] - left)) {
						index = i;
					}
				});
				var changed = index !== state.index;
				state.index = index;
				var last = state.positions.length - 1;
				if (state.dots) {
					Array.prototype.forEach.call(state.dots.querySelectorAll('[data-varz-dot-item]'), function (dot, i) {
						dot.classList.toggle(varz.className, i === index);
						if (i === index) {
							dot.setAttribute('aria-current', 'true');
						} else {
							dot.removeAttribute('aria-current');
						}
					});
				}
				if (state.prev) {
					state.prev.disabled = !state.loop && index === 0;
				}
				if (state.next) {
					state.next.disabled = !state.loop && index === last;
				}
				if (changed) {
					state.el.dispatchEvent(new CustomEvent('varz-slide', { detail: { index: index, count: state.positions.length } }));
				}
			},

			go: function (el, index) {
				var state = el.varzSlider;
				if (!state) {
					return;
				}
				var count = state.positions.length;
				index = state.loop ? (index + count) % count : Math.max(0, Math.min(count - 1, index));
				var still = varz.util.reducedMotion();
				if (still && index !== state.index && state.track.animate) {
					// prefers-reduced-motion: no sliding - a short fade marks the change
					state.track.animate([{ opacity: 0.25 }, { opacity: 1 }], { duration: 220, easing: 'ease-out' });
				}
				state.track.scrollTo({ left: state.positions[index], behavior: still ? 'auto' : 'smooth' });
			},

			next: function (el) {
				varz.slider.go(el, el.varzSlider.index + 1);
			},

			prev: function (el) {
				varz.slider.go(el, el.varzSlider.index - 1);
			},

			/* ---------- autoplay ---------- */

			start: function (state) {
				state.playing = true;
				varz.slider.schedule(state);
				varz.slider.renderPlay(state);
			},

			stop: function (state) {
				state.playing = false;
				varz.slider.schedule(state);
				varz.slider.renderPlay(state);
			},

			/** runs while playing and nothing holds it (hover, focus, hidden tab, a playing video) */
			schedule: function (state) {
				clearInterval(state.timer);
				state.timer = 0;
				if (state.playing && !Object.keys(state.holds).length) {
					state.timer = setInterval(function () {
						var last = state.index >= state.positions.length - 1;
						varz.slider.go(state.el, last ? 0 : state.index + 1);
					}, state.delay);
				}
			},

			renderPlay: function (state) {
				var S = varz.slider;
				if (!state.play) {
					return;
				}
				varz.util.show(state.play, !!state.delay);
				state.play.classList.toggle(varz.className, state.playing);
				state.play.setAttribute('aria-label', state.playing ? S.i18n.pause : S.i18n.play);
				state.track.setAttribute('aria-live', state.playing ? 'off' : 'polite');
			},
		};

varz.util.ready(function () {
	varz.slider.init();
	varz.util.onAdded(function () {
		varz.slider.init();
	});
});
