import { Component } from 'react';
import styles from './Loading.module.css';

interface LoadingProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
}

class Loading extends Component<LoadingProps> {
  static defaultProps: Partial<LoadingProps> = {
    message: 'Loading...',
    size: 'medium',
  };

  render() {
    const { message, size } = this.props;

    return (
      <div className={`${styles.loading} ${styles[`loading--${size}`]}`}>
        <div className={styles.spinner} />
        <p className={styles.message}>{message}</p>
      </div>
    );
  }
}

export default Loading;
