const scripts = [
    "js/utils.js",
    "js/data.js",
    "js/auth.js",
    "js/student.js",
    "js/chart.js",
    "js/admin.js"
];

const loadedScripts = new Set();

function loadScripts(index = 0) {
    if (index >= scripts.length) {
        return;
    }

    const scriptUrl = scripts[index];

    if (document.querySelector(`script[src^="${scriptUrl}"]`) || loadedScripts.has(scriptUrl)) {
        loadScripts(index + 1);
        return;
    }

    const script = document.createElement("script");
    script.src = `${scriptUrl}?v=${Date.now()}`;

    script.onload = () => {
        loadedScripts.add(scriptUrl);
        loadScripts(index + 1);
    };

    script.onerror = () => {
        loadScripts(index + 1);
    };

    document.body.appendChild(script);
}

document.addEventListener("DOMContentLoaded", () => {
    loadScripts();
});
