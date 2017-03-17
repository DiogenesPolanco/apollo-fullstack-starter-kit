const VirtualModulePlugin = require('./virtual-module-plugin');
const ExtractGQL = require("persistgraphql/lib/src/ExtractGQL").ExtractGQL;
const fs = require('fs');

export default class Plugin {
  constructor(options) {
    this.options = options;
  }

  apply(compiler) {
    new VirtualModulePlugin({moduleName: 'node_modules/persisted_queries.js', contents: '{}'}).apply(compiler);

    compiler.plugin('compilation', compilation => {
      compilation.plugin('after-optimize-modules', modules => {
        let mapObj = {};
        let id = 1;

        modules.forEach(module => {
          if (module && module.resource && module.resource.endsWith('.graphql')) {
            const queries = new ExtractGQL({inputFilePath: module.resource})
              .createOutputMapFromString(fs.readFileSync(module.resource).toString());
            Object.keys(queries).forEach(query => {
              mapObj[query] = id++;
            });
          }
        });

        modules.forEach(module => {
          if (module.resource && module.resource.indexOf('persisted_queries') >= 0) {
            console.log("Replacing persisted queries with:", mapObj);
            module._source._value = "module.exports = " + JSON.stringify(mapObj);
          }
        });
      });
    });
  }
}