import React from 'react';

const Logo = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: { width: 32, height: 32 },
    md: { width: 48, height: 48 },
    lg: { width: 64, height: 64 },
  };

  const { width, height } = sizes[size];

  return (
    <span className={`inline-flex skip-link-focus-ring outline-none ${className}`}>
      <img
        src="/images/logo.png"
        alt="YKA M.K.C CHOIR Logo"
        width={width}
        height={height}
        className="block object-contain"
        loading="lazy"
      />
    </span>
  );
};

export default Logo;
export { Logo };