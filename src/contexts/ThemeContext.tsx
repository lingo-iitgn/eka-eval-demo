// src/context/ThemeContext.tsx
import React, { useEffect } from 'react';

const LIGHT = `
  --bg:           #f5f0e8;
  --bg-card:      #fdf9f4;
  --ink:          #2c2416;
  --ink-muted:    #7a6e62;
  --ink-faint:    #b0a898;
  --border:       #e0d8cc;
  --border-md:    #d0c8bc;

  --sage:         #7a9e7e;
  --sage-lt:      #d4e8d6;
  --sage-bd:      #aed0b2;
  --sage-deep:    #3d6b42;
  --sage-pill:    #eaf2eb;

  --rose:         #c9867c;
  --rose-lt:      #f5dbd8;
  --rose-bd:      #ddb4ae;
  --rose-deep:    #8f3d35;
  --rose-pill:    #faeeed;

  --ochre:        #c9a96e;
  --ochre-lt:     #f5e8cc;
  --ochre-bd:     #e0c888;
  --ochre-deep:   #7a5218;
  --ochre-pill:   #faf3e5;

  --slate:        #6b7b8d;
  --slate-lt:     #d4dde8;
  --slate-bd:     #b0c0d0;
  --slate-deep:   #3d5068;
  --slate-pill:   #edf1f5;

  --mauve:        #a07ab8;
  --mauve-lt:     #e8d8f0;
  --mauve-bd:     #c8a8d8;
  --mauve-deep:   #5c3a72;
  --mauve-pill:   #f4eef9;

  --teal:         #7ab8b0;
  --teal-lt:      #d4ede8;
  --teal-bd:      #8ed4bc;
  --teal-deep:    #2d6b62;
  --teal-pill:    #eaf7f4;
`;

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    const id = 'japandi-vars';
    let el = document.getElementById(id) as HTMLStyleElement | null;
    if (!el) {
      el = document.createElement('style');
      el.id = id;
      document.head.prepend(el);
    }
    el.textContent = `:root { ${LIGHT} }`;
    document.documentElement.setAttribute('data-theme', 'light');
    document.documentElement.classList.remove('dark');
    document.body.style.background = '#f5f0e8';
    document.body.style.color = '#2c2416';
  }, []);

  return <>{children}</>;
};

export default ThemeProvider;