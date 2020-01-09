import path from "path";
import webpack from "webpack";
import { CleanWebpackPlugin } from "clean-webpack-plugin";
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import GasPlugin from "gas-webpack-plugin";

const src = path.resolve(__dirname, "src");
const destination = path.resolve(__dirname, "dist");
const isProduction = process.env.NODE_ENV === "production";

const config: webpack.Configuration = {
  mode: isProduction ? "production" : "none",
  entry: `${src}/indexGAS.ts`,
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
        test: /\.js$/,
        use: [
          {
            loader: "babel-loader",
            options: {
              presets: ["@kenchan0130/babel-preset-google-apps-script"],
            },
          },
        ],
      },
      {
        test: /\.ts$/,
        use: [
          {
            loader: "babel-loader",
            options: {
              presets: ["@kenchan0130/babel-preset-google-apps-script"],
            },
          },
          {
            loader: "ts-loader",
            options: {
              configFile: "tsconfig.gas.json",
            },
          },
        ],
      },
    ],
  },
  plugins: [
    new CleanWebpackPlugin(),
    new GasPlugin(),
  ],
};

export default config;
