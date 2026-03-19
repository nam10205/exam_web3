const scripts = [
    "js/utils.js",
    "js/data.js",
    "js/auth.js",
    "js/student.js",
    "js/chart.js",   // Load trước admin.js để initChart sẵn sàng
    "js/admin.js",
];

const loadedScripts = new Set();

function loadScripts(index = 0) {
    if (index >= scripts.length) {
        console.log("%c[System] Tất cả tài nguyên đã được nạp thành công!", "color: green; font-weight: bold;");
        return;
    }

    const scriptUrl = scripts[index];

    if (document.querySelector(`script[src^="${scriptUrl}"]`) || loadedScripts.has(scriptUrl)) {
        console.warn(`[System] Script ${scriptUrl} đã tồn tại, bỏ qua.`);
        loadScripts(index + 1);
        return;
    }

    const script = document.createElement("script");
    script.src = `${scriptUrl}?v=${Date.now()}`;

    script.onload = () => {
        loadedScripts.add(scriptUrl);
        console.log(`[OK] Loaded: ${scriptUrl}`);
        loadScripts(index + 1);
    };

    script.onerror = () => {
        console.error(`[Error] Không thể nạp file: ${scriptUrl}.`);
        loadScripts(index + 1);
    };

    document.body.appendChild(script);
}

document.addEventListener("DOMContentLoaded", () => {
    console.log("[System] Đang khởi động...");
    loadScripts();
});