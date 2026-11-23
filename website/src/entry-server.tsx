import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom";
import { SoundProvider } from "react-sounds";
import App from "./App";

/** Renders a page to HTML at build time, so crawlers that don't run JavaScript still see its content */
export function render(path: string) {
  return renderToString(
    <SoundProvider>
      <StaticRouter location={path}>
        <App />
      </StaticRouter>
    </SoundProvider>
  );
}
