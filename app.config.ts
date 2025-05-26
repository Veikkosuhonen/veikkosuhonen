import { defineConfig } from "@solidjs/start/config";
import glsl from 'vite-plugin-glsl';

export default defineConfig({
  vite: {
    plugins: [
      /* @ts-ignore */
      glsl({
        include: [                   // Glob pattern, or array of glob patterns to import
          '**/*.glsl', '**/*.wgsl',
          '**/*.vert', '**/*.frag',
          '**/*.vs', '**/*.fs'
        ],
        exclude: undefined,          // Glob pattern, or array of glob patterns to ignore
        warnDuplicatedImports: true, // Warn if the same chunk was imported multiple times
        defaultExtension: 'glsl',    // Shader suffix when no extension is specified
        compress: false,             // Compress output shader code
        watch: true,                 // Recompile shader on change
        root: '/'
      })
    ],
  }
});