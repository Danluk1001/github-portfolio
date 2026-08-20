(() => {
  const createStarField = () => {
    if (document.querySelector('.twinkle-field')) return;

    const field = document.createElement('div');
    field.className = 'twinkle-field';
    field.setAttribute('aria-hidden', 'true');

    const starCount = window.innerWidth < 600 ? 34 : 58;
    const fragment = document.createDocumentFragment();

    for (let index = 0; index < starCount; index += 1) {
      const star = document.createElement('span');
      const size = (Math.random() * 2.2 + 1).toFixed(2);

      star.className = index % 11 === 0 ? 'twinkle-star twinkle-star--bright' : 'twinkle-star';
      star.style.setProperty('--star-x', `${(Math.random() * 100).toFixed(2)}%`);
      star.style.setProperty('--star-y', `${(Math.random() * 72).toFixed(2)}%`);
      star.style.setProperty('--star-size', `${size}px`);
      star.style.setProperty('--star-duration', `${(Math.random() * 5 + 3).toFixed(2)}s`);
      star.style.setProperty('--star-delay', `${(Math.random() * -8).toFixed(2)}s`);
      star.style.setProperty('--star-peak', `${(Math.random() * .35 + .55).toFixed(2)}`);
      fragment.appendChild(star);
    }

    field.appendChild(fragment);
    document.body.prepend(field);
  };

  const createCursorLight = () => {
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!finePointer || reducedMotion || document.querySelector('.cursor-light')) return;

    const light = document.createElement('div');
    light.className = 'cursor-light';
    light.setAttribute('aria-hidden', 'true');
    document.body.prepend(light);

    let currentX = window.innerWidth / 2;
    let currentY = window.innerHeight / 3;
    let targetX = currentX;
    let targetY = currentY;
    let frame = null;

    const render = () => {
      currentX += (targetX - currentX) * .14;
      currentY += (targetY - currentY) * .14;
      light.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) translate(-50%, -50%)`;

      if (Math.abs(targetX - currentX) > .2 || Math.abs(targetY - currentY) > .2) {
        frame = requestAnimationFrame(render);
      } else {
        frame = null;
      }
    };

    window.addEventListener('pointermove', (event) => {
      targetX = event.clientX;
      targetY = event.clientY;
      light.classList.add('is-visible');
      if (!frame) frame = requestAnimationFrame(render);
    }, { passive: true });

    document.documentElement.addEventListener('pointerleave', () => {
      light.classList.remove('is-visible');
    });

    document.documentElement.addEventListener('pointerenter', () => {
      light.classList.add('is-visible');
    });
  };

  const initializeAtmosphere = () => {
    createStarField();
    createCursorLight();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAtmosphere, { once: true });
  } else {
    initializeAtmosphere();
  }
})();
