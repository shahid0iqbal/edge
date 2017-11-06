import { resolve } from "path"
import { readJsonSync } from "fs-extra"
import builtinModules from "builtin-modules"
import resolvePkg from "resolve-pkg"

const BuiltIns = new Set(builtinModules)
const WebpackEnvRequired = new Set([
  // Required for react-universal-component's handling
  "react-universal-component",
  "webpack-flush-chunks",
  "babel-plugin-universal-import"
])

const Problematic = new Set([
  // "intl" is included in one block with complete data. No reason for bundle everything here.
  "intl",

  // "mime-db" database for working with mime types. Naturally pretty large stuff.
  "mime-db",

  // "encoding" uses dynamic iconv loading
  "encoding",

  // Native code module helper
  "node-gyp",
  "node-pre-gyp",

  // These packages make use of dynamic require expressions which do not work well with Webpack
  "ajv",
  "colors",
  "express",
  "jsdom"
])

export function isLoaderSpecificFile(request) {
  // Webpack Loader Syntax
  if (request.charAt(0) === "!") {
    return true
  }

  return Boolean(
    // eslint-disable-next-line max-len
    /\.(eot|woff|woff2|ttf|otf|svg|png|jpg|jpeg|gif|webp|webm|ico|mp4|mp3|ogg|html|pdf|swf|css|scss|sass|sss|less)$/.exec(
      request
    )
  )
}

const bundleCache = {}

export function shouldBeBundled(basename) {
  if (basename in bundleCache) {
    return bundleCache[basename]
  }

  let resolved
  try {
    resolved = resolvePkg(basename)
  } catch (error) {
    return null
  }

  var json
  try {
    json = readJsonSync(resolve(resolved, "package.json"))
  } catch (error) {
    // pass
  }

  // Implement default action
  let result = null

  if (json) {
    if (json.module || json.style || json["jsnext:main"]) {
      result = true
    }

    // Configuration for Node-Pre-Gyp
    // See also: https://www.npmjs.com/package/node-pre-gyp
    if (json.binary != null) {
      result = false
    }
  }

  bundleCache[basename] = result
  return result
}

export function getServerExternals(useLightBundle, entries) {
  const entriesSet = new Set(entries)

  // We can't influence a public interface
  // eslint-disable-next-line max-params
  return (context, request, callback) => {
    var basename = request.split("/")[0]

    // Externalize built-in modules
    if (BuiltIns.has(basename)) {
      return callback(null, `commonjs ${request}`)
    }

    // Make sure to include entries
    if (entriesSet.has(request)) {
      return callback()
    }

    // Ignore all inline files for further processing
    if (basename.charAt(0) === ".") {
      return callback()
    }

    // Inline all files which are dependend on Webpack loaders e.g. CSS, images, etc.
    if (isLoaderSpecificFile(request)) {
      return callback()
    }

    // Inline all modules which require a Webpack environment
    if (WebpackEnvRequired.has(basename)) {
      return callback()
    }

    // Make sure that problematic CommonJS code is externalized
    if (Problematic.has(basename)) {
      return callback(null, `commonjs ${request}`)
    }

    // Analyses remaining packages whether these offer ES2015 bundles
    // and/or include native extensions via Gyp. We try to bundle all
    // ES2015 modules as it is better for tree-shaking. We can't bundle
    // any modules which contain binary code. If neither of these two is
    // true we just follow the wishes of the user regarding bundling
    // lightweight or heavyweight to include the maximum amount or least
    // amount of modules feasible.
    const bundle = shouldBeBundled(basename)
    if (bundle != null) {
      return bundle ? callback() : callback(null, `commonjs ${request}`)
    }

    // Finally we respect the user given preference
    return useLightBundle ? callback(null, `commonjs ${request}`) : callback()
  }
}