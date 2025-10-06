import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material';
import App from '../App';
import { store } from '../stores/store';
import theme from '../styles/theme';

describe('App', () => {
  it('should render the application title', () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <ThemeProvider theme={theme}>
            <App />
          </ThemeProvider>
        </BrowserRouter>
      </Provider>,
    );

    expect(screen.getByText('BI Platform')).toBeInTheDocument();
    expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
  });
});
