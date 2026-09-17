// owl-mascot.js
// A self-contained animated owl. It rests at the top-left or bottom-right
// corner of its container (switching between them from time to time),
// flying in from the nearest page corner rather than popping in from a
// fixed offset. On playSendAnimation(), it flies to a target element
// (e.g. the send button), "grabs" an envelope, flies off-page, then flies
// back to a corner — all distances computed from the actual on-screen
// positions at animation-time, not hardcoded, so it stays correct
// regardless of how tall the surrounding page ends up being.
//
// Tapping/clicking the owl gives it a little startled wing-flap. Four
// taps within 1.5s make it relocate to a (possibly new) corner.
//
// Usage:
//   <owl-mascot></owl-mascot>   (its offsetParent needs position:relative)
//   const owl = document.querySelector('owl-mascot');
//   owl.target = sendButtonEl;  // where it flies to on send
//   owl.playSendAnimation();    // returns a Promise, resolves once it's home again

const OWL_SVG = `
  <svg class="owl-svg" viewBox="0 0 160 150" aria-hidden="true">
    <!-- wings: a small tucked wing (visible while resting/idle) and a
         big feathered spread wing (visible only while actively flying) —
         see owl-mascot.css for the crossfade between them. -->
    <g class="owl-wing owl-wing-left">
      <g class="wing-big wing-big-left">
        <path d="M56 68 C44 59 29 51 17 44 C10 40 5 39 2 40 C3 49 9 57 18 63 C9 59 3 58 0 60 C3 70 13 77 25 80 C14 77 7 78 3 81 C9 92 23 97 36 96 C26 95 19 99 18 103 C27 112 42 112 55 105 C51 97 49 87 52 78 Z"
              fill="var(--owl-wing)"/>
        <path d="M49 70 C36 59 20 50 6 44 C12 56 25 67 42 76 Z" fill="var(--owl-crown)"/>
        <path d="M48 78 C31 69 15 64 3 62 C11 73 27 81 44 84 Z" fill="var(--owl-crown)"/>
        <path d="M48 86 C31 81 17 80 6 82 C15 91 30 94 45 92 Z" fill="var(--owl-crown)"/>
        <path d="M42 69 C30 62 19 55 10 50 M43 77 C30 72 18 68 8 67 M44 85 C31 83 20 83 11 86 M45 94 C34 94 25 97 20 100"
              fill="none" stroke="var(--owl-crown-dark)" stroke-width="2.2" stroke-linecap="round" opacity=".85"/>
        <path d="M50 81 C41 86 38 92 41 99 M44 87 C36 92 35 99 39 104 M36 91 C29 96 30 102 34 106 M28 93 C22 98 23 103 28 107"
              fill="none" stroke="var(--owl-crown-dark)" stroke-width="2" stroke-linecap="round" opacity=".75"/>
      </g>
      <g class="wing-simple wing-simple-left">
        <path d="M47 66 C26 68 25 93 42 109 C50 102 55 88 55 72 Z" fill="var(--owl-wing)"/>
        <path d="M42 83 C35 89 34 98 39 103 M48 78 C41 87 41 97 45 104"
              fill="none" stroke="var(--owl-crown-dark)" stroke-width="2.2"
              stroke-linecap="round" opacity=".8"/>
      </g>
    </g>
    <g class="owl-wing owl-wing-right">
      <g class="wing-big wing-big-right">
        <path d="M104 68 C116 59 131 51 143 44 C150 40 155 39 158 40 C157 49 151 57 142 63 C151 59 157 58 160 60 C157 70 147 77 135 80 C146 77 153 78 157 81 C151 92 137 97 124 96 C134 95 141 99 142 103 C133 112 118 112 105 105 C109 97 111 87 108 78 Z"
              fill="var(--owl-wing)"/>
        <path d="M111 70 C124 59 140 50 154 44 C148 56 135 67 118 76 Z" fill="var(--owl-crown)"/>
        <path d="M112 78 C129 69 145 64 157 62 C149 73 133 81 116 84 Z" fill="var(--owl-crown)"/>
        <path d="M112 86 C129 81 143 80 154 82 C145 91 130 94 115 92 Z" fill="var(--owl-crown)"/>
        <path d="M118 69 C130 62 141 55 150 50 M117 77 C130 72 142 68 152 67 M116 85 C129 83 140 83 149 86 M115 94 C126 94 135 97 140 100"
              fill="none" stroke="var(--owl-crown-dark)" stroke-width="2.2" stroke-linecap="round" opacity=".85"/>
        <path d="M110 81 C119 86 122 92 119 99 M116 87 C124 92 125 99 121 104 M124 91 C131 96 130 102 126 106 M132 93 C138 98 137 103 132 107"
              fill="none" stroke="var(--owl-crown-dark)" stroke-width="2" stroke-linecap="round" opacity=".75"/>
      </g>
      <g class="wing-simple wing-simple-right">
        <path d="M113 66 C134 68 135 93 118 109 C110 102 105 88 105 72 Z" fill="var(--owl-wing)"/>
        <path d="M118 83 C125 89 126 98 121 103 M112 78 C119 87 119 97 115 104"
              fill="none" stroke="var(--owl-crown-dark)" stroke-width="2.2"
              stroke-linecap="round" opacity=".8"/>
      </g>
    </g>

    <ellipse cx="80" cy="88" rx="36" ry="43" fill="var(--owl-body)"/>
    <ellipse cx="80" cy="96" rx="23" ry="31" fill="var(--owl-belly)"/>

    <g fill="var(--owl-mark)">
      <path d="M 65 86 C 66.2 87.2 66.2 90 65 91.5 C 63.8 90 63.8 87.2 65 86 Z"/>
      <path d="M 72 85 C 73.2 86.2 73.2 89 72 90.5 C 70.8 89 70.8 86.2 72 85 Z"/>
      <path d="M 80 84 C 81.2 85.2 81.2 88 80 89.5 C 78.8 88 78.8 85.2 80 84 Z"/>
      <path d="M 88 85 C 89.2 86.2 89.2 89 88 90.5 C 86.8 89 86.8 86.2 88 85 Z"/>
      <path d="M 95 86 C 96.2 87.2 96.2 90 95 91.5 C 93.8 90 93.8 87.2 95 86 Z"/>
    </g>

    <g class="owl-envelope">
      <rect x="67" y="122" width="26" height="18" rx="1.5" fill="var(--owl-parchment)" stroke="var(--owl-ink)" stroke-width="1.2"/>
      <path d="M67 122 L80 131 L93 122" fill="none" stroke="var(--owl-ink)" stroke-width="1.2"/>
      <circle cx="80" cy="127" r="2.4" fill="var(--owl-seal)"/>
    </g>

    <g stroke="var(--owl-feet)" stroke-width="4" stroke-linecap="round" fill="none">
      <path d="M67 119 l-5 8 M67 119 l0 9 M67 119 l5 7"/>
      <path d="M93 119 l-5 7 M93 119 l0 9 M93 119 l5 8"/>
    </g>

    <g class="owl-head">
      <path d="M51 34 C46 32 43 27 43 23 C48 25 53 27 56 31 Z" fill="var(--owl-crown)"/>
      <path d="M109 34 C114 32 117 27 117 23 C112 25 107 27 104 31 Z" fill="var(--owl-crown)"/>
      <path d="M53 44 C48 41 44 35 44 30 C50 32 56 35 60 40 Z" fill="var(--owl-crown)"/>
      <path d="M107 44 C112 41 116 35 116 30 C110 32 104 35 100 40 Z" fill="var(--owl-crown)"/>

      <path d="M80 24
               C58 22 44 34 42 54
               C42 67 48 73 57 76
               C66 79 73 78 80 78
               C87 78 94 79 103 76
               C112 73 118 67 118 54
               C116 34 102 22 80 24 Z" fill="var(--owl-crown)"/>

      <ellipse cx="62" cy="55" rx="22" ry="25" fill="var(--owl-face)"/>
      <ellipse cx="98" cy="55" rx="22" ry="25" fill="var(--owl-face)"/>

      <g>
        <circle cx="62" cy="54" r="13.5" fill="var(--owl-eye)"/>
        <circle cx="62" cy="54" r="7" fill="var(--owl-pupil)"/>
        <circle cx="59.5" cy="51.5" r="2.1" fill="#fff"/>
        <circle cx="64.8" cy="57.8" r="1" fill="#fff" opacity=".65"/>
      </g>
      <g>
        <circle cx="98" cy="54" r="13.5" fill="var(--owl-eye)"/>
        <circle cx="98" cy="54" r="7" fill="var(--owl-pupil)"/>
        <circle cx="95.5" cy="51.5" r="2.1" fill="#fff"/>
        <circle cx="100.8" cy="57.8" r="1" fill="#fff" opacity=".65"/>
      </g>

      <path d="M80 54 L72.5 65 L80 70 L87.5 65 Z" fill="var(--owl-beak)"/>
      <path d="M72.5 65 L80 70 L87.5 65 L80 66 Z" fill="var(--owl-beak-dark)"/>

      <ellipse class="owl-eyelid owl-eyelid-l" cx="62" cy="54" rx="14" ry="14" fill="var(--owl-face)"/>
      <ellipse class="owl-eyelid owl-eyelid-r" cx="98" cy="54" rx="14" ry="14" fill="var(--owl-face)"/>
    </g>
  </svg>
`;

