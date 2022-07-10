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
      const percent = (Math.min(value || 0, max) / max) * 100;

      gaugeRef.current.style.transitionDuration = `${Math.max(duration * 1.25, 100)}ms`;
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
