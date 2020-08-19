import { CleanWebpackPlugin } from "clean-webpack-plugin";
// @ts-ignore
import CreateFileWebpack from "create-file-webpack";
import path from "path";
import webpack from "webpack";

const src = path.resolve(__dirname, "src");
const destination = path.resolve(__dirname, "dist");
const isProduction = process.env.NODE_ENV === "production";

const config: webpack.Configuration = {
  mode: isProduction ? "production" : "none",
  entry: `${src}/index.ts`,
  output: {
    filename: "index.js",
    path: destination,
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: [
          {
            loader: "ts-loader",
          },
        ],
      },
    ],
  },
  plugins: [
    new CleanWebpackPlugin(),
    new CreateFileWebpack({
      path: "./dist",
      fileName: "global.js",
      content: "function create() {} function deleteTokens() {} function onOpen() {} function run() {} function setToken() {}",
    }),
  ],
};

export default config;
