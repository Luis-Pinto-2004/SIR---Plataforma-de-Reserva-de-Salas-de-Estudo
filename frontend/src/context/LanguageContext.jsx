import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const translations = {
  pt: {
    nav: {
      dashboard: 'Dashboard',
      createBooking: 'Criar reserva',
      myHistory: 'O meu histórico',
      admin: 'Admin',
      logout: 'Sair'
    },

    login: {
      title: 'Entrar',
      description: 'Inicie sessão para aceder às suas reservas.',
      emailLabel: 'Email',
      emailPlaceholder: 'email@exemplo.com',
      passwordLabel: 'Palavra-passe',
      passwordPlaceholder: '••••••••',
      button: 'Entrar',
      loading: 'A entrar...',
      link: {
        register: 'Criar conta',
        forgot: 'Esqueci-me da palavra-passe'
      },
      toast: {
        success: 'Sessão iniciada',
        error: 'Falha ao iniciar sessão'
      }
    },

    register: {
      title: 'Criar conta',
      description: 'Crie uma conta para reservar salas e equipamentos.',
      nameLabel: 'Nome',
      namePlaceholder: 'O seu nome',
      emailLabel: 'Email',
      emailPlaceholder: 'email@exemplo.com',
      passwordLabel: 'Palavra-passe',
      passwordPlaceholder: 'Mínimo 6 caracteres',
      button: 'Criar conta',
      loading: 'A criar...',
      link: {
        login: 'Voltar ao login'
      },
      toast: {
        success: 'Conta criada',
        error: 'Falha no registo'
      }
    },

    forgot: {
      title: 'Recuperar palavra-passe',
      description: 'Introduza o seu email para gerar um código de recuperação.',
      emailLabel: 'Email',
      emailPlaceholder: 'email@exemplo.com',
      button: 'Gerar código',
      loading: 'A gerar...',
      tokenLabel: 'Código de recuperação',
      openReset: 'Abrir página de redefinição',
      back: 'Voltar ao login',
      success: 'Se o email existir, foi criado um código de recuperação.'
    },

    reset: {
      title: 'Redefinir palavra-passe',
      description: 'Introduza o código de recuperação e defina uma nova palavra-passe.',
      tokenLabel: 'Código de recuperação',
      tokenPlaceholder: 'código...',
      passwordLabel: 'Nova palavra-passe',
      passwordPlaceholder: 'Mínimo 6 caracteres',
      button: 'Atualizar palavra-passe',
      loading: 'A atualizar...',
      back: 'Voltar ao login'
    },

    dashboard: {
      title: 'Dashboard',
      description: 'Disponibilidade atualizada automaticamente.',
      searchPlaceholder: 'Pesquisar por nome, localização ou categoria...',
      statusFilter: {
        all: 'Todos os estados',
        available: 'Disponível',
        occupied: 'Ocupado agora',
        maintenance: 'Manutenção',
        disabled: 'Indisponível'
      },
      tabs: {
        all: 'Tudo',
        rooms: 'Salas',
        equipment: 'Equipamento'
      },
      reload: 'Recarregar',
      loading: 'A carregar...',
      section: {
        rooms: 'Salas',
        equipment: 'Equipamento'
      },
      itemsSuffix: 'itens',
      toast: {
        created: 'Reserva criada',
        cancelled: 'Reserva cancelada',
        updated: 'Reserva atualizada',
        socketUnauthorized: 'Sessão expirada. Inicie sessão novamente.'
      }
    },

    resource: {
      capacityLabel: 'Capacidade',
      categoryLabel: 'Categoria',
      reserveButton: 'Reservar',
      idLabel: 'ID'
    },

    status: {
      available: 'Disponível',
      occupied: 'Ocupado',
      maintenance: 'Manutenção',
      disabled: 'Indisponível'
    },

    bookingForm: {
      title: {
        create: 'Criar reserva',
        edit: 'Editar reserva'
      },
      description: 'Escolha o recurso e o período pretendido.',
      back: 'Voltar',
      loading: 'A carregar...',
      typeLabel: 'Tipo',
      type: {
        room: 'Sala',
        equipment: 'Equipamento'
      },
      editTypeInfo: 'Ao editar, não é possível alterar o tipo de recurso.',
      resourceLabel: 'Recurso',
      resourcePlaceholder: '— escolher —',
      availableOnlyInfo: 'Apenas recursos com estado Disponível podem ser reservados.',
      startLabel: 'Data/Hora início',
      endLabel: 'Data/Hora fim',
      save: {
        create: 'Criar reserva',
        edit: 'Guardar alterações',
        loading: 'A guardar...'
      },
      goToHistory: 'Ir para histórico',
      toast: {
        created: 'Reserva criada',
        updated: 'Reserva atualizada',
        conflict: 'Conflito: existe uma reserva sobreposta'
      },
      error: 'Falha',
      chooseResourceError: 'Escolha um recurso',
      notFound: 'Reserva não encontrada (ou sem permissão)'
    },

    history: {
      title: 'O meu histórico',
      description: 'Filtre por datas e estado das reservas.',
      filter: {
        status: {
          all: 'Todos',
          confirmed: 'Confirmadas',
          pending: 'Pendentes',
          cancelled: 'Canceladas'
        },
        apply: 'Aplicar'
      },
      loading: 'A carregar...',
      none: 'Sem reservas.',
      resourceLabel: 'Recurso:',
      editButton: 'Editar',
      cancelButton: 'Cancelar',
      confirmCancelPrompt: 'Cancelar esta reserva?',
      toast: {
        cancelled: 'Reserva cancelada',
        error: 'Falha'
      }
    },

    admin: {
      title: 'Admin',
      description: 'Gestão de salas, equipamentos e reservas.',
      tabs: {
        resources: 'Recursos',
        bookings: 'Reservas'
      },
      reload: 'Recarregar',
      loading: 'A carregar...',
      sections: {
        rooms: 'Salas',
        equipment: 'Equipamento',
        allBookings: 'Todas as reservas'
      },
      filter: {
        status: {
          all: 'Todos os estados',
          confirmed: 'Confirmadas',
          pending: 'Pendentes',
          cancelled: 'Canceladas'
        },
        type: {
          all: 'Todos os tipos',
          room: 'Sala',
          equipment: 'Equipamento'
        },
        apply: 'Aplicar'
      },
      createRoom: {
        title: 'Criar sala',
        namePlaceholder: 'Nome',
        locationPlaceholder: 'Localização',
        button: 'Criar'
      },
      roomRow: {
        save: 'Guardar',
        cancel: 'Cancelar',
        edit: 'Editar',
        delete: 'Eliminar'
      },
      createEquipment: {
        title: 'Criar equipamento',
        namePlaceholder: 'Nome',
        categoryPlaceholder: 'Categoria',
        button: 'Criar'
      },
      equipmentRow: {
        save: 'Guardar',
        cancel: 'Cancelar',
        edit: 'Editar',
        delete: 'Eliminar'
      },
      bookingRow: {
        userLabel: 'Utilizador:',
        save: 'Guardar',
        close: 'Fechar',
        adjust: 'Ajustar',
        cancel: 'Cancelar'
      },
      confirm: {
        deleteRoom: 'Eliminar esta sala?',
        deleteEquipment: 'Eliminar este equipamento?',
        cancelBooking: 'Cancelar esta reserva?'
      },
      toast: {
        roomCreated: 'Sala criada',
        roomUpdated: 'Sala atualizada',
        roomDeleted: 'Sala eliminada',
        equipmentCreated: 'Equipamento criado',
        equipmentUpdated: 'Equipamento atualizado',
        equipmentDeleted: 'Equipamento eliminado',
        bookingUpdated: 'Reserva atualizada',
        bookingCancelled: 'Reserva cancelada',
        conflict: 'Conflito de datas/recurso'
      },
      error: {
        load: 'Falha ao carregar'
      }
    },

    general: {
      errorLoad: 'Falha ao carregar',
      failure: 'Falha'
    }
  },

  es: {
    nav: {
      dashboard: 'Dashboard',
      createBooking: 'Crear reserva',
      myHistory: 'Mi historial',
      admin: 'Admin',
      logout: 'Salir'
    },

    login: {
      title: 'Iniciar sesión',
      description: 'Inicia sesión para acceder a tus reservas.',
      emailLabel: 'Email',
      emailPlaceholder: 'email@ejemplo.com',
      passwordLabel: 'Contraseña',
      passwordPlaceholder: '••••••••',
      button: 'Entrar',
      loading: 'Entrando...',
      link: {
        register: 'Crear cuenta',
        forgot: 'He olvidado mi contraseña'
      },
      toast: {
        success: 'Sesión iniciada',
        error: 'No se pudo iniciar sesión'
      }
    },

    register: {
      title: 'Crear cuenta',
      description: 'Crea una cuenta para reservar salas y equipamiento.',
      nameLabel: 'Nombre',
      namePlaceholder: 'Tu nombre',
      emailLabel: 'Email',
      emailPlaceholder: 'email@ejemplo.com',
      passwordLabel: 'Contraseña',
      passwordPlaceholder: 'Mínimo 6 caracteres',
      button: 'Crear cuenta',
      loading: 'Creando...',
      link: {
        login: 'Volver al inicio de sesión'
      },
      toast: {
        success: 'Cuenta creada',
        error: 'No se pudo registrar'
      }
    },

    forgot: {
      title: 'Recuperar contraseña',
      description: 'Introduce tu email para generar un código de recuperación.',
      emailLabel: 'Email',
      emailPlaceholder: 'email@ejemplo.com',
      button: 'Generar código',
      loading: 'Generando...',
      tokenLabel: 'Código de recuperación',
      openReset: 'Abrir página de restablecimiento',
      back: 'Volver al inicio de sesión',
      success: 'Si el email existe, se ha creado un código de recuperación.'
    },

    reset: {
      title: 'Restablecer contraseña',
      description: 'Introduce el código de recuperación y define una nueva contraseña.',
      tokenLabel: 'Código de recuperación',
      tokenPlaceholder: 'código...',
      passwordLabel: 'Nueva contraseña',
      passwordPlaceholder: 'Mínimo 6 caracteres',
      button: 'Actualizar contraseña',
      loading: 'Actualizando...',
      back: 'Volver al inicio de sesión'
    },

    dashboard: {
      title: 'Dashboard',
      description: 'La disponibilidad se actualiza automáticamente.',
      searchPlaceholder: 'Buscar por nombre, ubicación o categoría...',
      statusFilter: {
        all: 'Todos los estados',
        available: 'Disponible',
        occupied: 'Ocupado ahora',
        maintenance: 'Mantenimiento',
        disabled: 'No disponible'
      },
      tabs: {
        all: 'Todo',
        rooms: 'Salas',
        equipment: 'Equipamiento'
      },
      reload: 'Recargar',
      loading: 'Cargando...',
      section: {
        rooms: 'Salas',
        equipment: 'Equipamiento'
      },
      itemsSuffix: 'elementos',
      toast: {
        created: 'Reserva creada',
        cancelled: 'Reserva cancelada',
        updated: 'Reserva actualizada',
        socketUnauthorized: 'Sesión caducada. Inicia sesión de nuevo.'
      }
    },

    resource: {
      capacityLabel: 'Capacidad',
      categoryLabel: 'Categoría',
      reserveButton: 'Reservar',
      idLabel: 'ID'
    },

    status: {
      available: 'Disponible',
      occupied: 'Ocupado',
      maintenance: 'Mantenimiento',
      disabled: 'No disponible'
    },

    bookingForm: {
      title: {
        create: 'Crear reserva',
        edit: 'Editar reserva'
      },
      description: 'Elige el recurso y el periodo que necesitas.',
      back: 'Volver',
      loading: 'Cargando...',
      typeLabel: 'Tipo',
      type: {
        room: 'Sala',
        equipment: 'Equipamiento'
      },
      editTypeInfo: 'Al editar, no se puede cambiar el tipo de recurso.',
      resourceLabel: 'Recurso',
      resourcePlaceholder: '— seleccionar —',
      availableOnlyInfo: 'Solo se pueden reservar recursos con estado Disponible.',
      startLabel: 'Fecha/hora inicio',
      endLabel: 'Fecha/hora fin',
      save: {
        create: 'Crear reserva',
        edit: 'Guardar cambios',
        loading: 'Guardando...'
      },
      goToHistory: 'Ir al historial',
      toast: {
        created: 'Reserva creada',
        updated: 'Reserva actualizada',
        conflict: 'Conflicto: existe una reserva superpuesta'
      },
      error: 'Error',
      chooseResourceError: 'Elige un recurso',
      notFound: 'Reserva no encontrada (o no tienes permiso)'
    },

    history: {
      title: 'Mi historial',
      description: 'Filtra por fechas y estado de las reservas.',
      filter: {
        status: {
          all: 'Todos',
          confirmed: 'Confirmadas',
          pending: 'Pendientes',
          cancelled: 'Canceladas'
        },
        apply: 'Aplicar'
      },
      loading: 'Cargando...',
      none: 'Sin reservas.',
      resourceLabel: 'Recurso:',
      editButton: 'Editar',
      cancelButton: 'Cancelar',
      confirmCancelPrompt: '¿Cancelar esta reserva?',
      toast: {
        cancelled: 'Reserva cancelada',
        error: 'Error'
      }
    },

    admin: {
      title: 'Admin',
      description: 'Gestión de salas, equipamiento y reservas.',
      tabs: {
        resources: 'Recursos',
        bookings: 'Reservas'
      },
      reload: 'Recargar',
      loading: 'Cargando...',
      sections: {
        rooms: 'Salas',
        equipment: 'Equipamiento',
        allBookings: 'Todas las reservas'
      },
      filter: {
        status: {
          all: 'Todos los estados',
          confirmed: 'Confirmadas',
          pending: 'Pendientes',
          cancelled: 'Canceladas'
        },
        type: {
          all: 'Todos los tipos',
          room: 'Sala',
          equipment: 'Equipamiento'
        },
        apply: 'Aplicar'
      },
      createRoom: {
        title: 'Crear sala',
        namePlaceholder: 'Nombre',
        locationPlaceholder: 'Ubicación',
        button: 'Crear'
      },
      roomRow: {
        save: 'Guardar',
        cancel: 'Cancelar',
        edit: 'Editar',
        delete: 'Eliminar'
      },
      createEquipment: {
        title: 'Crear equipamiento',
        namePlaceholder: 'Nombre',
        categoryPlaceholder: 'Categoría',
        button: 'Crear'
      },
      equipmentRow: {
        save: 'Guardar',
        cancel: 'Cancelar',
        edit: 'Editar',
        delete: 'Eliminar'
      },
      bookingRow: {
        userLabel: 'Usuario:',
        save: 'Guardar',
        close: 'Cerrar',
        adjust: 'Ajustar',
        cancel: 'Cancelar'
      },
      confirm: {
        deleteRoom: '¿Eliminar esta sala?',
        deleteEquipment: '¿Eliminar este equipamiento?',
        cancelBooking: '¿Cancelar esta reserva?'
      },
      toast: {
        roomCreated: 'Sala creada',
        roomUpdated: 'Sala actualizada',
        roomDeleted: 'Sala eliminada',
        equipmentCreated: 'Equipamiento creado',
        equipmentUpdated: 'Equipamiento actualizado',
        equipmentDeleted: 'Equipamiento eliminado',
        bookingUpdated: 'Reserva actualizada',
        bookingCancelled: 'Reserva cancelada',
        conflict: 'Conflicto de fechas/recurso'
      },
      error: {
        load: 'No se pudo cargar'
      }
    },

    general: {
      errorLoad: 'No se pudo cargar',
      failure: 'Error'
    }
  },

  'en-GB': {
    nav: {
      dashboard: 'Dashboard',
      createBooking: 'Create booking',
      myHistory: 'My history',
      admin: 'Admin',
      logout: 'Logout'
    },

    login: {
      title: 'Login',
      description: 'Sign in to access your bookings.',
      emailLabel: 'Email',
      emailPlaceholder: 'example@mail.com',
      passwordLabel: 'Password',
      passwordPlaceholder: '••••••••',
      button: 'Login',
      loading: 'Logging in...',
      link: {
        register: 'Create account',
        forgot: 'Forgot password'
      },
      toast: {
        success: 'Signed in',
        error: 'Sign-in failed'
      }
    },

    register: {
      title: 'Create account',
      description: 'Create an account to book rooms and equipment.',
      nameLabel: 'Name',
      namePlaceholder: 'Your name',
      emailLabel: 'Email',
      emailPlaceholder: 'example@mail.com',
      passwordLabel: 'Password',
      passwordPlaceholder: 'Minimum 6 characters',
      button: 'Create account',
      loading: 'Creating...',
      link: {
        login: 'Back to login'
      },
      toast: {
        success: 'Account created',
        error: 'Registration failed'
      }
    },

    forgot: {
      title: 'Forgot password',
      description: 'Enter your email to generate a recovery code.',
      emailLabel: 'Email',
      emailPlaceholder: 'example@mail.com',
      button: 'Generate code',
      loading: 'Generating...',
      tokenLabel: 'Recovery code',
      openReset: 'Open reset page',
      back: 'Back to login',
      success: 'If the email exists, a recovery code was created.'
    },

    reset: {
      title: 'Reset password',
      description: 'Enter the recovery code and set a new password.',
      tokenLabel: 'Recovery code',
      tokenPlaceholder: 'code...',
      passwordLabel: 'New password',
      passwordPlaceholder: 'Minimum 6 characters',
      button: 'Update password',
      loading: 'Updating...',
      back: 'Back to login'
    },

    dashboard: {
      title: 'Dashboard',
      description: 'Availability updates automatically.',
      searchPlaceholder: 'Search by name, location or category...',
      statusFilter: {
        all: 'All statuses',
        available: 'Available',
        occupied: 'Occupied now',
        maintenance: 'Maintenance',
        disabled: 'Unavailable'
      },
      tabs: {
        all: 'All',
        rooms: 'Rooms',
        equipment: 'Equipment'
      },
      reload: 'Reload',
      loading: 'Loading...',
      section: {
        rooms: 'Rooms',
        equipment: 'Equipment'
      },
      itemsSuffix: 'items',
      toast: {
        created: 'Booking created',
        cancelled: 'Booking cancelled',
        updated: 'Booking updated',
        socketUnauthorized: 'Session expired. Please sign in again.'
      }
    },

    resource: {
      capacityLabel: 'Capacity',
      categoryLabel: 'Category',
      reserveButton: 'Reserve',
      idLabel: 'ID'
    },

    status: {
      available: 'Available',
      occupied: 'Occupied',
      maintenance: 'Maintenance',
      disabled: 'Unavailable'
    },

    bookingForm: {
      title: {
        create: 'Create booking',
        edit: 'Edit booking'
      },
      description: 'Choose the resource and the time period you need.',
      back: 'Back',
      loading: 'Loading...',
      typeLabel: 'Type',
      type: {
        room: 'Room',
        equipment: 'Equipment'
      },
      editTypeInfo: 'When editing, the resource type cannot be changed.',
      resourceLabel: 'Resource',
      resourcePlaceholder: '— select —',
      availableOnlyInfo: 'Only Available resources can be booked.',
      startLabel: 'Start date/time',
      endLabel: 'End date/time',
      save: {
        create: 'Create booking',
        edit: 'Save changes',
        loading: 'Saving...'
      },
      goToHistory: 'Go to history',
      toast: {
        created: 'Booking created',
        updated: 'Booking updated',
        conflict: 'Conflict: there is an overlapping booking'
      },
      error: 'Failure',
      chooseResourceError: 'Choose a resource',
      notFound: "Booking not found (or you don't have permission)"
    },

    history: {
      title: 'My history',
      description: 'Filter by dates and booking status.',
      filter: {
        status: {
          all: 'All',
          confirmed: 'Confirmed',
          pending: 'Pending',
          cancelled: 'Cancelled'
        },
        apply: 'Apply'
      },
      loading: 'Loading...',
      none: 'No bookings.',
      resourceLabel: 'Resource:',
      editButton: 'Edit',
      cancelButton: 'Cancel',
      confirmCancelPrompt: 'Cancel this booking?',
      toast: {
        cancelled: 'Booking cancelled',
        error: 'Failure'
      }
    },

    admin: {
      title: 'Admin',
      description: 'Manage rooms, equipment and bookings.',
      tabs: {
        resources: 'Resources',
        bookings: 'Bookings'
      },
      reload: 'Reload',
      loading: 'Loading...',
      sections: {
        rooms: 'Rooms',
        equipment: 'Equipment',
        allBookings: 'All bookings'
      },
      filter: {
        status: {
          all: 'All statuses',
          confirmed: 'Confirmed',
          pending: 'Pending',
          cancelled: 'Cancelled'
        },
        type: {
          all: 'All types',
          room: 'Room',
          equipment: 'Equipment'
        },
        apply: 'Apply'
      },
      createRoom: {
        title: 'Create room',
        namePlaceholder: 'Name',
        locationPlaceholder: 'Location',
        button: 'Create'
      },
      roomRow: {
        save: 'Save',
        cancel: 'Cancel',
        edit: 'Edit',
        delete: 'Delete'
      },
      createEquipment: {
        title: 'Create equipment',
        namePlaceholder: 'Name',
        categoryPlaceholder: 'Category',
        button: 'Create'
      },
      equipmentRow: {
        save: 'Save',
        cancel: 'Cancel',
        edit: 'Edit',
        delete: 'Delete'
      },
      bookingRow: {
        userLabel: 'User:',
        save: 'Save',
        close: 'Close',
        adjust: 'Adjust',
        cancel: 'Cancel'
      },
      confirm: {
        deleteRoom: 'Delete this room?',
        deleteEquipment: 'Delete this equipment?',
        cancelBooking: 'Cancel this booking?'
      },
      toast: {
        roomCreated: 'Room created',
        roomUpdated: 'Room updated',
        roomDeleted: 'Room deleted',
        equipmentCreated: 'Equipment created',
        equipmentUpdated: 'Equipment updated',
        equipmentDeleted: 'Equipment deleted',
        bookingUpdated: 'Booking updated',
        bookingCancelled: 'Booking cancelled',
        conflict: 'Date/resource conflict'
      },
      error: {
        load: 'Failed to load'
      }
    },

    general: {
      errorLoad: 'Failed to load',
      failure: 'Failure'
    }
  }
};

