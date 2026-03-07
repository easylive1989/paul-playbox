import js from '@eslint/js';

export default [
    js.configs.recommended,
    {
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: {
                // Browser globals
                window: 'readonly',
                document: 'readonly',
                console: 'readonly',
                setTimeout: 'readonly',
                setInterval: 'readonly',
                clearTimeout: 'readonly',
                clearInterval: 'readonly',
                requestAnimationFrame: 'readonly',
                Math: 'readonly',
                Infinity: 'readonly',
                // Phaser (loaded via CDN)
                Phaser: 'readonly',
            }
        },
        rules: {
            'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
        }
    },
    {
        ignores: ['node_modules/', 'tests/', 'docs/']
    }
];
