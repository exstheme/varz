/*! VARZ video | MIT | https://varz.dev */
'use strict';
/**
 * VARZ video - a click-to-play facade: a poster link instead of the video player, the player loads only
 * when it is clicked (a YouTube / Vimeo embed loads about 0.5-1 MB of scripts before anyone presses play).
 * Needs varz.js (varz.util, varz.media).
 *
 * The link is the fallback - without JavaScript it opens the video page:
 *
 * <a href="https://www.youtube.com/watch?v=ID" data-varz-video style="--pos:relative;--d:block;--ar:16/9;">
 *     <img src="poster.jpg" alt="Video: How it works" style="--w:100%;--h:100%;--obf:cover;">
 *     <span aria-hidden="true">▶</span>   (any play icon - styled with VARZ variables)
 * </a>
 *
 * Supported: YouTube (watch, youtu.be, shorts, embed links; ?t= / ?start= start time - played from
 * youtube-nocookie.com), Vimeo (also unlisted links with a hash), video files (.mp4, .webm, .ogv, .mov).
 * On click the link is replaced by a box with the same style attribute holding the player, which gets the focus.
 * Player title: data-vz-title, else the image alt text, else the link text.
 * Video files: the link's image is the poster; data-vz-captions="captions.vtt" adds captions
 * (data-vz-captions-lang, data-vz-captions-label).
 *
 * Slides, tabs, accordions (anything varz.js or the slider deactivates): a playing video stops when its
 * container is deactivated (a file pauses, an embed returns to its poster). data-vz-autoplay on the link:
 * it starts muted when its container is activated - for the page itself, wrap the link in an element
 * with data-vz-event="inview" (varz.js): it plays in view, stops out of view. Not with
 * prefers-reduced-motion: then only a click plays. A slider holds its autoplay while one of its videos plays.
 *
 * Events (bubbling, from the player box): "varz-video-play", "varz-video-stop". Texts: varz.video.i18n.
 */
var varz = varz ? varz : {};

varz.video = varz.video
	? varz.video
	: {
			i18n: {
				/* %s: video title */
				player: 'Video: %s',
				untitled: 'Video player',
			},

			init: function () {
				var V = varz.video;
				var U = varz.util;
				if (V.inited) {
					return;
				}
				V.inited = true;
				document.addEventListener('click', function (e) {
					var link = e.target.closest && e.target.closest('a[data-varz-video]');
					if (!link || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
						return;
					}
					if (V.play(link, { focus: true })) {
						e.preventDefault();
					}
				});
				// .vz from varz.js / the slider (a slide, tab panel, accordion item, inview element):
				// deactivated - its videos stop; activated - its data-vz-autoplay videos start, muted.
				// Capture phase: these events do not bubble.
				document.addEventListener(
					'varz-deactivated',
					function (e) {
						U.within(e.target, '[data-varz-video-player]').forEach(V.stop);
					},
					true
				);
				document.addEventListener(
					'varz-activated',
					function (e) {
						// prefers-reduced-motion: nothing starts by itself (a click still plays)
						if (U.reducedMotion()) {
							return;
						}
						U.within(e.target, 'a[data-varz-video][data-vz-autoplay]').forEach(function (link) {
							V.play(link, { muted: true });
						});
						// an autoplay video file paused when its container left: on again where it stopped
						U.within(e.target, '[data-varz-video-player]').forEach(function (box) {
							var player = box.firstElementChild;
							if (box.vzLink && box.vzLink.hasAttribute('data-vz-autoplay') && player && player.tagName === 'VIDEO' && player.paused && !player.ended) {
								player.play().catch(function () {});
							}
						});
					},
					true
				);
			},

			/**
			 * Replaces the facade link with the player; false when the link is not a supported video.
			 * o.focus - move the focus to the player (a click), o.muted - autoplay without a click.
			 */
			play: function (link, o) {
				var V = varz.video;
				o = o || {};
				var media = varz.media.parse(link.getAttribute('href'));
				if (!media) {
					return false;
				}
				var img = link.querySelector('img');
				var name = link.getAttribute('data-vz-title') || (img && img.getAttribute('alt')) || link.textContent.trim();
				var box = document.createElement('div');
				box.className = link.className;
				box.setAttribute('style', link.getAttribute('style') || '');
				box.setAttribute('data-varz-video-player', '');
				box.vzLink = link;
				var player = varz.media.player(media, name ? varz.util.format(V.i18n.player, name) : V.i18n.untitled, link, o.muted);
				box.appendChild(player);
				var fire = function (type) {
					box.dispatchEvent(new Event(type, { bubbles: true }));
				};
				if (player.tagName === 'VIDEO') {
					// a file reports its own state: paused / ended releases the slider
					player.addEventListener('play', function () {
						fire('varz-video-play');
					});
					['pause', 'ended'].forEach(function (type) {
						player.addEventListener(type, function () {
							fire('varz-video-stop');
						});
					});
				}
				link.replaceWith(box);
				if (o.focus) {
					player.focus();
				}
				fire('varz-video-play');
				return true;
			},

			/** stops a player: a video file pauses where it is, an embed goes back to its facade link */
			stop: function (box) {
				var player = box.firstElementChild;
				if (player && player.tagName === 'VIDEO') {
					player.pause();
					return;
				}
				if (box.vzLink && box.parentNode) {
					box.replaceWith(box.vzLink);
					box.vzLink.dispatchEvent(new Event('varz-video-stop', { bubbles: true }));
				}
			},
		};

varz.video.init();
