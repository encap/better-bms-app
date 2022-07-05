import { MouseEventHandler, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Chart as ChartJS,
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
  Chart,
} from 'chart.js';
Chart.register(TimeScale);
import { Line } from 'react-chartjs-2';
import { Data } from '../../../interfaces/data';
import 'chartjs-adapter-date-fns';
import ChartStreaming from 'chartjs-plugin-streaming';
import { ChartJSOrUndefined } from 'react-chartjs-2/dist/types';
import { ChartClickArea, ChartContainer } from './styles';
import { UILog } from '../../../utils/logger';
import { useLongPress, LongPressDetectEvents } from 'use-long-press';
import dayjs from 'dayjs';
Chart.register(ChartStreaming);

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export const options: ChartOptions<'line'> = {
  responsive: true,
  animation: false,
  spanGaps: false,
  scales: {
    x: {
      type: 'realtime',
      ticks: {
        display: false,
      },
    },
    y: {
      type: 'linear',
      position: 'left',
      suggestedMin: 50,
      suggestedMax: 84,
    },
    y1: {
      type: 'linear',
      display: true,
      position: 'right',
      grid: {
        drawOnChartArea: false,
      },
      suggestedMin: 0,
      suggestedMax: 50,
      beginAtZero: true,
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
      duration: 1000 * 60 * 2,
      delay: 300,
      frameRate: 5,
    },
  },
};

type LineChartProps = {
  currentData: Data;
};

type Datum = {
  timestamp: number;
  voltage: number;
  current: number;
} | null;

export function LineChart({ currentData }: LineChartProps) {
  const chartRef = useRef<ChartJSOrUndefined<'line', Datum[]>>();
  const pauseTimestamp = useRef<number | null>(null);

  const handleLongPress = useCallback(() => {
    UILog.log(`Reset chart on long press`, {
      pauseTimestamp,
      chartRef,
    });
    if (chartRef.current) {
      // Doesn't work :(
      chartRef.current.data.datasets.forEach((dataset) => (dataset.data = []));
      chartRef.current?.clear();
    }
  }, []);

  const handleChartClick = useCallback((ev: any) => {
    ev.stopPropagation();
    ev.preventDefault();

    UILog.log(pauseTimestamp.current ? `Resumit chart updates` : `Pausing chart updates`, {
      ev,
      pauseTimestamp,
      chartRef,
    });
    if (pauseTimestamp.current) {
      if (chartRef.current) {
        const timeDifference = dayjs().valueOf() - pauseTimestamp.current;

        chartRef.current.data.datasets.forEach(
          (dataset) =>
            (dataset.data = [
              ...dataset.data.map((datum) =>
                datum
                  ? ({
                      ...datum,
                      timestamp: datum.timestamp + timeDifference - 5000,
                    } as Datum)
                  : datum
              ),
              null,
            ])
        );
      }

      pauseTimestamp.current = null;
    } else {
      pauseTimestamp.current = dayjs().valueOf();
    }

    if (chartRef.current?.options?.plugins?.streaming) {
      chartRef.current.options.plugins.streaming.pause = Boolean(pauseTimestamp.current);
    }
  }, []);

  const bindLongPress = useLongPress(handleLongPress, {
    threshold: 1000,
    // Detect only touch to allow for other click events
    detect: LongPressDetectEvents.TOUCH,
  });

  const data = useMemo<ChartData<'line', Datum[]>>(
    () => ({
      datasets: [
        {
          label: 'Voltage',
          data: [],
          borderColor: 'rgb(26, 181, 203)',
          backgroundColor: 'none',
          parsing: {
            xAxisKey: 'timestamp',
            yAxisKey: 'voltage',
          },
          yAxisId: 'y',
        },
        {
          label: 'Current',
          data: [],
          borderColor: 'rgb(236, 77, 76)',
          backgroundColor: 'none',
          parsing: {
            xAxisKey: 'timestamp',
            yAxisKey: 'current',
          },
          yAxisID: 'y1',
        },
      ],
    }),
    []
  );

  useEffect(() => {
    if (chartRef.current && currentData.batteryData && !pauseTimestamp.current) {
      const datum: Datum = {
        timestamp: currentData.timestamp,
        voltage: currentData.batteryData?.voltage,
        current: Math.abs(currentData.batteryData?.current),
      };

      chartRef.current.data.datasets.forEach((dataset) => dataset.data.push(datum));
      chartRef.current.update('quiet');
    }
  }, [currentData]);

  return (
    <ChartContainer>
      <Line options={options} data={data} ref={chartRef} />
      <ChartClickArea {...bindLongPress()} onClick={handleChartClick} />
    </ChartContainer>
  );
}