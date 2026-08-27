import React from 'react';

const Logo = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: { width: 32, height: 32 },
    md: { width: 48, height: 48 },
    lg: { width: 64, height: 64 },
  };

  const { width, height } = sizes[size];

  return (
    <a
      href="/"
      className={`skip-link-focus-ring outline-none focus-visible:outline-focusRing ${className}`}
      aria-label="Choir MKC - Home"
    >
      <img
        src="/images/logo.png"
        alt="Choir MKC Logo"
        width={width}
        height={height}
        className="block object-contain"
        loading="lazy"
      />
    </a>
  );
};

export default Logo;
export { Logo };