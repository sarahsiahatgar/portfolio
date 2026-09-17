// oneko.js: https://github.com/adryd325/oneko.js

(function oneko() {
  const isReducedMotion =
    window.matchMedia(`(prefers-reduced-motion: reduce)`) === true ||
    window.matchMedia(`(prefers-reduced-motion: reduce)`).matches === true;

  if (isReducedMotion) return;

  const nekoEl = document.createElement("div");
  let persistPosition = true;

  let nekoPosX = 32;
  let nekoPosY = 32;
  
  let mousePosX = 0;
  let mousePosY = 0;

  let frameCount = 0;
  let idleTime = 0;
  let idleAnimation = null;
  let idleAnimationFrame = 0;

  const COLOR_CLASSES = [
    "cat-gray",
    "cat-default",
	"cat-yellow",
    "cat-orange",
    "cat-brown",
    "cat-pink",
    "cat-green",
    "cat-blue",
    "cat-black",
    "cat-disabled"
  ];

  function applyCatColor(colorName) {
    nekoEl.classList.remove(...COLOR_CLASSES);

    const targetClass = `cat-${colorName}`;
    if (COLOR_CLASSES.includes(targetClass)) {
      nekoEl.classList.add(targetClass);
    } else {
      nekoEl.classList.add("cat-gray");
    }

    window.localStorage.setItem("onekoColor", colorName);
  }

  function buildCustomSelect(selectEl) {
    const wrapper = document.createElement("div");
    wrapper.className = "custom-select-wrapper";
    selectEl.parentNode.insertBefore(wrapper, selectEl);
    wrapper.appendChild(selectEl);
    selectEl.style.display = "none";

    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "custom-select-trigger";
    trigger.id = "catColorTrigger";
    trigger.setAttribute("aria-haspopup", "listbox");
    trigger.setAttribute("aria-expanded", "false");

    const triggerText = document.createElement("span");
    triggerText.className = "custom-select-text";

    const arrow = document.createElement("span");
    arrow.className = "custom-select-arrow";
    arrow.textContent = "▾";
	arrow.style.color = "#4d5843"; // === INLINE OVERRIDE FOR ARROW ===

    trigger.appendChild(triggerText);
    trigger.appendChild(arrow);

    const optionsList = document.createElement("ul");
    optionsList.className = "custom-select-options";
    optionsList.setAttribute("role", "listbox");
    optionsList.hidden = true;

    const options = Array.from(selectEl.options);
    const listItems = [];

    function setActive(option, { silent } = {}) {
      triggerText.textContent = option.textContent;
      listItems.forEach((li) => {
        li.classList.toggle("is-selected", li.dataset.value === option.value);
      });
      if (!silent) {
        selectEl.value = option.value;
        selectEl.dispatchEvent(new Event("change"));
      }
    }

    function openList() {
      optionsList.hidden = false;
      trigger.setAttribute("aria-expanded", "true");
      trigger.classList.add("is-open");
      document.addEventListener("click", handleOutsideClick);
    }

    function closeList() {
      optionsList.hidden = true;
      trigger.setAttribute("aria-expanded", "false");
      trigger.classList.remove("is-open");
      document.removeEventListener("click", handleOutsideClick);
    }

    function handleOutsideClick(e) {
      if (!wrapper.contains(e.target)) closeList();
    }

    options.forEach((option) => {
      const li = document.createElement("li");
      li.textContent = option.textContent;
      li.dataset.value = option.value;
      li.setAttribute("role", "option");
      li.tabIndex = -1;
	  li.style.color = "#4d5843"; // === INLINE OVERRIDE FOR LIST ITEMS ===
      li.addEventListener("click", () => {
        setActive(option);
        closeList();
      });
      optionsList.appendChild(li);
      listItems.push(li);
    });

    trigger.addEventListener("click", () => {
      if (optionsList.hidden) {
        openList();
      } else {
        closeList();
      }
    });

    trigger.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeList();
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (optionsList.hidden) openList(); else closeList();
      }
    });

    selectEl.addEventListener("change", () => {
      const matched = options.find((o) => o.value === selectEl.value);
      if (matched) setActive(matched, { silent: true });
    });

    const initialOption = options.find((o) => o.value === selectEl.value) || options[0];
    if (initialOption) setActive(initialOption, { silent: true });

    wrapper.appendChild(trigger);
    wrapper.appendChild(optionsList);

    const label = document.querySelector(`label[for="${selectEl.id}"]`);
    if (label) label.setAttribute("for", trigger.id);
  }

  function initColorPicker() {
    const savedColor = window.localStorage.getItem("onekoColor") || "gray";
    applyCatColor(savedColor);

    const selectEl = document.getElementById("catColorSelect");
    if (selectEl) {
      selectEl.value = savedColor;
      selectEl.addEventListener("change", (e) => {
        applyCatColor(e.target.value);
      });
      buildCustomSelect(selectEl);
	  const picker = document.querySelector(".cat-color-picker");
      if (picker) {
        picker.style.color = "#4d5843";
      }
    }
  }
  // ------------------------------------

  const nekoSpeed = 10;
  const spriteSets = {
    idle: [[-3, -3]],
    alert: [[-7, -3]],
    scratchSelf: [
      [-5, 0],
      [-6, 0],
      [-7, 0],
    ],
    scratchWallN: [
      [0, 0],
      [0, -1],
    ],
    scratchWallS: [
      [-7, -1],
      [-6, -2],
    ],
    scratchWallE: [
      [-2, -2],
      [-2, -3],
    ],
    scratchWallW: [
      [-4, 0],
      [-4, -1],
    ],
    tired: [[-3, -2]],
    sleeping: [
      [-2, 0],
      [-2, -1],
    ],
    N: [
      [-1, -2],
      [-1, -3],
    ],
    NE: [
      [0, -2],
      [0, -3],
    ],
    E: [
      [-3, 0],
      [-3, -1],
    ],
    SE: [
      [-5, -1],
      [-5, -2],
    ],
    S: [
      [-6, -3],
      [-7, -2],
    ],
    SW: [
      [-5, -3],
      [-6, -1],
    ],
    W: [
      [-4, -2],
      [-4, -3],
    ],
    NW: [
      [-1, 0],
      [-1, -1],
    ],
  };

  function init() {
    let nekoFile = "/arcade-game-pwa/img/pwa-oneko.gif";
    const curScript = document.currentScript;
    if (curScript && curScript.dataset.cat) {
      nekoFile = curScript.dataset.cat;
    }
    if (curScript && curScript.dataset.persistPosition) {
      if (curScript.dataset.persistPosition === "") {
        persistPosition = true;
      } else {
        persistPosition = JSON.parse(curScript.dataset.persistPosition.toLowerCase());
      }
    }
  
    if (persistPosition) {
      let storedNeko = JSON.parse(window.localStorage.getItem("oneko"));
      if (storedNeko !== null) {
        nekoPosX = storedNeko.nekoPosX;
        nekoPosY = storedNeko.nekoPosY;
        mousePosX = storedNeko.mousePosX;
        mousePosY = storedNeko.mousePosY;
        frameCount = storedNeko.frameCount;
        idleTime = storedNeko.idleTime;
        idleAnimation = storedNeko.idleAnimation;
        idleAnimationFrame = storedNeko.idleAnimationFrame;
        nekoEl.style.backgroundPosition = storedNeko.bgPos;
      }
    }
  
    nekoEl.id = "oneko";
    nekoEl.ariaHidden = true;
    nekoEl.style.width = "32px";
    nekoEl.style.height = "32px";
    nekoEl.style.position = "fixed";
    nekoEl.style.pointerEvents = "none";
    nekoEl.style.imageRendering = "pixelated";
    nekoEl.style.left = `${nekoPosX - 16}px`;
    nekoEl.style.top = `${nekoPosY - 16}px`;
    nekoEl.style.zIndex = 2147483647;

    nekoEl.style.backgroundImage = `url(${nekoFile})`;
    
    document.body.appendChild(nekoEl);

    initColorPicker();

    document.addEventListener("mousemove", function (event) {
      mousePosX = event.clientX;
      mousePosY = event.clientY;
    });

    document.addEventListener("touchmove", function (event) {
      if (event.touches.length > 0) {
        mousePosX = event.touches[0].clientX;
        mousePosY = event.touches[0].clientY;
      }
    }, { passive: true });
    
    if (persistPosition) {
      window.addEventListener("beforeunload", function (event) {
        window.localStorage.setItem("oneko", JSON.stringify({
          nekoPosX: nekoPosX,
          nekoPosY: nekoPosY,
          mousePosX: mousePosX,
          mousePosY: mousePosY,
          frameCount: frameCount,
          idleTime: idleTime,
          idleAnimation: idleAnimation,
          idleAnimationFrame: idleAnimationFrame,
          bgPos: nekoEl.style.backgroundPosition
        }));
      });
    }
    
    window.requestAnimationFrame(onAnimationFrame);
  }

  let lastFrameTimestamp;

  function onAnimationFrame(timestamp) {
    if (!nekoEl.isConnected) {
      return;
    }
    if (!lastFrameTimestamp) {
      lastFrameTimestamp = timestamp;
    }
    if (timestamp - lastFrameTimestamp > 100) {
      lastFrameTimestamp = timestamp;
      frame();
    }
    window.requestAnimationFrame(onAnimationFrame);
  }

  function setSprite(name, frame) {
    const sprite = spriteSets[name][frame % spriteSets[name].length];
    nekoEl.style.backgroundPosition = `${sprite[0] * 32}px ${sprite[1] * 32}px`;
  }

  function resetIdleAnimation() {
    idleAnimation = null;
    idleAnimationFrame = 0;
  }

  function idle() {
    idleTime += 1;

    if (
      idleTime > 10 &&
      Math.floor(Math.random() * 200) == 0 &&
      idleAnimation == null
    ) {
      let avalibleIdleAnimations = ["sleeping", "scratchSelf"];
      if (nekoPosX < 32) {
        avalibleIdleAnimations.push("scratchWallW");
      }
      if (nekoPosY < 32) {
        avalibleIdleAnimations.push("scratchWallN");
      }
      if (nekoPosX > window.innerWidth - 32) {
        avalibleIdleAnimations.push("scratchWallE");
      }
      if (nekoPosY > window.innerHeight - 32) {
        avalibleIdleAnimations.push("scratchWallS");
      }
      idleAnimation =
        avalibleIdleAnimations[
          Math.floor(Math.random() * avalibleIdleAnimations.length)
        ];
    }

    switch (idleAnimation) {
      case "sleeping":
        if (idleAnimationFrame < 8) {
          setSprite("tired", 0);
          break;
        }
        setSprite("sleeping", Math.floor(idleAnimationFrame / 4));
        if (idleAnimationFrame > 192) {
          resetIdleAnimation();
        }
        break;
      case "scratchWallN":
      case "scratchWallS":
      case "scratchWallE":
      case "scratchWallW":
      case "scratchSelf":
        setSprite(idleAnimation, idleAnimationFrame);
        if (idleAnimationFrame > 9) {
          resetIdleAnimation();
        }
        break;
      default:
        setSprite("idle", 0);
        return;
    }
    idleAnimationFrame += 1;
  }

  function frame() {
    frameCount += 1;
    const diffX = nekoPosX - mousePosX;
    const diffY = nekoPosY - mousePosY;
    const distance = Math.sqrt(diffX ** 2 + diffY ** 2);

    if (distance < nekoSpeed || distance < 48) {
      idle();
      return;
    }

    idleAnimation = null;
    idleAnimationFrame = 0;

    if (idleTime > 1) {
      setSprite("alert", 0);
      idleTime = Math.min(idleTime, 7);
      idleTime -= 1;
      return;
    }

    let direction;
    direction = diffY / distance > 0.5 ? "N" : "";
    direction += diffY / distance < -0.5 ? "S" : "";
    direction += diffX / distance > 0.5 ? "W" : "";
    direction += diffX / distance < -0.5 ? "E" : "";
    setSprite(direction, frameCount);

    nekoPosX -= (diffX / distance) * nekoSpeed;
    nekoPosY -= (diffY / distance) * nekoSpeed;

    nekoPosX = Math.min(Math.max(16, nekoPosX), window.innerWidth - 16);
    nekoPosY = Math.min(Math.max(16, nekoPosY), window.innerHeight - 16);

    nekoEl.style.left = `${nekoPosX - 16}px`;
    nekoEl.style.top = `${nekoPosY - 16}px`;
  }

  init();
})();