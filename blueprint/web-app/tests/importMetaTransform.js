// Jest transformer to handle import.meta
const { transform } = require('@babel/core');

module.exports = {
  process(src, filename) {
    // Replace import.meta.env with process.env equivalent for Jest
    const transformedSrc = src.replace(
      /import\.meta\.env\.(\w+)/g,
      (match, envVar) => {
        // Map common Vite env vars to test values
        const envMap = {
          'VITE_API_BASE_URL': '"http://localhost:8080/api"',
          'DEV': 'true',
          'PROD': 'false',
          'MODE': '"test"'
        };
        return envMap[envVar] || `process.env.${envVar}`;
      }
    );

    // Also handle import.meta.env directly
    const finalSrc = transformedSrc.replace(
      /import\.meta\.env/g,
      JSON.stringify({
        VITE_API_BASE_URL: 'http://localhost:8080/api',
        DEV: true,
        PROD: false,
        MODE: 'test'
      })
    );

    return {
      code: finalSrc,
    };
  },
};