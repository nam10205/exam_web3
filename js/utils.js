// utils.js - Utility functions
function toText(content) {
    if (content === null || content === undefined) return "";
    const temp = document.createElement('div');
    temp.textContent = content;
    return temp.innerHTML;
}