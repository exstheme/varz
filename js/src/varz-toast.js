/*! VARZ toast | MIT | https://varz.dev */
'use strict';
/**
 * VARZ toast - short notifications ("Saved", "Added to cart", "Could not connect") that stack in a corner and
 * go away by themselves. Needs varz.js (varz.util).
 *
 * From code:
 *   varz.toast('Saved');
 *   varz.toast('Could not save', { type: 'error' });                    // success | error | warning | info
 *   var t = varz.toast('Item deleted', { action: 'Undo', onAction: restore, duration: 8000 });
 *   t.close();
 * From markup - a button, no code:
 *   <button type="button" data-vz-toast="Link copied" data-vz-toast-type="success">Copy link</button>
 *
 * Options: type, duration (ms, default 4000; 0 = until closed), action (button text) + onAction(toast),
 *   closable (default true). Several toasts stack, the newest at the bottom; at most varz.toast.max (4) at once.
 *
 * Accessible: screen readers announce them (a polite status region; errors are announced at once - role alert),
 * the timer pauses while the pointer is over a toast or focus is in it, Esc closes the newest one when focus
 * is in the region. prefers-reduced-motion: no sliding.
 *
 * Looks: VARZ inline variables in varz.toast.styles; the colors come from tokens with fallbacks, so a theme
 * (varz-tokens.css, a theme file) restyles them: --vz-toast-bgc, --vz-toast-c, --vz-toast-br, --vz-toast-bsh,
 * and the types --vz-alert-{success|error|warning|info}-c / -bgc / -bc.
 * Position: varz.toast.position = 'bottom-right' (default) | 'bottom-left' | 'bottom-center' | 'top-right' |
 * 'top-left' | 'top-center' - before the first toast.
 *
 * Events on document: "varz-toast" { detail: { toast, message, type } } when one is shown.
 * Texts: varz.toast.i18n.
 */
var varz = varz ? varz : {};

