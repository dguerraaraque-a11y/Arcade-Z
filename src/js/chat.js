/**
 * Arcade-Z: SnakeBotLib v4.5 - "The Final Word"
 * Diccionario masivo y moldes de construcción humana.
 */

const ArcadeChatLib = {
    Snake: {
        diccionario: {
            saludos: ["hola", "epa", "buenas", "que tal", "hey", "holi", "hablame", "saludos", "wena", "klk", "q lo q", "oiga", "buenass", "que onda", "ey", "que mas", "klk manin", "hablame claro", "ey q pasa", "buenasss", "que hubo", "oe", "q onda crack", "holiwi", "buenas noches", "dia"],
            despedidas: ["chao", "me fui", "luego", "bye", "nos vemos", "f", "me mataron", "ya vengo", "rip", "perdi todo", "pff me fui", "me canse", "ya valio", "gg", "adiós", "la vemos", "hay nos vemos", "f en el chat", "ya no juego mas", "me saco el lag", "vuelvo en un rato", "chauuu"],
            sujetos: ["bro", "crack", "pro", "team", "amigo", "gente", "serpiente", "compa", "socio", "maquina", "fiera", "leyenda", "gusano", "jugador", "pana", "vato", "lince", "titan", "maestro", "colega", "tipo", "men", "brother", "pibe", "chamo", "wey", "fichaje", "as", "tío", "broder", "compañero", "socito", "crackens", "proplayer", "fiera", "maquinaria", "capo"],
            verbos: ["hacer", "jugar", "ayudar", "matar", "comer", "unir", "correr", "atacar", "rodear", "crecer", "vengar", "dar", "buscar", "ganar", "perder", "robar", "encerrar", "escapar", "interceptar", "trolear", "campear", "farmear", "dominar", "humillar", "asustar", "bloquear", "limpiar", "fallecer", "reaparecer", "perseguir", "engañar", "acabar"],
            conectores: ["quieres", "puede", "vamos a", "quiere", "para", "conmigo", "entre todos", "ahora", "luego", "de una", "intentar", "sin miedo", "por favor", "si quieres", "mejor", "así", "despacio", "rápido", "otra vez", "con todo", "literal", "obvio", "capaz", "seguro", "tipo", "así de la nada", "en serio", "cuidado con", "en verdad", "casi"],
            objetos: ["puntos", "masa", "lider", "top", "skin", "equipo", "comida", "centro", "borde", "trampa", "estrategia", "corona", "record", "posicion", "ranking", "bolas", "partida", "server", "mapa", "nido", "zona", "espacio", "bolitas", "puesto"],
            adjetivos: ["bueno", "malo", "grande", "fuerte", "rapido", "lento", "pro", "noob", "hacker", "lag", "imposible", "facil", "épico", "insano", "toxic", "proplayer", "manco", "pesado", "increíble", "legendario", "pobre", "god", "rata", "campero", "flash", "invisible", "chetado", "suertudo", "maldito", "buenísimo", "raro"],
            preguntas: ["quien", "donde", "alguien", "como", "porque", "cuanto", "cuando", "sera que", "cual", "que paso", "que onda", "viste que", "viste como"],
            reacciones: ["wow", "lol", "xd", "omg", "rayos", "bien", "mal", "increible", "uff", "ajajaja", "noo", "diablos", "que mal", "asombroso", "f", "que loco", "no puede ser", "es en serio", "brutal", "qué robo", "qué suerte", "increíble literal", "naaaa"],
            lugares: ["arriba", "abajo", "al centro", "atras", "lejos", "cerca", "adentro", "por la esquina", "en el medio", "por el borde", "en mi zona", "por allá", "en la punta", "a la derecha"],
            jergas: ["manin", "fichu", "duro", "claro", "si va", "ni de broma", "fino", "activo", "relajao", "la clara", "a fuego", "estás frito", "papi", "la posta", "de chill", "nashe", "sape", "nítido", "en la madre", "metele", "sin asco", "q pro"]
        },
        moldes: {
            saludoCorta: ["saludos", "sujetos"],
            despedidaTriste: ["reacciones", "despedidas"],
            preguntaTeam: ["preguntas", "sujetos", "conectores", "verbos", "sujetos"],
            ataqueEstrategico: ["reacciones", "conectores", "verbos", "sujetos", "lugares"],
            planMaestro: ["conectores", "verbos", "sujetos", "lugares"],
            avisoPeligro: ["reacciones", "sujetos", "verbos", "lugares"],
            alianzaPro: ["jergas", "sujetos", "conectores", "verbos", "objetos"],
            quejaDetallada: ["reacciones", "sujetos", "verbos", "objetos", "adjetivos"],
            quejaToxic: ["sujetos", "adjetivos", "verbos", "jergas"],
            dudaExistencial: ["preguntas", "sujetos", "adjetivos", "verbos"],
            elogio: ["reacciones", "sujetos", "adjetivos"],
            comentarioSkin: ["reacciones", "adjetivos", "objetos", "sujetos"],
            lagMoment: ["reacciones", "adjetivos", "objetos", "jergas"],
            jergaActiva: ["jergas", "sujetos", "saludos"],
            desafio: ["preguntas", "verbos", "conectores", "adjetivos"],
            venganza: ["jergas", "sujetos", "conectores", "verbos", "sujetos"],
            puroRandom: ["reacciones", "jergas", "sujetos"]
        },
        construirFrase: function(tipoPropuesto) {
            const getWord = (cat) => {
                const list = this.diccionario[cat];
                return list ? list[Math.floor(Math.random() * list.length)] : "";
            };

            const moldesKeys = Object.keys(this.moldes);
            const moldeKey = tipoPropuesto || moldesKeys[Math.floor(Math.random() * moldesKeys.length)];
            const esquema = this.moldes[moldeKey];

            let frase = esquema.map(categoria => getWord(categoria)).join(" ");

            if (Math.random() < 0.25) {
                const nexos = [" y ", " pero ", " aunque ", "... ", " o ", " entonces "];
                const otroMolde = moldesKeys[Math.floor(Math.random() * moldesKeys.length)];
                frase += nexos[Math.floor(Math.random() * nexos.length)] + 
                         this.moldes[otroMolde].map(cat => getWord(cat)).join(" ");
            }

            if ((moldeKey.includes("Toxic") || moldeKey.includes("ataque")) && Math.random() < 0.2) {
                frase = frase.toUpperCase();
            } else {
                frase = frase.charAt(0).toUpperCase() + frase.slice(1);
            }

            const emojis = [" 🐍", " 🔥", " xd", " 😎", " 💀", " !!", " ??", " :v", " <3", " xddd", " uff"];
            if (Math.random() > 0.4) {
                frase += emojis[Math.floor(Math.random() * emojis.length)];
            }

            return frase;
        }
    },

    AmongUs: {
        diccionario: {
            saludos: ["hola", "q onda", "alguien?", "listos?", "start", "hey", "buenas", "empiecen ya"],
            sujetos: ["rojo", "azul", "verde", "amarillo", "yo", "el impostor", "un tripulante", "alguien", "negro", "blanco", "rosa", "cyan", "morado", "cafe", "lima"],
            verbos: ["vi a", "reporto a", "mató a", "venteó", "siguió a", "hizo la tarea", "finge tareas", "acuso a", "es", "estaba con", "defiendo a"],
            lugares: ["en electricidad", "en admin", "cerca de cámaras", "en navegación", "en motores", "en cafetería", "en escudos", "en O2", "en armas", "en comunicaciones", "en medbay", "en almacen"],
            objetos: ["el cuerpo", "el botón", "la ventila", "el escáner", "las cámaras", "el sabotaje", "la basura", "los cables"],
            adjetivos: ["sus", "raro", "limpio", "inocente", "culpable", "muy callado", "sospechoso", "seguro", "dudoso"],
            reacciones: ["donde?", "quien?", "como?", "cuando?", "pruebas?", "wtf", "omg", "no puede ser", "F", "voto por", "skip", "ok"],
            defensas: ["no soy yo", "yo estaba en", "hice mis tareas en", "estaba lejos", "es un error", "confirmo, lo vi en"],
            preguntas: ["donde estaban?", "alguien vio algo?", "alguna prueba contra", "por que acusan a", "quien reporto?"]
        },
        moldes: {
            acusacionDirecta: ["verbos", "sujetos", "en", "lugares"],
            preguntaGeneral: ["preguntas"],
            preguntaEspecifica: ["preguntas", "sujetos", "?"],
            reporteCuerpo: ["objetos", "en", "lugares", "!"],
            defensaSimple: ["defensas", "lugares"],
            defensaCompleja: ["defensas", "sujetos", "en", "lugares"],
            sospecha: ["sujetos", "es muy", "adjetivos"],
            votar: ["reacciones", "sujetos"],
            saludoLobby: ["saludos"],
            infoUtil: ["verbos", "sujetos", "haciendo", "objetos", "en", "lugares"]
        },
        construirFrase: function(tipoPropuesto) {
            const getWord = (cat) => {
                if (cat === '?' || cat === '!' || cat === '.') return cat;
                if (cat === 'en' || cat === 'es muy' || cat === 'haciendo') return cat; // Palabras fijas
                const list = this.diccionario[cat];
                return list ? list[Math.floor(Math.random() * list.length)] : "";
            };

            const moldesKeys = Object.keys(this.moldes);
            const moldeKey = tipoPropuesto && this.moldes[tipoPropuesto] ? tipoPropuesto : moldesKeys[Math.floor(Math.random() * moldesKeys.length)];
            const esquema = this.moldes[moldeKey];

            let frase = esquema.map(categoria => getWord(categoria)).join(" ");
            
            frase = frase.replace(/\s\?/g, '?').replace(/\s!/g, '!').replace(/\s\./g, '.').replace(/\s+/g, ' ');
            frase = frase.charAt(0).toUpperCase() + frase.slice(1);

            return frase;
        }
    }
};

// Vinculación global
window.SnakeBotLib = ArcadeChatLib.Snake; // Para retrocompatibilidad
window.ArcadeChatLib = ArcadeChatLib;