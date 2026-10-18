(() => {
    const exercises = [...document.querySelectorAll('.training-container')];
    const nav = document.querySelector('.main-nav');
    const scroller = document.querySelector('.main-content');
    if (!exercises.length || !nav || !scroller) return;

    // One native modal drawer serves the current exercise on narrow screens.
    // Moving the guide preserves expanded hints when the drawer is reopened.
    const narrowScreen = window.matchMedia('(max-width: 1100px)');
    const drawer = document.createElement('dialog');
    drawer.className = 'instructions-drawer';
    drawer.setAttribute('aria-labelledby', 'instructions-drawer-title');
    const drawerHeader = document.createElement('header');
    drawerHeader.className = 'drawer-header';
    const drawerTitle = document.createElement('h2');
    drawerTitle.id = 'instructions-drawer-title';
    const closeDrawer = document.createElement('button');
    closeDrawer.type = 'button';
    closeDrawer.textContent = 'Close instructions';
    drawerHeader.append(drawerTitle, closeDrawer);
    drawer.append(drawerHeader);
    drawer.id = 'instructions-drawer';
    document.body.append(drawer);
    let openGuide = null;
    let guidePlaceholder = null;
    let drawerTrigger = null;
    const restoreGuide = () => {
        if (!openGuide) return;
        guidePlaceholder.replaceWith(openGuide);
        drawerTrigger.setAttribute('aria-expanded', 'false');
        openGuide = null;
        guidePlaceholder = null;
        drawerTrigger = null;
    };
    closeDrawer.addEventListener('click', () => drawer.close());
    drawer.addEventListener('close', restoreGuide);
    drawer.addEventListener('click', event => {
        if (event.target === drawer) {
            const bounds = drawer.getBoundingClientRect();
            if (event.clientX < bounds.left || event.clientX > bounds.right ||
                event.clientY < bounds.top || event.clientY > bounds.bottom) drawer.close();
        }
    });
    narrowScreen.addEventListener('change', () => {
        if (drawer.open) {
            drawer.close();
            restoreGuide();
        }
    });
    exercises.forEach(exercise => {
        const guide = exercise.querySelector('.exercise-guide');
        if (!guide) return;
        guide.setAttribute('role', 'complementary');
        guide.setAttribute('aria-label', 'Task, success checks, and hints');
        const trigger = document.createElement('button');
        trigger.type = 'button';
        trigger.className = 'instructions-toggle';
        trigger.textContent = 'Task & hints';
        trigger.setAttribute('aria-label', `Task and hints: ${exercise.querySelector('h2').textContent}`);
        trigger.setAttribute('aria-controls', drawer.id);
        trigger.setAttribute('aria-haspopup', 'dialog');
        trigger.setAttribute('aria-expanded', 'false');
        guide.before(trigger);
        trigger.addEventListener('click', () => {
            if (!narrowScreen.matches) return;
            restoreGuide();
            guidePlaceholder = document.createComment('Exercise instructions');
            guide.replaceWith(guidePlaceholder);
            openGuide = guide;
            drawerTrigger = trigger;
            drawerTitle.textContent = exercise.querySelector('h2').textContent;
            drawer.append(guide);
            trigger.setAttribute('aria-expanded', 'true');
            drawer.showModal();
            closeDrawer.focus();
        });
    });
    document.documentElement.classList.add('instructions-enhanced');

    const links = exercises.map((exercise, index) => {
        const title = exercise.querySelector('h2').textContent;
        const link = document.createElement('a');
        link.href = `#${exercise.id}`;
        link.textContent = index + 1;
        link.title = title;
        link.setAttribute('aria-label', `Exercise ${index + 1}: ${title}`);
        nav.append(link);
        return link;
    });

    const setCurrent = exercise => {
        exercises.forEach((item, index) => {
            const active = item === exercise;
            item.classList.toggle('active', active);
            if (active) links[index].setAttribute('aria-current', 'step');
            else links[index].removeAttribute('aria-current');
        });
    };
    const goToHash = () => {
        const exercise = exercises.find(item => `#${item.id}` === location.hash);
        if (!exercise) return;
        setCurrent(exercise);
        exercise.scrollIntoView();
        exercise.querySelector('h2').focus({ preventScroll: true });
    };
    window.addEventListener('hashchange', goToHash);
    nav.addEventListener('click', event => {
        if (event.target.closest('a')?.hash === location.hash) goToHash();
    });
    setCurrent(exercises[0]);
    if ('IntersectionObserver' in window) {
        const visibility = new Map();
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => visibility.set(entry.target, entry.intersectionRatio));
            const current = exercises.reduce((best, item) =>
                (visibility.get(item) || 0) > (visibility.get(best) || 0) ? item : best);
            if (visibility.get(current) > 0) setCurrent(current);
        }, { root: scroller, threshold: [0, .1, .25, .5, .75, 1] });
        exercises.forEach(exercise => observer.observe(exercise));
    }

    const sizeUpdates = new Map();
    exercises.forEach((exercise, index) => {
        const panel = exercise.querySelector('.training-el');
        if (!panel) return;
        const workspace = document.createElement('div');
        workspace.className = 'workspace';
        panel.before(workspace);
        const label = document.createElement('h3');
        label.textContent = 'Your result';
        const help = document.createElement('p');
        help.id = `${exercise.id}-resize-help`;
        help.textContent = 'Drag the bottom-right corner to resize, or use the width control.';
        const controls = document.createElement('div');
        controls.className = 'resize-controls';
        const widthLabel = document.createElement('label');
        widthLabel.htmlFor = `${exercise.id}-width`;
        widthLabel.textContent = 'Panel width';
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.id = widthLabel.htmlFor;
        slider.step = '1';
        slider.setAttribute('aria-describedby', help.id);
        const output = document.createElement('output');
        output.htmlFor = slider.id;
        const reset = document.createElement('button');
        reset.type = 'button';
        reset.textContent = 'Reset size';
        controls.append(widthLabel, slider, output, reset);
        const workspaceInfo = document.createElement('div');
        workspaceInfo.className = 'workspace-info';
        workspaceInfo.append(help, controls);
        workspace.append(label, panel, workspaceInfo);
        let chosenWidth = null;
        const updateSize = () => {
            const minimum = parseFloat(getComputedStyle(panel).minWidth) || 200;
            slider.min = minimum;
            slider.max = Math.max(minimum, workspace.clientWidth - 32);
            if (chosenWidth !== null) {
                panel.style.width = `${Math.max(minimum, Math.min(chosenWidth, +slider.max))}px`;
            }
            const width = Math.round(panel.getBoundingClientRect().width);
            slider.value = width;
            const container = panel.querySelector('.container');
            output.textContent = `Panel: ${width}px${container ? ` · Query container: ${Math.round(container.getBoundingClientRect().width)}px` : ''}`;
        };
        slider.addEventListener('input', () => {
            chosenWidth = +slider.value;
            updateSize();
        });
        // Native dragging takes over from the keyboard width control.
        panel.addEventListener('pointerdown', () => { chosenWidth = null; });
        reset.addEventListener('click', () => {
            chosenWidth = null;
            panel.style.removeProperty('width');
            panel.style.removeProperty('height');
            updateSize();
        });
        sizeUpdates.set(panel, updateSize);
        const footer = document.createElement('nav');
        footer.className = 'exercise-navigation';
        footer.setAttribute('aria-label', `Navigation for exercise ${index + 1}`);
        const position = document.createElement('span');
        position.textContent = `Exercise ${index + 1} of ${exercises.length}`;
        footer.append(position);
        [[index - 1, 'Previous'], [index + 1, 'Next']].forEach(([target, text]) => {
            if (!exercises[target]) return;
            const link = document.createElement('a');
            link.href = `#${exercises[target].id}`;
            link.textContent = text;
            footer.append(link);
        });
        exercise.append(footer);
        updateSize();
    });
    if ('ResizeObserver' in window) {
        const observer = new ResizeObserver(entries => {
            entries.forEach(entry => sizeUpdates.get(entry.target)?.());
        });
        sizeUpdates.forEach((update, panel) => observer.observe(panel));
    }
    window.addEventListener('resize', () => sizeUpdates.forEach(update => update()));
    if (location.hash) requestAnimationFrame(goToHash);
})();
