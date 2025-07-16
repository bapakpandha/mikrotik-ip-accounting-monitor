import React from 'react';

interface LoadingProps {
  message?: string;
  size?: number; // spinner size in pixels
}

const Loading: React.FC<LoadingProps> = ({ message = 'Loading...', size = 40 }) => {
  return (
    <div style={styles.container}>
      <div style={{ ...styles.spinner, width: size, height: size }} />
      <p style={styles.message}>{message}</p>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    padding: '1rem',
  },
  spinner: {
    border: '5px solid #f3f3f3',
    borderTop: '5px solid #3498db',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  message: {
    marginTop: '1rem',
    fontSize: '1rem',
    color: '#555',
  },
};

export default Loading;
