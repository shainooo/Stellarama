import { extendTheme, type ThemeConfig } from '@chakra-ui/react';

const config: ThemeConfig = {
  initialColorMode: 'dark',
  useSystemColorMode: false,
};

const glassSurface = {
  bg: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid',
  borderColor: 'whiteAlpha.200',
  boxShadow: '0 24px 80px rgba(0, 0, 0, 0.35)',
  backdropFilter: 'blur(22px)',
};

const theme = extendTheme({
  config,
  fonts: {
    heading: `'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`,
    body: `'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`,
  },
  colors: {
    void: {
      900: '#030712',
      800: '#07111F',
      700: '#0B1220',
    },
    brand: {
      50: '#F3EFFF',
      100: '#DDD0FF',
      200: '#C4ADFF',
      300: '#A78BFA',
      400: '#9B6DFF',
      500: '#8B5CF6',
      600: '#7C3AED',
      700: '#6D28D9',
      800: '#5B21B6',
      900: '#3B0764',
    },
    secondary: {
      50: '#ECFEFF',
      100: '#CFFAFE',
      200: '#A5F3FC',
      300: '#67E8F9',
      400: '#22D3EE',
      500: '#06B6D4',
      600: '#0891B2',
      700: '#0E7490',
      800: '#155E75',
      900: '#164E63',
    },
    accent: {
      50: '#FDF2F8',
      100: '#FCE7F3',
      200: '#FBCFE8',
      300: '#F9A8D4',
      400: '#F472B6',
      500: '#EC4899',
      600: '#DB2777',
      700: '#BE185D',
      800: '#9D174D',
      900: '#831843',
    },
    success: {
      50: '#ECFDF5',
      100: '#D1FAE5',
      200: '#A7F3D0',
      300: '#6EE7B7',
      400: '#34D399',
      500: '#10B981',
      600: '#059669',
      700: '#047857',
      800: '#065F46',
      900: '#064E3B',
    },
  },
  styles: {
    global: {
      'html, body': {
        background: '#030712',
        color: 'whiteAlpha.900',
        fontFamily: 'body',
      },
      body: {
        minHeight: '100vh',
      },
      '#root': {
        minHeight: '100vh',
        background:
          'radial-gradient(circle at 12% 8%, rgba(139, 92, 246, 0.22), transparent 28%), radial-gradient(circle at 88% 12%, rgba(6, 182, 212, 0.18), transparent 28%), #030712',
      },
      '::selection': {
        background: 'rgba(139, 92, 246, 0.55)',
        color: 'white',
      },
      '*::placeholder': {
        color: 'whiteAlpha.500',
      },
      a: {
        color: 'inherit',
      },
    },
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: '700',
        borderRadius: 'full',
        transition: 'all 0.25s ease',
        _focusVisible: {
          boxShadow: '0 0 0 3px rgba(6, 182, 212, 0.55)',
        },
      },
      variants: {
        solid: (props: any) => {
          const { colorScheme } = props;
          if (colorScheme === 'brand' || colorScheme === 'green' || colorScheme === 'blue') {
            return {
              bg: 'linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%)',
              color: 'white',
              boxShadow: '0 0 28px rgba(139, 92, 246, 0.36)',
              _hover: {
                bg: 'linear-gradient(135deg, #9B6DFF 0%, #22D3EE 100%)',
                transform: 'translateY(-2px)',
                boxShadow: '0 0 38px rgba(6, 182, 212, 0.42)',
                _disabled: {
                  transform: 'none',
                  boxShadow: 'none',
                },
              },
              _active: {
                transform: 'translateY(0)',
              },
            };
          }
          return {};
        },
        outline: {
          borderColor: 'whiteAlpha.300',
          color: 'whiteAlpha.900',
          bg: 'rgba(255, 255, 255, 0.04)',
          _hover: {
            bg: 'rgba(255, 255, 255, 0.08)',
            borderColor: 'secondary.300',
          },
        },
        ghost: {
          color: 'whiteAlpha.800',
          _hover: {
            bg: 'whiteAlpha.100',
            color: 'white',
          },
        },
      },
      sizes: {
        lg: {
          h: '56px',
          fontSize: 'md',
          px: 8,
        },
      },
    },
    Input: {
      variants: {
        outline: {
          field: {
            bg: 'rgba(255, 255, 255, 0.06)',
            borderColor: 'whiteAlpha.200',
            borderWidth: '1px',
            borderRadius: 'xl',
            color: 'white',
            _hover: {
              borderColor: 'secondary.400',
            },
            _focus: {
              borderColor: 'secondary.300',
              boxShadow: '0 0 0 3px rgba(6, 182, 212, 0.18)',
            },
          },
        },
      },
      defaultProps: {
        variant: 'outline',
      },
    },
    NumberInput: {
      defaultProps: {
        variant: 'outline',
      },
    },
    Select: {
      variants: {
        outline: {
          field: {
            bg: 'rgba(255, 255, 255, 0.06)',
            borderColor: 'whiteAlpha.200',
            color: 'white',
            _hover: {
              borderColor: 'secondary.400',
            },
            _focus: {
              borderColor: 'secondary.300',
              boxShadow: '0 0 0 3px rgba(6, 182, 212, 0.18)',
            },
          },
          icon: {
            color: 'whiteAlpha.700',
          },
        },
      },
    },
    Heading: {
      baseStyle: {
        color: 'white',
        fontWeight: '900',
        letterSpacing: '-0.02em',
      },
    },
    Alert: {
      baseStyle: {
        container: {
          ...glassSurface,
          color: 'whiteAlpha.900',
          borderRadius: 'xl',
        },
      },
    },
    Menu: {
      baseStyle: {
        list: {
          ...glassSurface,
          bg: 'rgba(3, 7, 18, 0.92)',
          color: 'whiteAlpha.900',
          p: 2,
        },
        item: {
          bg: 'transparent',
          borderRadius: 'lg',
          _hover: {
            bg: 'whiteAlpha.100',
          },
          _focus: {
            bg: 'whiteAlpha.100',
          },
        },
      },
    },
  },
  shadows: {
    glass: '0 24px 80px rgba(0, 0, 0, 0.35)',
    'glass-lg': '0 32px 120px rgba(0, 0, 0, 0.45)',
    glow: '0 0 32px rgba(139, 92, 246, 0.45)',
    cyan: '0 0 30px rgba(6, 182, 212, 0.35)',
    accent: '0 0 30px rgba(236, 72, 153, 0.35)',
  },
  radii: {
    '2xl': '1rem',
    '3xl': '1.5rem',
  },
});

export default theme;
