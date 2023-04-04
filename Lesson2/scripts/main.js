const containers = Array.from(document.querySelectorAll('.training-container'));
const nav = document.querySelector('.main-nav');

// Creating Nav Buttons

containers.forEach((container, idx) => {
    const num = idx + 1;
    const btn = document.createElement('button');
    btn.innerText = num;
    btn.onclick = () => {
        // updateActiveButton(idx);
        container.scrollIntoView();
    }
    nav.appendChild(btn);
})

function updateActiveButton(idx) {
    const btns = document.querySelectorAll('.main-nav button');
    btns.forEach((btn, btnIndex) => {
        if (btnIndex === idx) btn.classList.add('active')
        else btn.classList.remove('active')
    })
}


// Observer
const containerObserver = new IntersectionObserver(updateContainer, { threshold: .5, });

containers.forEach(container => containerObserver.observe(container));

function updateContainer(entries) {
    entries.forEach((entry) => {
        const container = entry.target;
        const idxNum = containers.indexOf(container);
        const btns = Array.from(document.querySelectorAll('.main-nav button'));
        if (entry.isIntersecting) {
            container.classList.add('active');
            btns[idxNum].classList.add('active');
        }
        else {
            container.classList.remove('active');
            btns[idxNum].classList.remove('active');
        }
    });
}