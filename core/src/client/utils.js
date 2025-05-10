
const formatUnixTimestamp = (ts) => {
    const date = new Date(Number(ts) * 1000); // convert to ms
    return date.toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });
}

export default formatUnixTimestamp;