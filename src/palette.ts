export type PaletteColor = Readonly<{id: string; name: string; hex: string}>;
// Figma Make palette: 21 equal RGB hue steps, not perceptually uniform.
export const palette: readonly PaletteColor[] = [
  {
    "id": "red",
    "name": "Red",
    "hex": "#FF0000"
  },
  {
    "id": "vermilion",
    "name": "Vermilion",
    "hex": "#FF4900"
  },
  {
    "id": "orange",
    "name": "Orange",
    "hex": "#FF9200"
  },
  {
    "id": "amber",
    "name": "Amber",
    "hex": "#FFDB00"
  },
  {
    "id": "yellow-lime",
    "name": "Yellow Lime",
    "hex": "#DBFF00"
  },
  {
    "id": "lime",
    "name": "Lime",
    "hex": "#92FF00"
  },
  {
    "id": "chartreuse",
    "name": "Chartreuse",
    "hex": "#49FF00"
  },
  {
    "id": "green",
    "name": "Green",
    "hex": "#00FF00"
  },
  {
    "id": "spring",
    "name": "Spring Green",
    "hex": "#00FF49"
  },
  {
    "id": "mint",
    "name": "Mint",
    "hex": "#00FF92"
  },
  {
    "id": "turquoise",
    "name": "Turquoise",
    "hex": "#00FFDB"
  },
  {
    "id": "cyan-blue",
    "name": "Cyan Blue",
    "hex": "#00DBFF"
  },
  {
    "id": "azure",
    "name": "Azure",
    "hex": "#0092FF"
  },
  {
    "id": "cobalt",
    "name": "Cobalt",
    "hex": "#0049FF"
  },
  {
    "id": "blue",
    "name": "Blue",
    "hex": "#0000FF"
  },
  {
    "id": "violet",
    "name": "Violet",
    "hex": "#4900FF"
  },
  {
    "id": "purple",
    "name": "Purple",
    "hex": "#9200FF"
  },
  {
    "id": "orchid",
    "name": "Orchid",
    "hex": "#DB00FF"
  },
  {
    "id": "fuchsia",
    "name": "Fuchsia",
    "hex": "#FF00DB"
  },
  {
    "id": "pink",
    "name": "Pink",
    "hex": "#FF0092"
  },
  {
    "id": "rose",
    "name": "Rose",
    "hex": "#FF0049"
  }
];
