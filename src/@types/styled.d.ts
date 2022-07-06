import 'styled-components';
import { GeistUIThemesPalette } from '@geist-ui/core/esm/themes';
declare module 'styled-components' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface DefaultTheme extends GeistUIThemesPalette {}
}
