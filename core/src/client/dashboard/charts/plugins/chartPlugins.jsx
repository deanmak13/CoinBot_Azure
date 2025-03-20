

export const chartBackgroundPlugin = (theme) => ({
    id: 'customCanvasBackgroundColor',
    beforeDraw: (chart) => {
        const ctx = chart.canvas.getContext('2d');
        ctx.save();
        ctx.globalCompositeOperation = 'destination-over';
        ctx.fillStyle = theme.palette.background.default;
        ctx.fillRect(0, 0, chart.width, chart.height);
        ctx.restore();
    },
});
