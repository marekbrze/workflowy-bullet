import type { Preview } from '@storybook/react-vite'
import '../src/index.css'

const preview: Preview = {
  globalTypes: {
    theme: {
      description: 'Theme',
      toolbar: {
        title: 'Theme',
        icon: 'circlehollow',
        items: [
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { theme: 'light' },
  decorators: [
    (Story, context) => {
      // The theme class lives on <html>, exactly as in the app.
      document.documentElement.classList.toggle('dark', context.globals.theme === 'dark')
      return Story()
    },
  ],
  parameters: {
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },
    a11y: {
      test: 'todo'
    }
  },
};

export default preview;
