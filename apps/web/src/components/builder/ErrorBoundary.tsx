import React from 'react';

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: unknown) {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.error('Builder error:', error, info);
    }
  }

  render() {
    if (this.state.hasError) {
      return <div role="alert">Something went wrong in the builder.</div>;
    }
    return this.props.children;
  }
}
