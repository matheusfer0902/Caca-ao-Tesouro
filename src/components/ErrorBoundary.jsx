import { Component } from 'react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[Caça ao Tesouro]', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="error-fallback">
            <h2>Arr, algo deu errado no mar!</h2>
            <p>{this.state.error?.message || 'Erro desconhecido'}</p>
            <button
              type="button"
              className="custom-btn btn-search"
              onClick={() => window.location.reload()}
            >
              Recarregar expedição
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
