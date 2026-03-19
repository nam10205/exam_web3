// chart.js - Chart and statistics functionality
// chartInstance đã được khai báo trong data.js, không khai báo lại

async function initChart() {
    try {
        const res = await fetch(`${window.API_BASE}/attempts/`);
        const data = await res.json();

        // Tính phân phối điểm theo thang 10
        const buckets = [0, 0, 0, 0]; // <5, 5-7, 7-8.5, >8.5
        let tongDiem = 0;
        let caoNhat = 0;
        let thapNhat = 10;

        data.forEach(row => {
            const diem10 = row.total > 0 ? (row.score / row.total) * 10 : 0;
            tongDiem += diem10;
            if (diem10 > caoNhat) caoNhat = diem10;
            if (diem10 < thapNhat) thapNhat = diem10;

            if (diem10 < 5) buckets[0]++;
            else if (diem10 < 7) buckets[1]++;
            else if (diem10 < 8.5) buckets[2]++;
            else buckets[3]++;
        });

        const trungBinh = data.length ? (tongDiem / data.length).toFixed(1) : 0;

        // Cập nhật stat cards
        const el = id => document.getElementById(id);
        if (el('stat-total-attempts')) el('stat-total-attempts').innerText = data.length;
        if (el('stat-avg-score')) el('stat-avg-score').innerText = trungBinh + ' đ';
        if (el('stat-highest')) el('stat-highest').innerText = data.length ? caoNhat.toFixed(1) + ' đ' : '—';
        if (el('stat-lowest')) el('stat-lowest').innerText = data.length ? thapNhat.toFixed(1) + ' đ' : '—';

        // Vẽ biểu đồ
        if (chartInstance) chartInstance.destroy();
        const canvas = document.getElementById('scoreChart');
        if (!canvas) return;

        chartInstance = new Chart(canvas.getContext('2d'), {
            type: 'bar',
            data: {
                labels: ['Dưới 5đ', '5đ – 7đ', '7đ – 8.5đ', 'Trên 8.5đ'],
                datasets: [{
                    label: 'Số lượt thi',
                    data: buckets,
                    backgroundColor: ['#e74c3c', '#e67e22', '#2ecc71', '#27ae60'],
                    borderRadius: 6,
                    borderSkipped: false
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: ctx => ` ${ctx.parsed.y} lượt`
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { stepSize: 1 },
                        title: { display: true, text: 'Số lượt thi' }
                    },
                    x: {
                        title: { display: true, text: 'Khoảng điểm' }
                    }
                }
            }
        });

    } catch (e) {
        console.error("Lỗi load chart:", e);
    }
}