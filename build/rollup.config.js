import { nodeResolve } from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import { terser } from 'rollup-plugin-terser';
import typescript from '@rollup/plugin-typescript';
import pkg from '../package.json';

const BASE = {
    input: 'src/index.ts',
    external: ['prosemirror-state', 'prosemirror-model', 'prosemirror-transform', 'prosemirror-collab'],
    plugins: {
        customResolver: nodeResolve({
            extensions: ['.js', '.jsx', '.ts', '.tsx'],
        }),
        replace: {
            'process.env.NODE_ENV': JSON.stringify('production'),
        }
    }
};

const UMD = {
    ...BASE,
    output: {
        compact: true,
        format: 'umd',
        name: 'FirebaseEditor',
        exports: 'auto',
        file: 'dist/index.umd.js'
    },
    plugins: [
        replace(BASE.plugins.replace),
        typescript(),
        terser(),
    ],
};

const ESM = {
    ...BASE,
    output: {
        compact: true,
        format: 'esm',
        dir: 'dist/esm',
        exports: 'named',
    },
    plugins: [
        replace(BASE.plugins.replace),
        typescript({
            declaration: true,
            declarationDir: 'dist/esm/types',
            rootDir: 'src/',
        }),
    ],
};

const CJS = {
    ...BASE,
    output: {
        compact: true,
        file: 'dist/index.js',
        format: 'cjs',
        name: 'FirebaseEditor',
        exports: 'auto',
    },
    plugins: [
        replace(BASE.plugins.replace),
        typescript(),
        terser(),
    ],
}

export default [ ESM, UMD, CJS ];