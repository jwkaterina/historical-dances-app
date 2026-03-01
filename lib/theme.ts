import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper'

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#6750a4',
    secondary: '#625b71',
    tertiary: '#7d5260',
    surface: '#fffbfe',
    background: '#f6f5f5',
  },
}

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#d0bcff',
    secondary: '#ccc2dc',
    tertiary: '#efb8c8',
  },
}