(function () {
	if (varz.toast) {
		return;
	}

	var T = function (message, options) {
		return T.show(message, options);
	};

	T.i18n = {
		region: 'Notifications',
		close: 'Close',
	};

	T.position = 'bottom-right';
	T.max = 4;

	T.styles = {
		region: '--pos:fixed;--z:1000;--d:flex;--fld:column;--g:10px;--w:min(380px, calc(100vw - 32px));--pe:none;',
		positions: {
			'bottom-right': '--r:16px;--b:16px;',
			'bottom-left': '--l:16px;--b:16px;',
			'bottom-center': '--l:50%;--b:16px;--tf:translateX(-50%);',
			'top-right': '--r:16px;--t:16px;--fld:column-reverse;',
			'top-left': '--l:16px;--t:16px;--fld:column-reverse;',
			'top-center': '--l:50%;--t:16px;--tf:translateX(-50%);--fld:column-reverse;',
		},
		toast:
			'--pe:auto;--d:flex;--ai:flex-start;--g:12px;--p:14px 14px 14px 18px;--br:var(--vz-toast-br, 10px);' +
			'--bw:1px;--bs:solid;--bc:var(--vz-toast-bc, var(--vz-c-border, #ddd));--bgc:var(--vz-toast-bgc, var(--vz-c-light, #fff));' +
			'--c:var(--vz-toast-c, var(--vz-c-font, #333));--bsh:var(--vz-toast-bsh, 0 10px 30px -8px rgba(0,0,0,.3));' +
			'--fs:15px;--lh:1.45;--o:0;--tf:translateY(8px);--tr:opacity .2s,transform .2s;--vz-o:1;--vz-tf:none;',
		// type: a colored edge and colors from the alert tokens
		types: {
			success: '--bc:var(--vz-alert-success-bc, #9bd3ae);--bgc:var(--vz-alert-success-bgc, #ecf8f0);--c:var(--vz-alert-success-c, #1d5c33);',
			error: '--bc:var(--vz-alert-error-bc, var(--vz-alert-danger-bc, #efa79c));--bgc:var(--vz-alert-error-bgc, var(--vz-alert-danger-bgc, #fdecea));--c:var(--vz-alert-error-c, var(--vz-alert-danger-c, #8a1f12));',
			warning: '--bc:var(--vz-alert-warning-bc, #f0c869);--bgc:var(--vz-alert-warning-bgc, #fdf5df);--c:var(--vz-alert-warning-c, #6e4806);',
			info: '--bc:var(--vz-alert-info-bc, #9cc3e4);--bgc:var(--vz-alert-info-bgc, #eaf3fb);--c:var(--vz-alert-info-c, #1c4566);',
		},
		message: '--fl:1;--miw:0;--pbs:2px;',
		action:
			'--fls:0;--p:4px 10px;--br:6px;--bw:1px;--bs:solid;--bc:currentColor;--bgc:transparent;--c:inherit;--fw:600;--fs:14px;--cur:pointer;--hov-o:.8;',
		close:
			'--fls:0;--d:inline-flex;--ai:center;--jc:center;--w:28px;--h:28px;--p:0;--mbs:-2px;--br:50%;--bw:0;--bgc:transparent;--c:inherit;--o:.7;--cur:pointer;--hov-o:1;',
	};

	T.icon = '<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24"><path d="M18.3 5.7 16.9 4.3 12 9.2 7.1 4.3 5.7 5.7 10.6 12l-4.9 4.9 1.4 1.4 4.9-4.9 4.9 4.9 1.4-1.4-4.9-4.9z"/></svg>';

	/** the two live regions (polite for everything, assertive for errors), made on first use */
	T.region = function () {
		if (T.box && T.box.isConnected) {
			return T.box;
		}
		var box = document.createElement('section');
		box.className = 'varz-toasts';
		box.setAttribute('aria-label', T.i18n.region);
		box.setAttribute('style', varz.vars(T.styles.region + (T.styles.positions[T.position] || T.styles.positions['bottom-right'])));
		box.addEventListener('keydown', function (e) {
			if (e.key === 'Escape' && T.open.length) {
				T.open[T.open.length - 1].close();
			}
		});
		document.body.appendChild(box);
		T.box = box;
		return box;
	};

	T.open = [];

	T.show = function (message, options) {
		var o = options || {};
		var type = T.styles.types[o.type] ? o.type : '';
		var duration = o.duration === undefined ? 4000 : o.duration;
		var box = T.region();

		var el = document.createElement('div');
		// errors are announced at once, the rest when the reader is idle
		el.setAttribute('role', type === 'error' ? 'alert' : 'status');
		el.setAttribute('style', varz.vars(T.styles.toast + (type ? T.styles.types[type] : '')));
		var text = document.createElement('div');
		text.setAttribute('style', varz.vars(T.styles.message));
		text.textContent = message;
		el.appendChild(text);

		var toast = {
			el: el,
			message: message,
			type: type,
			timer: null,
			left: duration,
			start: 0,
			close: function () {
				if (!el.isConnected || toast.closing) {
					return;
				}
				toast.closing = true;
				clearTimeout(toast.timer);
				T.open.splice(T.open.indexOf(toast), 1);
				el.classList.remove(varz.className || 'vz');
				var gone = function () {
					el.remove();
				};
				if (varz.util && varz.util.reducedMotion()) {
					gone();
				} else {
					setTimeout(gone, 220);
				}
			},
		};

		if (o.action) {
			var action = document.createElement('button');
			action.type = 'button';
			action.textContent = o.action;
			action.setAttribute('style', varz.vars(T.styles.action));
			action.addEventListener('click', function () {
				if (typeof o.onAction === 'function') {
					o.onAction(toast);
				}
				toast.close();
			});
			el.appendChild(action);
		}
		if (o.closable !== false) {
			var close = document.createElement('button');
			close.type = 'button';
			close.setAttribute('aria-label', T.i18n.close);
			close.setAttribute('style', varz.vars(T.styles.close));
			close.innerHTML = T.icon;
			close.addEventListener('click', toast.close);
			el.appendChild(close);
		}

		// the timer pauses while the pointer is over it or focus is in it
		var run = function () {
			if (!duration || toast.left <= 0) {
				return;
			}
			toast.start = Date.now();
			toast.timer = setTimeout(toast.close, toast.left);
		};
		var pause = function () {
			if (toast.timer) {
				clearTimeout(toast.timer);
				toast.timer = null;
				toast.left -= Date.now() - toast.start;
			}
		};
		el.addEventListener('mouseenter', pause);
		el.addEventListener('mouseleave', function () {
			if (!el.contains(document.activeElement)) {
				run();
			}
		});
		el.addEventListener('focusin', pause);
		el.addEventListener('focusout', function (e) {
			if (!el.contains(e.relatedTarget) && !el.matches(':hover')) {
				run();
			}
		});

		box.appendChild(el);
		T.open.push(toast);
		while (T.open.length > T.max) {
			T.open[0].close();
		}
		// next frame: .vz slides it in
		window.requestAnimationFrame(function () {
			window.requestAnimationFrame(function () {
				el.classList.add(varz.className || 'vz');
			});
		});
		run();
		document.dispatchEvent(new CustomEvent('varz-toast', { detail: { toast: toast, message: message, type: type } }));
		return toast;
	};

	/** closes all of them */
	T.clear = function () {
		T.open.slice().forEach(function (toast) {
			toast.close();
		});
	};

	// markup: <button data-vz-toast="Message" data-vz-toast-type="success">
	document.addEventListener('click', function (e) {
		var trigger = e.target.closest && e.target.closest('[data-vz-toast]');
		if (!trigger) {
			return;
		}
		var duration = trigger.getAttribute('data-vz-toast-duration');
		T.show(trigger.getAttribute('data-vz-toast'), {
			type: trigger.getAttribute('data-vz-toast-type') || '',
			duration: duration === null ? undefined : parseFloat(duration),
		});
	});

	varz.toast = T;
})();
