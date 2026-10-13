/*! VARZ lightbox | MIT | https://varz.dev */
'use strict';
/**
 * VARZ lightbox - image and video viewer on the native <dialog> element. Needs varz.js (varz.util, varz.media).
 *
 * Links to the full size images are the triggers - without JavaScript they simply open the image:
 *
 * <a href="large-1.jpg" data-varz-lightbox="trip" [data-vz-caption="Text"] [data-vz-srcset="large-1.jpg 1600w, huge-1.jpg 3200w"]>
 *     <img src="thumb-1.jpg" alt="...">
 * </a>
 * <a href="large-2.jpg" data-varz-lightbox="trip"><img src="thumb-2.jpg" alt="..."></a>
 *
 * Videos too: a link to a YouTube / Vimeo page or a video file (.mp4, .webm ...) plays in the viewer - the
 * player loads when the video is shown and stops when the viewer moves on or closes (varz.media).
 *
 * Links with the same data-varz-lightbox value form a gallery (prev / next, "2 / 6"); an empty value
 * is a single item. Caption: data-vz-caption, else the image alt text. data-vz-srcset: sizes of the full
 * image for the viewer (the browser picks one for the screen).
 *
 * The viewer is one <dialog> made on first use: modal (focus stays inside, Esc closes, focus returns
 * to the link), arrows / ← → keys, swipe and mouse drag (the image follows the pointer), a click outside
 * the image closes, neighbours preloaded, items slide in (prefers-reduced-motion: fade only), page scroll
 * locked while open. It gets .vz while open ("varz-activated" / "varz-deactivated"); styles are VARZ inline
 * variables - change them with varz.lightbox.styles before the first use.
 *
 * API: varz.lightbox.open( link ), varz.lightbox.close(), varz.lightbox.show( index )
 * Texts: varz.lightbox.i18n.
 */
var varz = varz ? varz : {};

