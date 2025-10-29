module.exports = {
  '*.{js,jsx,ts,tsx}': ['npm run lint'],
  '*.{ts,tsx}': [() => 'npm run type-check'],
};
