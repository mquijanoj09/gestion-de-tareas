import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}
interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div role="alert" className="m-6 rounded border border-red-300 bg-red-50 p-4 text-red-900">
          <h2 className="font-semibold">Algo salió mal</h2>
          <p className="text-sm">{this.state.error.message}</p>
        </div>
      );
    }
    return this.props.children;
  }
}
