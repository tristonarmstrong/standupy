import "./styles.css";
import { mount, signal } from "kaioken";
import { App } from "./App";

const root = document.getElementById("root")!;
mount(App, root);
