import Chart from 'react-apexcharts';

export default function FinancialChart({ chartData = [] }) {
    const categories = chartData.map((d) => d.month);
    const gmvData = chartData.map((d) => d.gmv);
    const revenueData = chartData.map((d) => d.revenue);

    const options = {
        chart: {
            type: 'area',
            background: 'transparent',
            toolbar: { show: false },
            zoom: { enabled: false },
            fontFamily: 'inherit',
        },
        theme: {
            mode: 'dark',
        },
        colors: ['#8b5cf6', '#10b981'], // Violet (GMV), Green (Revenue)
        dataLabels: { enabled: false },
        stroke: {
            curve: 'smooth',
            width: 2,
        },
        fill: {
            type: 'gradient',
            gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.3,
                opacityTo: 0.05,
                stops: [0, 90, 100],
            },
        },
        grid: {
            borderColor: '#1f2937',
            strokeDashArray: 4,
            padding: { left: 10, right: 10, top: 0, bottom: 0 },
        },
        xaxis: {
            categories: categories,
            axisBorder: { show: false },
            axisTicks: { show: false },
            labels: {
                style: { colors: '#9ca3af', fontSize: '11px' },
            },
        },
        yaxis: {
            labels: {
                style: { colors: '#9ca3af', fontSize: '11px' },
                formatter: (val) => {
                    if (val >= 1_000_000_000) return `Rp ${(val / 1_000_000_000).toFixed(1)}M`;
                    if (val >= 1_000_000) return `Rp ${(val / 1_000_000).toFixed(1)}jt`;
                    return `Rp ${val.toLocaleString('id-ID')}`;
                },
            },
        },
        tooltip: {
            theme: 'dark',
            x: { show: true },
            y: {
                formatter: (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val),
            },
        },
        legend: {
            position: 'top',
            horizontalAlign: 'right',
            labels: { colors: '#f3f4f6' },
            markers: { radius: 4 },
        },
    };

    const series = [
        { name: 'Gross Merchandise Value (GMV)', data: gmvData },
        { name: 'Keuntungan Platform', data: revenueData },
    ];

    return (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6">
                <div>
                    <h3 className="text-sm font-semibold text-white">Ikhtisar GMV &amp; Pendapatan</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Analisis perbandingan volume transaksi 6 bulan terakhir</p>
                </div>
            </div>
            <div className="w-full min-h-[300px]">
                <Chart options={options} series={series} type="area" height={300} />
            </div>
        </div>
    );
}
