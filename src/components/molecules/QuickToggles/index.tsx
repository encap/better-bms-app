import { memo } from 'react';
import { QuickTogglesContainer, ToggleWithLabel } from './styles';

type QuickTogglesProps = {
  //
};

// eslint-disable-next-line no-empty-pattern
const QuickToggles = ({}: QuickTogglesProps) => {
  return (
    <QuickTogglesContainer>
      <ToggleWithLabel initialChecked scale={3} data-label='Charge' />
      <ToggleWithLabel initialChecked scale={3} type='error' data-label='Discharge' />
    </QuickTogglesContainer>
  );
};

export default memo(QuickToggles);
