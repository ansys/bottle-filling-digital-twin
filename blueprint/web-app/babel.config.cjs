module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    '@babel/preset-typescript'
  ],
  plugins: [
    ['babel-plugin-transform-import-meta', {
      module: 'ES6'
    }]
  ],
  env: {
    test: {
      plugins: [
        ['babel-plugin-transform-import-meta', {
          module: 'ES6',
          getEnv: (name) => {
            const envMap = {
              'VITE_API_BASE_URL': 'http://localhost:8080/api',
              'DEV': true,
              'PROD': false,
              'MODE': 'test'
            };
            return envMap[name] || process.env[name];
          }
        }]
      ]
    }
  }
};