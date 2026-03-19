
const scripts = [
    "js/utils.js",
    "js/data.js",
    "js/auth.js",
    "js/student.js",
    "js/admin.js",
    "js/chart.js"
];

function loadScripts(index = 0) {
    if (index >= scripts.length) return;

    const script = document.createElement("script");
    script.src = scripts[index];
    script.onload = () => loadScripts(index + 1);

    document.body.appendChild(script);
}


document.addEventListener("DOMContentLoaded", () => {
    loadScripts();
});