varz.lightbox = varz.lightbox
	? varz.lightbox
	: {
			i18n: {
				dialog: 'Media viewer',
				close: 'Close',
				prev: 'Previous',
				next: 'Next',
				/* %1$s current, %2$s total */
				counter: '%1$s / %2$s',
			},
			styles: {
				dialog: '--pos:fixed;--t:0;--l:0;--w:100vw;--h:100vh;--maw:100vw;--mah:100vh;--m:0;--p:0;--bw:0;--bgc:rgba(10,12,16,.94);--c:#fff;--o:0;--vz-o:1;--tr:opacity .2s;',
				// pan-y: vertical touch scrolling stays native, horizontal moves come to the swipe
				stage: '--d:flex;--fld:column;--ai:center;--jc:center;--g:12px;--w:100%;--h:100%;--p:56px 64px 24px;--p-s:56px 8px 16px;--tca:pan-y;',
				image: '--d:block;--maw:100%;--mah:calc(100vh - 140px);--w:auto;--h:auto;--obf:contain;--br:4px;--bsh:0 20px 60px rgba(0,0,0,.5);--us:none;',
				// video box: 16:9 as large as fits (a video file keeps its own ratio inside)
				video: '--w:min(100%, calc((100vh - 140px) * 16 / 9));--ar:16/9;--br:4px;--of:hidden;--bgc:#000;--bsh:0 20px 60px rgba(0,0,0,.5);',
				caption: '--maw:800px;--ta:center;--fs:15px;--lh:1.5;--o:.85;',
				counter: '--pos:absolute;--t:16px;--l:20px;--fs:14px;--o:.75;',
				button: '--pos:absolute;--d:inline-flex;--ai:center;--jc:center;--w:44px;--h:44px;--p:0;--bw:0;--br:50%;--bgc:rgba(255,255,255,.12);--c:#fff;--fs:26px;--lh:1;--cur:pointer;--hov-bgc:rgba(255,255,255,.25);--foc-ol:2px solid #fff;',
				close: '--t:10px;--r:12px;',
				prev: '--l:12px;--t:50%;--tf:translateY(-50%);',
				next: '--r:12px;--t:50%;--tf:translateY(-50%);',
			},

			dialog: null,
			items: [],
			index: 0,
			opener: null,

			/** one click listener for the whole document (links added later work too) */
			init: function () {
				if (varz.lightbox.inited) {
					return;
				}
				varz.lightbox.inited = true;
				document.addEventListener('click', function (e) {
					var link = e.target.closest && e.target.closest('a[data-varz-lightbox]');
					if (!link || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
						return;
					}
					e.preventDefault();
					varz.lightbox.open(link);
				});
			},

			/** the viewer, made once */
			build: function () {
				var L = varz.lightbox;
				var st = L.styles;
				var icon = function (path) {
					return '<svg aria-hidden="true" width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="' + path + '"/></svg>';
				};
				var d = document.createElement('dialog');
				d.className = 'varz-lightbox';
				d.setAttribute('aria-label', L.i18n.dialog);
				d.setAttribute('style', st.dialog);
				d.innerHTML =
					'<div data-varz-lightbox-stage style="' + st.stage + '">' +
					'<img alt="" style="' + st.image + '">' +
					'<div data-varz-lightbox-video style="' + st.video + '"></div>' +
					'<p data-varz-lightbox-caption style="' + st.caption + '"></p>' +
					'</div>' +
					'<p data-varz-lightbox-counter aria-live="polite" style="' + st.counter + '"></p>' +
					'<button type="button" data-varz-lightbox-prev style="' + st.button + st.prev + '">' + icon('M15.4 7.4 14 6l-6 6 6 6 1.4-1.4-4.6-4.6z') + '</button>' +
					'<button type="button" data-varz-lightbox-next style="' + st.button + st.next + '">' + icon('M8.6 7.4 10 6l6 6-6 6-1.4-1.4 4.6-4.6z') + '</button>' +
					'<button type="button" data-varz-lightbox-close style="' + st.button + st.close + '">' +
					icon('M19 6.4 17.6 5 12 10.6 6.4 5 5 6.4l5.6 5.6L5 17.6 6.4 19l5.6-5.6 5.6 5.6 1.4-1.4-5.6-5.6z') +
					'</button>';
				document.body.appendChild(d);

				var $ = function (sel) {
					return d.querySelector(sel);
				};
				L.parts = {
					stage: $('[data-varz-lightbox-stage]'),
					img: $('img'),
					video: $('[data-varz-lightbox-video]'),
					caption: $('[data-varz-lightbox-caption]'),
					counter: $('[data-varz-lightbox-counter]'),
					prev: $('[data-varz-lightbox-prev]'),
					next: $('[data-varz-lightbox-next]'),
					close: $('[data-varz-lightbox-close]'),
				};
				L.parts.prev.setAttribute('aria-label', L.i18n.prev);
				L.parts.next.setAttribute('aria-label', L.i18n.next);
				L.parts.close.setAttribute('aria-label', L.i18n.close);
				L.parts.prev.addEventListener('click', function () {
					L.show(L.index - 1);
				});
				L.parts.next.addEventListener('click', function () {
					L.show(L.index + 1);
				});
				L.parts.close.addEventListener('click', function () {
					L.close();
				});
				// a click on the dark area (not the image, caption or buttons) closes
				d.addEventListener('click', function (e) {
					if (e.target === d || e.target === L.parts.stage) {
						L.close();
					}
				});
				d.addEventListener('keydown', function (e) {
					if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
						e.preventDefault();
						L.show(L.index + (e.key === 'ArrowRight' ? 1 : -1));
					}
				});
				// Esc: native "cancel" - closed through close() for the same cleanup
				d.addEventListener('cancel', function (e) {
					e.preventDefault();
					L.close();
				});
				L.swipe(d);
				d.addEventListener('dragstart', function (e) {
					e.preventDefault();
				});
				L.dialog = d;
				return d;
			},

			/**
			 * Swipe / mouse drag: the shown item follows the pointer; 50px or more - the next / previous item
			 * slides in from that side, less - it springs back. A drag is not a click (no closing).
			 */
			swipe: function (d) {
				var L = varz.lightbox;
				var drag = null;
				var swiped = false;
				var shown = function () {
					return L.parts.video.hidden ? L.parts.img : L.parts.video;
				};
				d.addEventListener('pointerdown', function (e) {
					drag = e.button === 0 && L.items.length > 1 && !e.target.closest('button') ? { x: e.clientX, dx: 0, id: e.pointerId } : null;
				});
				d.addEventListener('pointermove', function (e) {
					if (!drag || e.pointerId !== drag.id) {
						return;
					}
					drag.dx = e.clientX - drag.x;
					if (Math.abs(drag.dx) > 5 && !varz.util.reducedMotion()) {
						shown().style.transform = 'translateX(' + drag.dx + 'px)';
						shown().style.opacity = String(1 - Math.min(Math.abs(drag.dx) / 600, 0.5));
					}
				});
				var end = function () {
					if (!drag) {
						return;
					}
					var dx = drag.dx;
					var el = shown();
					drag = null;
					el.style.transform = '';
					el.style.opacity = '';
					if (Math.abs(dx) > 50) {
						swiped = true;
						setTimeout(function () {
							swiped = false;
						}, 0);
						L.show(L.index + (dx < 0 ? 1 : -1));
					} else if (dx && el.animate && !varz.util.reducedMotion()) {
						el.animate([{ transform: 'translateX(' + dx + 'px)' }, { transform: 'none' }], { duration: 180, easing: 'ease-out' });
					}
				};
				d.addEventListener('pointerup', end);
				d.addEventListener('pointercancel', end);
				d.addEventListener(
					'click',
					function (e) {
						if (swiped) {
							e.stopImmediatePropagation();
						}
					},
					true
				);
			},

			open: function (link) {
				var L = varz.lightbox;
				var group = link.getAttribute('data-varz-lightbox');
				L.items = group
					? Array.prototype.filter.call(document.querySelectorAll('a[data-varz-lightbox]'), function (a) {
							return a.getAttribute('data-varz-lightbox') === group;
						})
					: [link];
				L.opener = link;
				var d = L.dialog || L.build();
				var single = L.items.length < 2;
				varz.util.show(L.parts.prev, !single);
				varz.util.show(L.parts.next, !single);
				varz.util.show(L.parts.counter, !single);
				L.show(L.items.indexOf(link));
				if (!d.open) {
					d.showModal();
					document.documentElement.style.overflow = 'hidden';
					// next frame: the opacity transition starts from the closed state
					requestAnimationFrame(function () {
						d.classList.add(varz.className);
						d.dispatchEvent(new Event('varz-activated'));
					});
				}
				L.parts.close.focus();
			},

			show: function (index) {
				var L = varz.lightbox;
				var U = varz.util;
				var count = L.items.length;
				if (!count) {
					return;
				}
				var step = L.dialog && L.dialog.open ? index - L.index : 0;
				L.index = (index + count) % count;
				var link = L.items[L.index];
				var thumb = link.querySelector('img');
				var caption = link.getAttribute('data-vz-caption') || (thumb ? thumb.getAttribute('alt') : '') || '';
				var media = varz.media.parse(link.getAttribute('href'));
				// a video: the player replaces the previous one (that one stops), the image is hidden
				L.parts.video.textContent = '';
				U.show(L.parts.video, !!media);
				U.show(L.parts.img, !media);
				if (media) {
					L.parts.img.removeAttribute('src');
					L.parts.img.removeAttribute('srcset');
					L.parts.video.appendChild(varz.media.player(media, caption, link));
				} else {
					var srcset = link.getAttribute('data-vz-srcset');
					if (srcset) {
						L.parts.img.srcset = srcset;
						L.parts.img.sizes = '100vw';
					} else {
						L.parts.img.removeAttribute('srcset');
					}
					L.parts.img.src = link.href;
				}
				var shown = media ? L.parts.video : L.parts.img;
				// slide in from the side it came from; prefers-reduced-motion: a fade only (no movement)
				if (step && shown.animate) {
					var still = U.reducedMotion();
					shown.animate(
						[
							{ opacity: 0, transform: still ? 'none' : 'translateX(' + (step > 0 ? 40 : -40) + 'px)' },
							{ opacity: 1, transform: 'none' },
						],
						{ duration: still ? 200 : 250, easing: 'ease-out' }
					);
				}
				L.parts.img.alt = thumb ? thumb.getAttribute('alt') || '' : '';
				L.parts.caption.textContent = caption;
				U.show(L.parts.caption, !!caption);
				L.parts.counter.textContent = U.format(L.i18n.counter, L.index + 1, count);
				// neighbours ready before they are shown (images only)
				[L.index + 1, L.index - 1].forEach(function (i) {
					var near = count > 1 ? L.items[(i + count) % count] : null;
					if (near && !varz.media.parse(near.getAttribute('href'))) {
						new Image().src = near.href;
					}
				});
			},

			close: function () {
				var L = varz.lightbox;
				var d = L.dialog;
				if (!d || !d.open) {
					return;
				}
				d.classList.remove(varz.className);
				d.dispatchEvent(new Event('varz-deactivated'));
				d.close();
				// stops a playing video
				L.parts.video.textContent = '';
				document.documentElement.style.overflow = '';
				if (L.opener && L.opener.focus) {
					L.opener.focus();
				}
			},
		};

varz.lightbox.init();