const RAPID_TAP_THRESHOLD = 4;
const RAPID_TAP_WINDOW_MS = 1500;

export class OwlMascot extends HTMLElement {
  connectedCallback() {
    this.innerHTML = OWL_SVG;
    this._envelope = this.querySelector('.owl-envelope');
    this._resetTimer = null;
    this._phaseTimer = null;
    this._tapFlapTimer = null;
    this._currentCorner = null;
    this._tapTimestamps = [];

    this.addEventListener('click', () => this._handleTap());

    this._positionAtCorner();
    // rAF so the corner placement above has settled before measuring for
    // the fly-in distance.
    requestAnimationFrame(() => this._flyInFromCorner());
  }

  disconnectedCallback() {
    if (this._resetTimer) clearTimeout(this._resetTimer);
    if (this._phaseTimer) clearTimeout(this._phaseTimer);
    if (this._tapFlapTimer) clearTimeout(this._tapFlapTimer);
  }

  /** Element to fly to and "fetch the letter" from when sending. */
  set target(el) {
    this._target = el;
  }

  // Rests at the top-left or bottom-right corner of its offsetParent (e.g.
  // .contact-card), straddling the edge rather than sitting on top of
  // inner content. Picks a corner at random, with a nudge toward actually
  // switching (not just re-rolling the same one) so it visibly moves
  // around "from time to time" rather than every single time or never.
  //
  // >>> To change WHERE the owl can sit, or how likely it is to switch,
  // >>> edit this method — the two corner names below, and the 0.6
  // >>> probability that forces a switch when the random pick repeats.
  _positionAtCorner() {
    const parent = this.offsetParent;
    if (!parent) return;

    let corner = Math.random() < 0.5 ? 'top-left' : 'bottom-right';
    if (this._currentCorner && corner === this._currentCorner && Math.random() < 0.6) {
      corner = corner === 'top-left' ? 'bottom-right' : 'top-left';
    }
    this._currentCorner = corner;

    const inset = -18; // negative: perches on the card's edge, not over the content inside it
    this.style.position = 'absolute';
    if (corner === 'top-left') {
      this.style.top = `${inset}px`;
      this.style.left = `${inset}px`;
      this.style.right = 'auto';
      this.style.bottom = 'auto';
    } else {
      this.style.bottom = `${inset}px`;
      this.style.right = `${inset}px`;
      this.style.top = 'auto';
      this.style.left = 'auto';
    }
  }

