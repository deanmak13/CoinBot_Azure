import * as React from 'react';
import PropTypes from 'prop-types';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { SparkLineChart } from '@mui/x-charts/SparkLineChart';
import { areaElementClasses } from '@mui/x-charts/LineChart';
import formatUnixTimestamp from '../../utils';

function AreaGradient({ color, id }) {
  return (
    <defs>
      <linearGradient id={id} x1="50%" y1="0%" x2="50%" y2="100%">
        <stop offset="0%" stopColor={color} stopOpacity={0.3} />
        <stop offset="100%" stopColor={color} stopOpacity={0} />
      </linearGradient>
    </defs>
  );
}

AreaGradient.propTypes = {
  color: PropTypes.string.isRequired,
  id: PropTypes.string.isRequired,
};

function getTrendAndValue(data) {
  if (!Array.isArray(data) || data.length < 2) {
    return { trend: 'neutral', label: '0%' };
  }
  const prev = data[data.length - 2];
  const curr = data[data.length - 1];
  const diff = curr - prev;

  if (prev === 0) return { trend: 'neutral', label: '0%' }; // avoid div-by-zero

  const percentage = ((diff / prev) * 100).toFixed(2);
  const sign = diff > 0 ? '+' : '';
  const trend = diff > 0 ? 'up' : diff < 0 ? 'down' : 'neutral';

  return { trend, label: `${sign}${percentage}%` };
}

function StatCard({ title, value, interval, yAxisData, xAxisData }) {
  const theme = useTheme();

  const trendColors = {
    up:
      theme.palette.mode === 'light'
        ? theme.palette.success.main
        : theme.palette.success.dark,
    down:
      theme.palette.mode === 'light'
        ? theme.palette.error.main
        : theme.palette.error.dark,
    neutral:
      theme.palette.mode === 'light'
        ? theme.palette.grey[400]
        : theme.palette.grey[700],
  };

  const labelColors = {
    up: 'success',
    down: 'error',
    neutral: 'default',
  };

  const { trend: trend, label: trendValue } = getTrendAndValue(yAxisData);
  const color = labelColors[trend];
  const chartColor = trendColors[trend];
  const formattedXAxisData = xAxisData.map(formatUnixTimestamp);

  return (
    <Card variant="outlined" sx={{ height: '100%', flexGrow: 1 }}>
      <CardContent>
        <Typography component="h2" variant="subtitle2" gutterBottom>
          {title}
        </Typography>
        <Stack
          direction="column"
          sx={{ justifyContent: 'space-between', flexGrow: '1', gap: 1 }}
        >
          <Stack sx={{ justifyContent: 'space-between' }}>
            <Stack
              direction="row"
              sx={{ justifyContent: 'space-between', alignItems: 'center' }}
            >
              <Typography variant="h4" component="p">
                {value}
              </Typography>
              <Chip
                  size="small"
                  color={color}
                  label={trendValue}
                  sx={{ ml: 1 }} // Added margin left for spacing
              />
            </Stack>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {interval}
            </Typography>
          </Stack>
          <Box sx={{ width: '100%', height: 50 }}>
            <SparkLineChart
              colors={[chartColor]}
              data={yAxisData}
              area
              showHighlight
              showTooltip
              xAxis={{
                scaleType: 'band',
                data: formattedXAxisData, // Use the correct property 'data' for xAxis
              }}
              sx={{
                [`& .${areaElementClasses.root}`]: {
                  fill: `url(#area-gradient-${value})`,
                },
              }}
            >
              <AreaGradient color={chartColor} id={`area-gradient-${value}`} />
            </SparkLineChart>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

StatCard.propTypes = {
  yAxisData: PropTypes.arrayOf(PropTypes.number).isRequired,
  xAxisData: PropTypes.arrayOf(PropTypes.number).isRequired,
  interval: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
};

export default StatCard;