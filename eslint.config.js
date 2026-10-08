import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';

// Pārbauda kodu pret JavaScript pamatnoteikumiem un React noteikumiem
// (Rules of Hooks un "komponentēm jābūt tīrām" noteikumi no eslint-plugin-react-hooks).
export default [
    { ignores: ['dist/**', 'node_modules/**'] },
    js.configs.recommended,
    react.configs.flat.recommended,
    react.configs.flat['jsx-runtime'],
    reactHooks.configs.flat['recommended-latest'],
    {
        files: ['**/*.{js,jsx}'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: globals.browser,
        },
        settings: { react: { version: 'detect' } },
        rules: {
            'react/prop-types': 'off', // projektā nav PropTypes; props ir vienkārši objekti
            'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
        },
    },
    {
        // Konfigurācijas faili darbojas Node vidē, nevis pārlūkā
        files: ['*.config.js'],
        languageOptions: { globals: globals.node },
    },
];
