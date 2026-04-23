//these are simply the contant values you might require again and again in the project. 

export const NOTE_MOODS = [
  "stressed",
  "fear",
  "calm",
  "cool",
  "nervous",
  "lovable",
  "mixed emotions",
  "romance",
  "normal",
  "passion",
  "relaxed",
  "very happy",
];

export const NOTE_VISIBILITIES = ["private", "public"];

export const EMPTY_AUTH_FORM = {
  name: "",
  email: "",
  password: "",
};

export const EMPTY_NOTE_FORM = {
  title: "",
  note: "",
  mood: "normal",
  visibility: "public",
};

export const EMPTY_FILTERS = {
  search: "",
  mood: "",
  sort: "-updatedAt",
  visibility: "private,public",
};