  // Flies in (or back) from whichever page corner is nearest its resting
  // spot — "from a corner of the page," not a fixed nearby offset.
  _flyInFromCorner() {
    const rect = this.getBoundingClientRect();
    const nearRight = (rect.left + rect.width / 2) > window.innerWidth / 2;
    const cornerX = nearRight ? window.innerWidth + rect.width : -rect.width;
    const cornerY = -rect.height * 2;

    const dx = cornerX - (rect.left + rect.width / 2);
    const dy = cornerY - (rect.top + rect.height / 2);

    this.style.setProperty('--fly-dx', `${dx}px`);
    this.style.setProperty('--fly-dy', `${dy}px`);

    this.classList.remove('arriving');
    void this.offsetWidth; // restart the animation even if already played once
    this.classList.add('arriving');
  }

  // A quick startled wing-flap in place — doesn't move or reposition it.
  _playTapFlap() {
    this.classList.remove('tap-flap');
    void this.offsetWidth;
    this.classList.add('tap-flap');
    if (this._tapFlapTimer) clearTimeout(this._tapFlapTimer);
    this._tapFlapTimer = setTimeout(() => this.classList.remove('tap-flap'), 520);
  }

  _handleTap() {
    if (this.classList.contains('busy')) return;

    this._playTapFlap();

    const now = Date.now();
    this._tapTimestamps.push(now);
    this._tapTimestamps = this._tapTimestamps.filter((t) => now - t < RAPID_TAP_WINDOW_MS);

    if (this._tapTimestamps.length >= RAPID_TAP_THRESHOLD) {
      this._tapTimestamps = [];
      this.classList.remove('tap-flap');
      this._positionAtCorner(); // may pick a new corner
      this._flyInFromCorner();  // relocate with the same corner-arrival flourish
    }
  }

