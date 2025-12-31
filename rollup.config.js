import typescript from '@rollup/plugin-typescript';
import { terser } from 'rollup-plugin-terser';
const pkg = require('./package.json');

export default [
  // ESM build
  {
    input: 'index.ts',
    output: {
      file: pkg.module,
      format: 'es',
      sourcemap: true
    },
    plugins: [typescript()]
  },
  // CommonJS build
  {
    input: 'index.ts',
    output: {
      file: pkg.main,
      format: 'cjs',
      sourcemap: true,
      exports: 'default'
    },
    plugins: [typescript()]
  },
  // UMD build
  {
    input: 'index.ts',
    output: {
      file: pkg.unpkg,
      format: 'umd',
      name: 'forMore',
      sourcemap: true,
      exports: 'default'
    },
    plugins: [typescript()]
  },
  // UMD minified build
  {
    input: 'index.ts',
    output: {
      file: pkg.unpkg.replace('.js', '.min.js'),
      format: 'umd',
      name: 'forMore',
      sourcemap: true,
      exports: 'default'
    },
    plugins: [typescript(), terser()]
  }
];