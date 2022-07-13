import { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Chart,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions,
  TimeScale,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';
import ChartStreaming from 'chartjs-plugin-streaming';
import { ChartJSOrUndefined } from 'react-chartjs-2/dist/types';
import { ChartClickArea, ChartContainer, PauseIndicator } from './styles';
import { UILog } from 'utils/logger';
import { useLongPress, LongPressDetectEvents } from 'use-long-press';
import { useTheme } from 'styled-components';
import { LiveDataDatum, useDataLogger } from 'components/providers/DataLogger';
import { Units } from 'interfaces/index';
import { useDevice } from 'components/providers/DeviceProvider';

Chart.register(ChartStreaming);
Chart.register(TimeScale);
Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

type LineChartProps = {
  duration: Units['miliseconds'];
  frameRate: number;
  showGridLines?: boolean;
  showXAxisLabels?: boolean;
  currentSpeed?: Units['kmh'];
};

const LineChart = ({ duration, frameRate, showGridLines, showXAxisLabels }: LineChartProps) => {
  const chartRef = useRef<ChartJSOrUndefined<'line', LiveDataDatum[]>>();
  const theme = useTheme();
  const { liveDataLog, isPaused, stop, start, reset } = useDataLogger();
  const { status } = useDevice();

  const handleLongPress = useCallback(() => {
    UILog.log(`Reset chart on long press`, {
      isPaused,
      chartRef,
    });
    reset();
    if (chartRef.current) {
      // Doesn't work :(
      chartRef.current.data.datasets.forEach((dataset) => (dataset.data = []));
      chartRef.current?.clear();
    }
  }, [reset]);

  const handleChartClick = useCallback(
    (ev: any) => {
      ev.stopPropagation();
      ev.preventDefault();

      UILog.log(isPaused ? `Resumit chart updates` : `Pausing chart updates`, {
        ev,
        isPaused,
        chartRef,
      });

      if (isPaused) {
        if (status === 'connected') {
          start();
        } else {
          UILog.log(`Can't resume updates when disconnected`, { status, ev, isPaused });
        }
      } else {
        stop();
      }
    },
    [isPaused, status === 'connected']
  );

  const bindLongPress = useLongPress(handleLongPress, {
    threshold: 1000,
    // Detect only touch to allow for other click events
    detect: LongPressDetectEvents.TOUCH,
  });

  const data = useMemo<ChartData<'line', LiveDataDatum[]>>(
    () => ({
      datasets: [
        {
          label: 'Speed',
          data: [],
          borderColor: theme.accents_7,
          backgroundColor: 'none',
          parsing: {
            xAxisKey: 'correctedTimestamp',
            yAxisKey: 'speed',
          },
          yAxisId: 'ySpeed',
        },
        {
          label: 'Voltage',
          data: [],
          borderColor: theme.success,
          backgroundColor: 'none',
          parsing: {
            xAxisKey: 'correctedTimestamp',
            yAxisKey: 'voltage',
          },
          yAxisId: 'yVoltage',
        },
        {
          label: 'Current',
          data: [],
          borderColor: theme.error,
          backgroundColor: 'none',
          parsing: {
            xAxisKey: 'correctedTimestamp',
            yAxisKey: 'current',
          },
          yAxisID: 'yCurrent',
        },
        {
          label: 'Ping',
          data: [],
          borderColor: '#171717',
          borderWidth: 1,
          backgroundColor: 'none',
          parsing: {
            xAxisKey: 'correctedTimestamp',
            yAxisKey: 'timeSinceLastOne',
          },
          yAxisID: 'yPing',
          hidden: duration > 1000 * 60 * 10,
        },
      ],
    }),
    [theme, duration]
  );

  const options = useMemo<ChartOptions<'line'>>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      spanGaps: false,
      scales: {
        x: {
          type: 'realtime',
          ticks: {
            display: Boolean(showXAxisLabels),
          },
        },
        ySpeed: {
          type: 'linear',
          display: false,
          position: 'right',
          suggestedMin: 0,
          suggestedMax: 80,
          beginAtZero: true,
        },
        yVoltage: {
          type: 'linear',
          position: 'left',
          suggestedMin: 50,
          suggestedMax: 84,
        },
        yCurrent: {
          type: 'linear',
          display: true,
          position: 'right',
          grid: showGridLines
            ? {
                display: true,
                color: '#171717',
              }
            : undefined,
          suggestedMin: 0,
          suggestedMax: 50,
          beginAtZero: true,
        },
        yPing: {
          type: 'linear',
          display: false,
          position: 'right',
          min: 200,
          max: 600,
        },
      },
      elements: {
        point: {
          radius: 0,
        },
        line: {
          borderWidth: 2,
          tension: 0.1,
        },
      },
      plugins: {
        legend: {
          display: false,
        },
        streaming: {
          duration: duration,
          delay: 500,
          frameRate: frameRate,
          ttl: 1000 * 60 * 60 * 5,
        },
      },
    }),
    [duration, frameRate, showXAxisLabels, showGridLines]
  );

  useEffect(() => {
    if (chartRef.current?.options?.plugins?.streaming) {
      if (isPaused || isPaused === null) {
        chartRef.current.options.plugins.streaming.pause = true;
      } else if (isPaused === false) {
        chartRef.current.options.plugins.streaming.pause = false;
      }
    }
  }, [isPaused]);

  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.data.datasets.forEach((dataset) => (dataset.data = liveDataLog));
      chartRef.current.update('quiet');
    }
  }, [liveDataLog]);

  return (
    <ChartContainer>
      <Line options={options} data={data} ref={chartRef} />
      <ChartClickArea {...bindLongPress()} onClick={handleChartClick} />
      {isPaused && <PauseIndicator onClick={handleChartClick} color={theme.warning} size={24} />}
    </ChartContainer>
  );
};

export default memo(LineChart);
