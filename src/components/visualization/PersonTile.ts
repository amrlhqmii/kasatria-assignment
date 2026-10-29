import { CSS3DObject } from "three/addons/renderers/CSS3DRenderer.js";
import type { Person } from "../../types/person";
import {
  formatNetWorth,
  getNetWorthColor,
} from "../../lib/dataParser";

function addText(
  parent: HTMLElement,
  className: string,
  value: string
): HTMLElement {
  const element = document.createElement("div");
  element.className = className;
  element.textContent = value;
  parent.appendChild(element);
  return element;
}

export function createPersonTile(
  person: Person,
): CSS3DObject {
  const tile = document.createElement("article");
  tile.className = "person-tile";
  tile.title = `${person.name} · ${person.age} years · ${person.country} · ${person.interest} · ${formatNetWorth(person.netWorth)}`;
  tile.style.setProperty(
    "--tile-color",
    getNetWorthColor(person.netWorth)
  );

  const meta = document.createElement("div");
  meta.className = "tile-meta";
  addText(meta, "tile-country", person.country);
  addText(meta, "tile-age", String(person.age));
  tile.appendChild(meta);

  const photo = document.createElement("div");
  photo.className = "tile-photo-wrap";
  const initials = addText(photo, "tile-initials", person.name.split(/\s+/).slice(0, 2).map((name) => name[0]).join(""));
  initials.setAttribute("aria-hidden", "true");

  const image = document.createElement("img");
  image.className = "tile-photo";
  image.alt = person.name;
  image.loading = "lazy";
  image.referrerPolicy = "no-referrer";

  // Only allow HTTPS image URLs.
  try {
    const url = new URL(person.photo);
    if (url.protocol === "https:") {
      image.src = url.href;
    }
  } catch {
    // Keep the placeholder when the URL is invalid.
  }

  image.onerror = () => {
    image.style.visibility = "hidden";
  };

  if (!image.hasAttribute("src")) image.style.visibility = "hidden";
  photo.appendChild(image);
  tile.appendChild(photo);

  addText(tile, "tile-name", person.name);

  addText(tile, "tile-interest", person.interest);

  addText(
    tile,
    "tile-worth",
    formatNetWorth(person.netWorth)
  );

  return new CSS3DObject(tile);
}
