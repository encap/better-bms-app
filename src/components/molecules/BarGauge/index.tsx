import { useEffect, useRef } from 'react';
import { BarGaugeContainer, GaugeValue, GagueStyleProps, RippleContainer } from './styles';

type BarGaugeProps = {
  value: number;
  max: number;
  duration: number;
} & GagueStyleProps;

const BarGauge = ({ value, max, duration, ...gaugeValueProps }: BarGaugeProps) => {
  const gaugeRef = useRef<HTMLDivElement>(null);
  const rippleContainerRef = useRef<HTMLDivElement>(null);
  const previousRef = useRef(0);

  useEffect(() => {
    if (gaugeRef.current && rippleContainerRef.current) {
      const percent = (Math.min(value || 0, max) / max) * 100;

      const calculatedDuration = Math.max(duration * 1.1, 100);
      gaugeRef.current.style.transitionDuration = `${calculatedDuration}ms`;
      gaugeRef.current.style.transform = `translate3d(0, -${percent}%, 0)`;

      if (
        gaugeValueProps.background !== 'white' &&
        percent > 30 &&
        percent - previousRef.current > 10
      ) {
        rippleContainerRef.current.style.animation = 'none';
        rippleContainerRef.current.offsetHeight;
        rippleContainerRef.current.style.animation = `ripple ease-out ${
          calculatedDuration * 1.4
        }ms`;
      }

      previousRef.current = percent;
    }
  }, [value]);

  return (
    <BarGaugeContainer {...gaugeValueProps}>
      <RippleContainer ref={rippleContainerRef} />
      <GaugeValue ref={gaugeRef} />
    </BarGaugeContainer>
  );
};

export default BarGauge;
