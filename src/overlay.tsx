import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { PetOverlay } from "./components/PetOverlay";
import "./styles.css";

createRoot(document.getElementById("overlay-root") as HTMLElement).render(
  <StrictMode>
    <PetOverlay />
  </StrictMode>
);