translations.en = translations['en-GB'];
translations['en'] = translations['en-GB'];
translations['es-ES'] = translations.es;
translations['es'] = translations.es;

function normalizeLang(value) {
  if (!value) return null;
  const v = String(value).trim();
  const lower = v.toLowerCase();

  if (lower === 'pt' || lower.startsWith('pt-')) return 'pt';
  if (lower === 'en' || lower === 'en-gb' || lower.startsWith('en-')) return 'en-GB';
  if (lower === 'es' || lower === 'es-es' || lower.startsWith('es-')) return 'es';

  return null;
}

const LanguageContext = createContext({ lang: 'pt', setLang: () => {}, t: (key) => key });

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    if (typeof window === 'undefined') return 'pt';

    const saved = normalizeLang(localStorage.getItem('ss_lang'));
    if (saved) return saved;

    const browser = normalizeLang(navigator.language);
    return browser || 'pt';
  });

  function setLang(next) {
    const normalized = normalizeLang(next) || 'pt';
    setLangState(normalized);
  }

  useEffect(() => {
    try {
      localStorage.setItem('ss_lang', lang);
    } catch (_) {}
  }, [lang]);

  const t = useMemo(() => {
    return (key) => {
      const parts = key.split('.');
      let current = translations[lang];

      for (const p of parts) {
        if (current && Object.prototype.hasOwnProperty.call(current, p)) {
          current = current[p];
        } else {
          current = undefined;
          break;
        }
      }

      if (typeof current === 'string') return current;

      current = translations.pt;
      for (const p of parts) {
        if (current && Object.prototype.hasOwnProperty.call(current, p)) {
          current = current[p];
        } else {
          current = undefined;
          break;
        }
      }

      return typeof current === 'string' ? current : key;
    };
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang, t }), [lang, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);
}
