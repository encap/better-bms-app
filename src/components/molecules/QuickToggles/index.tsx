import { QuickTogglesContainer, ToggleWithLabel } from './styles';

type QuickTogglesProps = {
  //
};

// eslint-disable-next-line no-empty-pattern
const QuickToggles = ({}: QuickTogglesProps) => {
  return (
    <QuickTogglesContainer>
      <ToggleWithLabel scale={3} data-label='Charge' />
      <ToggleWithLabel scale={3} type='error' data-label='Discharge' />
    </QuickTogglesContainer>
  );
};

export default QuickToggles;
