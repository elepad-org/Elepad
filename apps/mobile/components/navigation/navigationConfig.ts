export type TabRoute = {
  key: string;
  title: string;
  focusedIcon: string;
  unfocusedIcon: string;
};

export const elderRoutes: TabRoute[] = [
  {
    key: "home",
    title: "Inicio",
    focusedIcon: "home",
    unfocusedIcon: "home-outline",
  },
  {
    key: "calendar",
    title: "Calendario",
    focusedIcon: "calendar-month",
    unfocusedIcon: "calendar-month-outline",
  },
  {
    key: "juegos",
    title: "Juegos",
    focusedIcon: "puzzle",
    unfocusedIcon: "puzzle-outline",
  },
  {
    key: "recuerdos",
    title: "Recuerdos",
    focusedIcon: "image-multiple",
    unfocusedIcon: "image-multiple-outline",
  },
];

export const nonElderRoutes: TabRoute[] = [
  {
    key: "home",
    title: "Inicio",
    focusedIcon: "home",
    unfocusedIcon: "home-outline",
  },
  {
    key: "calendar",
    title: "Calendario",
    focusedIcon: "calendar-month",
    unfocusedIcon: "calendar-month-outline",
  },
  {
    key: "juegos",
    title: "Estadísticas",
    focusedIcon: "chart-line",
    unfocusedIcon: "chart-line-variant",
  },
  {
    key: "recuerdos",
    title: "Recuerdos",
    focusedIcon: "image-multiple",
    unfocusedIcon: "image-multiple-outline",
  },
];
