/* eslint-disable import/no-commonjs, filenames/match-regex */
module.exports = {
  transform: {
    "^.+\\.(js|jsx|mjs)$": require.resolve("./transform/babel.js"),
    "^.+\\.(css|sss|scss|sass)$": require.resolve("./transform/css.js"),
    "^.+\\.(graphql|gql)$": require.resolve("./transform/graphql.js"),
    "^(?!.*\\.(js|jsx|mjs|css|sss|scss|sass|json|graphql|gql)$)": require.resolve(
      "./transform/file.js"
    )
  },

  transformIgnorePatterns: [
    "node_modules/.+\\.(js|jsx|mjs)$",
    "^.+\\.module\\.css$"
  ],

  moduleNameMapper: {
    "^.+\\.module\\.css$": "identity-obj-proxy"
  },

  setupFiles: [
    require.resolve("./setup.js")
  ],

  collectCoverageFrom: [
    "src/**/*.js"
  ],

  coverageDirectory: "docs/coverage",

  coveragePathIgnorePatterns: [
    // NPM packages
    "/node_modules/",

    // Publish Export Entries
    "src/index.js",
    "src/client.js",
    "src/server.js",
    "src/binary.js",
    "src/dev.js",

    // Webpack Entry Points
    "/client/",
    "/server/",

    // Application Glue Code
    "src/App.js",
    "src/Main.js",
    "src/State.js",
    "src/Init.js",

    // Views aka Route Entry Points
    "/views/",

    // Storybook Stories
    ".story.js",

    // Jest Tests
    ".test.js"
  ],

  coverageReporters: [
    "lcov",
    "json-summary",
    "json",
    "text"
  ]
}
