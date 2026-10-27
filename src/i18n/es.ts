/**
 * Spanish strings: the source of truth for the dictionary shape. `en.ts` must
 * provide the same keys. Entries with `{ one, other }` are plurals selected by
 * the `count` param.
 */
export const es = {
  common: {
    back: "Volver",
    cancel: "Cancelar",
    delete: "Eliminar",
    edit: "Editar",
    retry: "Reintentar",
    or: "o",
    all: "Todos",
  },

  tabs: {
    home: "Inicio",
    routines: "Rutinas",
    exercises: "Ejercicios",
  },

  auth: {
    email: "Correo electrónico",
    emailPlaceholder: "tu@correo.com",
    password: "Contraseña",
    showPassword: "Mostrar contraseña",
    hidePassword: "Ocultar contraseña",
    login: {
      title: "BIENVENIDO DE VUELTA",
      subtitle: "Inicia sesión para continuar tu progreso",
      submit: "Iniciar sesión",
      createAccount: "Crear cuenta",
    },
    register: {
      title: "CREA TU CUENTA",
      subtitle: "Empieza a registrar tu progreso hoy",
      submit: "Registrarse",
      haveAccount: "Ya tengo cuenta",
      name: "Nombre",
      namePlaceholder: "Tu nombre",
      passwordPlaceholder: "Mín. 8 caracteres",
      confirmPassword: "Confirmar contraseña",
      confirmPasswordPlaceholder: "Repite tu contraseña",
      termsPrefix: "Al registrarte aceptas nuestros",
      terms: "Términos de uso",
      and: "y",
      privacy: "Política de privacidad",
      errors: {
        invalidEmail: "Ingresa un correo electrónico válido",
        passwordTooShort: "La contraseña debe tener al menos 8 caracteres",
        passwordMismatch: "Las contraseñas no coinciden",
      },
    },
  },

  home: {
    heading: "LISTO PARA\nENTRENAR",
    suggested: "Sugerida para hoy",
    yourRoutines: "Tus rutinas",
    start: "Empezar",
    startA11y: "Empezar {title}",
    go: "Ir",
    goA11y: "Iniciar {title}",
  },

  routines: {
    title: "RUTINAS",
    create: "Crear rutina",
    createFirst: "Crear tu primera rutina",
    empty: "Aún no tienes rutinas",
    loadError: "Hubo un error cargando tus rutinas",
    exercises: { one: "{count} ejercicio", other: "{count} ejercicios" },
    sheet: {
      newTitle: "NUEVA RUTINA",
      editTitle: "EDITAR RUTINA",
      name: "Nombre",
      namePlaceholder: "Upper, Chest Day, etc. ...",
      color: "Color",
      colorA11y: "Color {name}",
      create: "Crear rutina",
      save: "Guardar",
      delete: "Eliminar rutina",
      deleteConfirmTitle: "Eliminar rutina",
      deleteConfirmMessage:
        "¿Estás seguro de que quieres eliminar esta rutina? Esta acción no se puede deshacer.",
    },
    toast: {
      created: "Rutina creada",
      updated: "Rutina guardada",
      deleted: "Rutina eliminada",
    },
  },

  routineDetails: {
    editRoutine: "Editar rutina",
    addExercise: "Agregar ejercicio",
    empty: "Aún no has agregado ejercicios",
    emptyHint: "Agrega ejercicios para armar esta rutina",
    loadError: "Error al cargar los ejercicios",
    editExercise: "Editar {name}",
    deleteExercise: "Eliminar {name}",
    deleteExerciseHint: "Elimina este ejercicio de la rutina",
    deleteConfirmTitle: "Eliminar ejercicio",
    deleteConfirmMessage: '¿Eliminar "{name}" de la rutina?',
    setA11y: "Serie {n}, {reps} repeticiones",
    setA11yWithWeight: "Serie {n}, {reps} repeticiones, {weight} kg",
    reps: "{reps} reps",
    weight: "{weight} kg",
    toast: {
      setsSaved: "Series guardadas",
      exerciseRemoved: "Ejercicio eliminado",
    },
    picker: {
      title: "AGREGAR EJERCICIOS",
      searchPlaceholder: "Buscar ejercicio...",
      adding: "Agregando",
      alreadyAdded: "Ya agregado",
      add: "Agregar",
      addError: "Error al agregar",
      rowA11y: "{name}. {state}",
    },
  },

  sets: {
    reps: "REPS",
    kg: "KG",
    repsA11y: "Repeticiones",
    weightA11y: "Peso en kilogramos",
    deleteSet: "Eliminar serie {n}",
    addSet: "Agregar serie",
    save: "Guardar cambios",
    cancelA11y: "Cancelar edición",
    repsError: "Las repeticiones deben ser enteros mayores a 0",
    weightError: "El peso debe ser un número válido (≥ 0)",
  },

  exercises: {
    title: "EJERCICIOS",
    search: "Buscar",
    searchPlaceholder: "Buscar ejercicios...",
    noResults: "No se encontraron ejercicios",
    noResultsHint: "Prueba con otra búsqueda o quita los filtros",
    loadError: "No pudimos cargar los ejercicios",
  },

  exerciseDetails: {
    notFound: "No se encontró el ejercicio",
    technique: "Técnica",
  },

  workout: {
    title: "Entrenamiento",
    setsDone: "{done}/{total} series hechas",
    finish: "Terminar",
    next: "Siguiente",
    close: "Salir del entrenamiento",
    colSet: "SERIE",
    colWeight: "PESO (KG)",
    colReps: "REPS",
    weightA11y: "Peso de la serie {n}, en kilogramos",
    repsA11y: "Repeticiones de la serie {n}",
    doneA11y: "Serie {n} hecha",
    tabA11y: "{name}, ejercicio {n} de {total}",
    exerciseCounter: "EJERCICIO {n} DE {total}",
    gifA11y: "Demostración de {name}",
    addSet: "Agregar serie",
    removeLastSet: "Eliminar la última serie",
    loadError: "No pudimos cargar el entrenamiento",
    empty: "Este entrenamiento no tiene ejercicios",
    start: "Iniciar entrenamiento",
    resume: "Continuar entrenamiento",
    startError: "No se pudo iniciar el entrenamiento",
    emptyTitle: "Rutina sin ejercicios",
    emptyMessage:
      "{name} no tiene ejercicios. Agrega al menos uno para poder iniciarla.",
    addExercises: "Agregar ejercicios",
    inProgress: "Entrenamiento en progreso",
    continue: "Continuar",
    leaveTitle: "¿Salir del entrenamiento?",
    leaveMessage: "Puedes retomarlo después o descartarlo.",
    keepForLater: "Seguir después",
    discard: "Descartar entrenamiento",
    discardTitle: "Descartar entrenamiento",
    discardMessage:
      "Se borrará el progreso de este entrenamiento. Esta acción no se puede deshacer.",
    activeTitle: "Ya tienes un entrenamiento en curso",
    activeMessage:
      "{name} sigue abierto. Continúalo o descártalo para iniciar otro.",
    finishTitle: "Terminar entrenamiento",
    finishPending: {
      one: "Te queda {count} serie sin completar.",
      other: "Te quedan {count} series sin completar.",
    },
    keepTraining: "Seguir entrenando",
    finishAnyway: "Terminar de todos modos",
    toast: {
      saved: "Entrenamiento guardado",
      discarded: "Entrenamiento descartado",
      saveError: "No se pudo guardar el cambio",
    },
  },

  colors: {
    routineOne: "Lima",
    routineTwo: "Cian",
    routineThree: "Naranja",
    routineFour: "Violeta",
    routineFive: "Rosa",
    routineSix: "Menta",
    routineSeven: "Ámbar",
  },
};

type Widen<T> = T extends string ? string : { [K in keyof T]: Widen<T[K]> };

/** Shape every language file must satisfy. */
export type Translations = Widen<typeof es>;