  playSendAnimation() {
    return new Promise((resolve) => {
      if (!this._envelope || this.classList.contains('busy')) {
        resolve();
        return;
      }
      this.classList.add('busy');
      this.classList.remove('arriving', 'tap-flap');

      const flyToTarget = () => {
        if (this._target) {
          const ownRect = this.getBoundingClientRect();
          const targetRect = this._target.getBoundingClientRect();
          const dx = (targetRect.left + targetRect.width / 2) - (ownRect.left + ownRect.width / 2);
          const dy = targetRect.top - (ownRect.top + ownRect.height / 2) - 8;
          this.style.setProperty('--to-target-dx', `${dx}px`);
          this.style.setProperty('--to-target-dy', `${dy}px`);
        } else {
          this.style.setProperty('--to-target-dx', '0px');
          this.style.setProperty('--to-target-dy', '0px');
        }
        this.classList.add('flying-to-target');
        this._phaseTimer = setTimeout(grabEnvelope, 700);
      };

      const grabEnvelope = () => {
        this._envelope.classList.add('grabbing');
        this._phaseTimer = setTimeout(flyAway, 500);
      };

      const flyAway = () => {
        const rect = this.getBoundingClientRect();
        const goRight = (rect.left + rect.width / 2) < window.innerWidth / 2 ? -1 : 1;
        this.style.setProperty('--away-dx', `${goRight * 420}px`);
        this.style.setProperty('--away-dy', '-280px');
        this.classList.remove('flying-to-target');
        this.classList.add('flying-away');
        this._phaseTimer = setTimeout(finishAndReturn, 1300);
      };

      const finishAndReturn = () => {
        this.classList.remove('flying-away', 'busy');
        this._envelope.classList.remove('grabbing');
        this._positionAtCorner();  // may switch corners here
        this._flyInFromCorner();   // same corner-arrival flourish, flying home
        this._resetTimer = setTimeout(resolve, 1100);
      };

      flyToTarget();
    });
  }
}

customElements.define('owl-mascot', OwlMascot);