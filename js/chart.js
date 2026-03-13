// chart.js - Chart and statistics functionality
function initChart() {
    if (chartInstance) chartInstance.destroy();
    const ctx = document.getElementById('scoreChart').getContext('2d');
    chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Dưới 5đ', '5đ - 7đ', '7đ - 8.5đ', 'Trên 8.5đ'],
            datasets: [{
                label: 'Phân phối điểm số',
                data: [10, 35, 80, 50], // Dữ liệu fix cứng (Mock)
                backgroundColor: ['#ffcdd2', '#ffb74d', '#81c784', '#d32f2f'],
                borderRadius: 4
            }]
        },
        options: { responsive: true, plugins: { legend: { display: false } } }
    });
}