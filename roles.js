// Este archivo exporta un objeto que contiene la definición de todos los roles del juego.
// Cada rol tiene propiedades como su facción, objetivo, habilidades y prioridad de acción nocturna.

const ROLES = {
    // --- FACCIÓN PUEBLO ---
    'sheriff': {
        name: 'Sheriff',
        faction: 'pueblo',
        goal: 'Eliminar a toda la Mafia y a los Vampiros.',
        description: 'Cada noche, puedes investigar a un jugador para saber si "tiene un arma" (si es Mafia, Vampiro, Veterano o Guardaespaldas).',
        actionType: 'target', // Requiere seleccionar un objetivo
        actionPriority: 3, // Prioridad de información
        hasGun: false,
    },
    'medico': {
        name: 'Médico',
        faction: 'pueblo',
        goal: 'Eliminar a toda la Mafia y a los Vampiros.',
        description: 'Cada noche, elige a un jugador para protegerlo de la muerte. Puedes protegerte a ti mismo 2 veces.',
        actionType: 'target',
        actionPriority: 2, // Prioridad de protección
        initialState: { selfHeals: 2 },
        hasGun: false,
    },
    'guardaespaldas': {
        name: 'Guardaespaldas',
        faction: 'pueblo',
        goal: 'Eliminar a toda la Mafia y a los Vampiros.',
        description: 'Cada noche, elige a un jugador para proteger. Si es atacado, mueres en su lugar. Puedes protegerte a ti mismo 2 veces, siendo inmortal esas noches.',
        actionType: 'target',
        actionPriority: 2, // Prioridad de protección
        initialState: { selfGuards: 2 },
        hasGun: true,
    },
    'veterano': {
        name: 'Veterano',
        faction: 'pueblo',
        goal: 'Eliminar a toda la Mafia y a los Vampiros.',
        description: 'Puedes ponerte en "alerta" 3 veces por partida. Mientras estás en alerta, eres inmune y matas a cualquiera que te visite.',
        actionType: 'self', // Acción sobre sí mismo
        actionPriority: 2, // Se resuelve junto con las protecciones
        initialState: { alerts: 3 },
        hasGun: true,
    },
    'bruja': {
        name: 'Bruja',
        faction: 'pueblo',
        goal: 'Eliminar a toda la Mafia y a los Vampiros.',
        description: 'Tienes una poción para revivir a un jugador muerto. Se puede usar una sola vez por partida.',
        actionType: 'target_dead', // Requiere seleccionar un objetivo muerto
        actionPriority: 5, // Prioridad especial, se resuelve al final
        initialState: { potionUsed: false },
        hasGun: false,
    },
    'escort': {
        name: 'Escort',
        faction: 'pueblo',
        goal: 'Eliminar a toda la Mafia y a los Vampiros.',
        description: 'Cada noche, elige a un jugador para distraerlo, bloqueando su habilidad.',
        actionType: 'target',
        actionPriority: 1, // La más alta prioridad
        hasGun: false,
    },
    'pueblerino': { // Rol básico por si se necesitan más jugadores del pueblo
        name: 'Pueblerino',
        faction: 'pueblo',
        goal: 'Eliminar a toda la Mafia y a los Vampiros.',
        description: 'No tienes habilidades especiales, pero tu voto es crucial durante el día.',
        actionType: 'none',
        actionPriority: 99,
        hasGun: false,
    },

    // --- FACCIÓN MAFIA ---
    'mafia': {
        name: 'Mafioso',
        faction: 'mafia',
        goal: 'Conseguir que el número de mafiosos sea igual o mayor al de los demás jugadores vivos.',
        description: 'Cada noche, junto a tus compañeros, eliges a un jugador para eliminar.',
        actionType: 'target',
        actionPriority: 4, // Prioridad de asesinato
        hasGun: true,
    },

    // --- FACCIÓN VAMPIROS ---
    'vampiro': {
        name: 'Vampiro',
        faction: 'vampiros',
        goal: 'Conseguir que el número de vampiros sea igual o mayor al de los demás jugadores vivos.',
        description: 'Junto a tus compañeros, alternáis cada noche entre convertir a un jugador o matar a uno.',
        actionType: 'target',
        actionPriority: 4, // Prioridad de asesinato/conversión
        hasGun: true,
    },

    // --- FACCIÓN NEUTRAL ---
    'payaso': {
        name: 'Payaso',
        faction: 'neutral',
        goal: 'Tu objetivo es ser eliminado por votación durante el día.',
        description: 'Si consigues que el pueblo te linche, ganas la partida. Si te linchan, obtienes una habilidad de un solo uso para matar a alguien la noche siguiente.',
        actionType: 'none', // La habilidad de matar se activa bajo condición
        actionPriority: 4, // Si obtiene la habilidad de matar
        initialState: { canRevengeKill: false },
        hasGun: false,
    }
};

// Función para obtener la lista de roles para una partida según el número de jugadores
function getRoleListForPlayers(playerCount) {
    // Esta es una configuración de ejemplo. Se puede ajustar para balancear el juego.
    if (playerCount < 6) { // Modo local sin límite
        const roles = ['sheriff', 'medico', 'mafia', 'mafia', 'payaso', 'veterano', 'guardaespaldas', 'escort', 'vampiro', 'bruja'];
        return roles.slice(0, playerCount);
    }
    if (playerCount === 6) {
        return ['sheriff', 'medico', 'mafia', 'mafia', 'payaso', 'veterano'];
    }
    if (playerCount === 7) {
        return ['sheriff', 'medico', 'mafia', 'mafia', 'payaso', 'veterano', 'guardaespaldas'];
    }
    if (playerCount === 8) {
        return ['sheriff', 'medico', 'mafia', 'mafia', 'payaso', 'veterano', 'guardaespaldas', 'escort'];
    }
    if (playerCount === 9) {
        return ['sheriff', 'medico', 'mafia', 'mafia', 'vampiro', 'vampiro', 'payaso', 'veterano', 'guardaespaldas'];
    }
    if (playerCount >= 10) {
        return ['sheriff', 'medico', 'mafia', 'mafia', 'vampiro', 'vampiro', 'payaso', 'veterano', 'guardaespaldas', 'bruja'];
    }
    return [];
}
