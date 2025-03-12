// @refresh reload
import { Suspense } from "solid-js"
import NavBar from "./components/NavBar"
import "./app.css"
import { Footer } from "./components/Footer"
import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";

export default function Root() {
  return (
    <Router
      root={props => (
        <div class="flex flex-col h-[100vh] text-slate-100 font-sans">
          <NavBar />
          <Suspense>{props.children}</Suspense>
          <Footer />
        </div>
      )}
    >
      <FileRoutes />
    </Router>
  );
}
