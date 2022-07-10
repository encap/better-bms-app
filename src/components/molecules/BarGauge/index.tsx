import { useEffect, useRef } from 'react';
import { BarGaugeContainer, GaugeValue, GagueStyleProps } from './styles';

type BarGaugeProps = {
  value: number;
  max: number;
  duration: number;
} & GagueStyleProps;

const BarGauge = ({ value, max, duration, ...gaugeValueProps }: BarGaugeProps) => {
  const gaugeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (gaugeRef.current) {
      const percent = (value / max) * 100;

      gaugeRef.current.style.transitionDuration = `${duration * 1.25}ms`;
      gaugeRef.current.style.transform = `translate3d(0, -${percent}%, 0)`;
    }
  }, [value]);

  return (
    <BarGaugeContainer {...gaugeValueProps}>
      <GaugeValue ref={gaugeRef} />
    </BarGaugeContainer>
  );
};

export default BarGauge;
