/**
 * @namespace js.sufragio.local_controller
 */

/* global constants */
/* global Chancleta */

/* sufragio/base.js */
/* global _votando */
/* global ocultar_loader */
/* global set_unico_modo */

/* sufragio/pantallas.js */
/* global pantalla_modos */

/* sufragio/voto.js */
/* global cambiar_categoria */

/* sufragio/show_hide.js */
/* global solapa */

/* sufragio/botonera.js */
/* global cargar_partidos_completa */
/* global cargar_listas */
/* global cargar_partidos_categoria */
/* global cargar_consulta_popular */
/* global cargar_candidatos */
/* global cargar_categorias */
/* global mostrar_confirmacion */

/* sufragio/asistida.js */
/* global pantalla_modos_asistida */
/* global cargar_partidos_completa_asistida */
/* global cargar_listas_asistida */
/* global cargar_partidos_categoria_asistida */
/* global cargar_candidatos_asistida */
/* global cargar_consulta_popular_asistida */
/* global mostrar_confirmacion_asistida */

/* imagenes.js */
/* global precachear_imagen */

/* zaguan.js */
/* global send */

/* helpers.js */
/* global shuffle */

/* popup.js */
/* global hide_dialogo */

/* Este es el controlador de la aplicacion javascript que maneja la UX de la
 * votacion.
 *
 * Maneja el procesamiento de datos de candidaturas y el flujo inicial de la
 * aplicacion JS.
 */
var local_data = {};
var tachas_tmp = null;
var preferencias_tmp = null;
var _segmento_actual = null;

/**
 * Establece los datos en local_data, preprocesa los candidatos para
 * establecerle las categorias hijas y asigna la lista a las "Boletas
 * virtuales". Esto es lo que pasa durante la pantalla de carga del modulo,
 * cuando se abre el modulo. Puede tardar unos segundos.
 *
 * @param {*} data - Un diccionario con los datos que vienen del backend. Las key que manda son "categorias", "candidaturas", "agrupaciones", "boletas".
 */
function cargar_datos(data) {
    /*
     *
     * Argumentos:
     * data -- un diccionario con los datos que vienen del backend. Las keys
     * que manda son "categorias", "candidaturas", "agrupaciones", "boletas".
     */
    local_data.categorias = new Chancleta(data.categorias);
    local_data.candidaturas = new Chancleta(data.candidaturas);
    local_data.agrupaciones = new Chancleta(data.agrupaciones);
    local_data.boletas = new Chancleta(data.boletas);

    //Traigo todos los candidatos y preproceso un poco el objeto para hacerlo
    //una vez y que la experiencia de votacion sea mas fluida y de paso ahorrar
    //un poco de procesamiento.
    var candidaturas = local_data.candidaturas.many({ clase: "Candidato" });

    for (const i in candidaturas) {
        let candidatura = candidaturas[i];
        // le linkeo la lista a la candidatura si la tiene.
        if (candidatura.cod_lista) {
            candidatura.lista = get_lista_candidato(candidatura);
        }
        // le linkeo el partido a la candidatura si lo tiene.
        if (candidatura.cod_partido) {
            candidatura.partido = get_partido_candidato(candidatura);
        }
        // le linkeo la lista a la candidatura si la tiene.
        if (candidatura.cod_alianza) {
            candidatura.alianza = get_alianza_candidato(candidatura);
        }
        // Busco las categorias hijas de esa candidatura
        candidatura.categorias_hijas = get_categorias_hijas_candidato(
            candidatura
        );
        if (
            constants.precachear_imagenes &&
            candidatura.imagenes != undefined
        ) {
            precachear_imagen(candidatura.imagenes[0]);
        }
    }

    // Agregando las categorias_hijas al voto en blanco.
    var blancos = local_data.candidaturas.many({ clase: "Blanco" });
    for (const i in blancos) {
        let candidatura = blancos[i];
        candidatura.categorias_hijas = get_categorias_hijas_candidato(
            candidatura
        );
    }

    if (constants.precachear_imagenes) {
        var agrupaciones = local_data.agrupaciones.all();
        for (var k in agrupaciones) {
            var agrupacion = agrupaciones[k];
            precachear_imagen(agrupacion.imagenes[0]);
        }
    }

    // Recorro todas las "Boletas Virtuales" y le hago un shortcut a la lista
    // de manera que cuando lo busque despues lo tenga a mano.
    var boletas = local_data.boletas.all();
    for (var j in boletas) {
        var boleta = boletas[j];
        if (boleta.codigo) {
            boleta.lista = get_lista_boleta(boleta);
        }
    }
    // Ya puden empezar a votar.
    ocultar_loader();
}

/**
 * Selecciona el modo de votacion y actua en consecuencia.
 *
 * @param {string} modo - Un string con el modo de votacion.
 */
function seleccionar_modo(modo) {
    // Esto fuerza el reseteo del objeto seleccion del Controller del modulo
    // sufragio.
    send("reiniciar_seleccion");
    // Y esto hace lo mismo pero localmente.
    limpiar_seleccion();
    if (modo == "BTN_CATEG") {
        // Si votamos por categorias vamos directo a cargar la pantalla de
        // categorias.
        _cargar_pantalla_categorias();
    } else if (modo == "BTN_COMPLETA") {
        // Si votamos por lista completa tenemos que ver si tenemos que agrupar
        // por cargo o colapsar las listas en agrupaciones por si es una PASO o
        // es una eleccion en la que decidimos agrupar por cargo ejecutivo.
        // Por defecto vamos a la tipica pantalla de lista completa, a menos
        // que se de alguna condicion que requiera ir a la pantalla de
        // agrupacion por partidos.
        var func = _cargar_pantalla_lista_completa;

        // Si las boletas de la ubicación están segmentadas...
        if (local_data.boletas.first().segmento !== undefined) {
            func = _cargar_pantalla_lista_completa_segmentada;
        }

        if (constants.colapsar_listas && !constants.agrupar_cargo) {
            // Buscamos todas las boletas que tengan que aparecer en la
            // pantalla de lista completa
            var data = local_data.boletas.many({
                lista_completa: true,
            });

            // Tenemos que tener en cuenta el voto en blanco para no colapsar
            // las listas de manera diferente si tenemos voto en blanco como
            // opcion de lista completa en algun lugar (lo cual es lo tipico).
            var len_listas = data.length;
            for (var i in data) {
                if (data.clase == "Blanco") {
                    len_listas -= 1;
                }
            }
            // nos fijamos si debemos colapsar las listas en partidos o no.
            if (len_listas > constants.colapsar_listas) {
                // Si tenemos que colapsar entonces vamos a mostrar la pantalla
                // de partidos en vez de la de listas.
                func = _cargar_pantalla_partidos;
            }
        }
        func();
    }
}

/**
 * Inicializa el estado cuando el elector ingresa una boleta
 */
function inicializar_estado_voto(){
    _votando = true;
    local_data.cargando_preferencias = false;
}

/**
 * Carga la pantalla inicial cuando un elector mete una boleta.
 * Toma la decision de qué pantalla mostrar segun el contexto. Las salidas
 * en general pueden ser 4:
 *   1) la pantalla de seleccion de modo de votacion.
 *   2) la pantalla de votar por categorias.
 *   3) la pantalla de lista completa.
 *   4) la pantalla de consulta_popular.
 */
function cargar_pantalla_inicial() {
    inicializar_estado_voto();
    // Si esta configurado para aleatorizar los candidatos solo cuando el
    // elector inserta la boleta vamos a shufflear todo.
    if (constants.shuffle.por_sesion) {
        local_data.candidaturas._data = shuffle(local_data.candidaturas._data);
        local_data.agrupaciones._data = shuffle(local_data.agrupaciones._data);
        local_data.boletas._data = shuffle(local_data.boletas._data);
    }
    // Ocultamos el dialogo de error de grabacion, en caso de que alguien en
    // vez de tocar el boton de aceptar haya decidido meter una boleta nueva.
    hide_dialogo();
    // traemos los botones que tenemos que mostrar de las constantes.
    var botones = constants.botones_seleccion_modo;
    // Establecemos que no vamos, por ahora, a votar por categorias, por
    // descarte.
    var fallback = false;

    // Si tenemos configurados qué botones usamos.
    if (botones !== null) {
        var cantidad = botones.length;
        // Nos fijamos que categorias que no sean consultas populares se votan.
        var categorias = local_data.categorias.many({
            consulta_popular: false,
            adhiere: null,
        });

        if (!cantidad) {
            // si los botones estan establecidos pero el array está vacio
            // vamos a votar por categorias.
            fallback = true;
        } else if (cantidad == 1) {
            // Si tenemos un solo boton configurado seleccionamos ese modo, por
            // que para qué mostrar una pantalla con un solo boton.
            if (botones[0] == "BTN_COMPLETA") {
                set_unico_modo(true);
            }
            seleccionar_modo(botones[0]);
        } else if (categorias.length > 1) {
            // Si hay mas de una categoria vamos a cargar la pantalla de
            // seleccion de modos
            _cargar_pantalla_modos(botones);
        } else {
            var primera_cat = _get_categoria();
            // Si la primera categoria es una consulta_popular quiere decir que
            // solo tenemos consultas populares en esta ubicacion, por lo tanto
            // la vamos a mostrar como tal.
            if (primera_cat != null && primera_cat.consulta_popular) {
                // mostrarmos la pantalla de consulta popular con la categoria.
                _cambiar_categoria(primera_cat.codigo);
            } else {
                // si llegamos a este punto quiere decir que tenemos una sola
                // categoria que no es consulta popular, por lo tanto vamos con
                // el fallback a votar por categorias.
                fallback = true;
            }
        }
    } else {
        // Si no tenemos configurados que botones usamos vamos a votar solo por
        // categorias
        fallback = true;
    }

    // Nos fijamos si fallbackeamos a una sola categoria.
    if (fallback) {
        // Cargamos modo a "votar por categorias".
        set_unico_modo(true);
        seleccionar_modo("BTN_CATEG");
    }
}

/**
 * Carga la pantalla de modos dependiendo si estamos en votacion asistida o no.
 *
 * @param {*} botones - los botones que queremos mostrar en la pantalla.
 */
function _cargar_pantalla_modos(botones) {
    if (constants.asistida) {
        pantalla_modos_asistida();
    } else {
        pantalla_modos(botones);
    }
}

/**
 * Carga la pantalla de categorias,
 * trae la primera categoria que encuentra y se la pasa a la funcion que
 * carga los candidatos de una categoria.
 */
function _cargar_pantalla_categorias() {
    var primera_categoria = _get_categoria();
    _cargar_candidatos_categoria(primera_categoria);
}

/**
 * Carga la pantalla de partidos en asistida o en sufragio normal.
 */
function _cargar_pantalla_partidos() {
    // Traigo todos los partidos que tienen alguna lista y armo un diccionario
    // que la pantalla de cargar partidos en lista completa sepa leer.
    var partidos = get_partidos_con_listas();
    var data = { partidos: partidos };
    if (constants.asistida) {
        cargar_partidos_completa_asistida(data);
    } else {
        cargar_partidos_completa(data);
    }
}

/**
 * Carga la pantalla de lista completa.
 *
 * @param {*} cod_partido - Código de un partido si solo se quieren mostrar las listas de una categoria.
 */
function _cargar_pantalla_lista_completa(cod_partido) {
    // Armamos el filtro por defecto con el que vamos a filtrar las listas.
    var agrupa_cargo = false;
    var filter = {
        lista_completa: true,
    };

    var data = null;
    if (typeof cod_partido !== "undefined") {
        // Si el codigo del partido está definido Buscamos todas las listas
        // completas disponibles
        var todas_las_boletas = local_data.boletas.many(filter);
        // vamos a filtrar las listas que sean de este partido.
        let boletas = [];
        for (var i in todas_las_boletas) {
            var boleta = todas_las_boletas[i];
            var lista = boleta.lista;
            if (
                typeof lista !== "undefined" &&
                lista.cod_partido == cod_partido
            ) {
                boletas.push(boleta);
            } else if (
                typeof lista === "undefined" &&
                boleta.codigo == "BLC" &&
                constants.mostrar_blanco_siempre
            ) {
                boletas.push(boleta);
            }
        }
        // La data que vamos a devolver van a ser esas listas de este partido.
        data = boletas;
    } else if (constants.agrupar_cargo) {
        // En caso de agrupar_cargo lo primero que hacermos es buscar todos los
        // candidatos que se presenten por la categoria que queremos agrupar.
        data = local_data.candidaturas.many({
            cod_categoria: constants.agrupar_cargo,
            clase: "Candidato",
        });
        // vamos a buscar si hay un candidato blanco para la categoria en
        // cuestion para ademas mostrar el voto en blanco.
        var blanco = local_data.candidaturas.one({
            cod_categoria: constants.agrupar_cargo,
            clase: "Blanco",
        });
        // Si efectivamente tenemos esa candidatura en blanco lo agregamos a
        // las candidaturas que devolvemos.
        if (blanco) {
            data.push(blanco);
        }
        agrupa_cargo = true;
    } else {
        // En caso de que no filtremos por partido o agrupemos por cargo
        // devolvemos todas las listas completas que encontremos.
        var filter_no_mostrar = {...filter, ...{"GOB": undefined}};
        let no_mostrar = local_data.boletas.many(filter_no_mostrar).map(o => o.codigo);
        data = local_data.boletas.many(filter).filter((elem) => {return !no_mostrar.includes(elem.codigo)});
    }

    if (data.length == 1 && constants.seleccionar_lista_unica) {
        // si tengo una sola lista completa la selecciono, esto pasa en general
        // cuando seleccionamos un partido o candidatos que tiene una sola
        // lista.
        seleccionar_lista(data[0].codigo);
    } else {
        // Si hay mas de una entonces cargamos la pantalla de listas.
        if (constants.asistida) {
            cargar_listas_asistida(data, agrupa_cargo);
        } else {
            cargar_listas(data);
            var agrupacion = local_data.agrupaciones.one({
                codigo: cod_partido,
            });
            solapa(agrupacion);
        }
    }
}

/**
 * Carga la pantalla de lista completa segmentada
 */
function _cargar_pantalla_lista_completa_segmentada() {
    let agrupa_cargo = false;
    let hay_agrupaciones_municipales = false;
    let titulo_solapa = null;
    let data = null;

    // Notar que no se agrupa por cargo, ya que directamente se muestran las
    // listas completas del segmento correspondiente.
    if (_segmento_actual === null) {
        // Si el 'segmento actual' es undefined, entonces es el primer momento
        // de la selección.
        _segmento_actual = "provincial";
        let no_mostrar = local_data.boletas.many({ "segmento": "provincial" ,"GOB": undefined}).map(o => o.id_lista);
        data = local_data.boletas.many({ "segmento": "provincial"}).filter((elem) => {return !no_mostrar.includes(elem.id_lista)});
        titulo_solapa = { "nombre": "Cargos Provinciales" };
    } else {
        data = local_data.boletas.many({ "segmento": "municipal" });
        titulo_solapa = { "nombre": "Cargos Municipales" };
    }

    if (data.length === 1 && constants.seleccionar_lista_unica) {
        // Si hay una sola lista, la selecciona.
        seleccionar_lista(data[0].codigo);
    } else {
        // Si hay mas de una lista, carga la pantalla de listas.
        if (constants.asistida) {
            cargar_listas_asistida_segmentada(data, agrupa_cargo, hay_agrupaciones_municipales, _segmento_actual);
        } else {
            cargar_listas_completas_segmentadas(data, agrupa_cargo, hay_agrupaciones_municipales);
            solapa(null, titulo_solapa);
        }
    }
}


/**
 * Cambia la categoria que está siendo elegida.
 *
 * @param {*} cod_categoria - Código de la categoria en la que queremos seleccionar candidatos
 */
function _cambiar_categoria(cod_categoria) {
    // Traemos la categoria a la que queremos cambiar.
    var categoria = _get_categoria(cod_categoria);
    if (categoria.adhiere) {
        // si esa categoria adhiere a otra (por ejemplo como CNJ en la
        // provincia de Buenos Aires que se votan junto con el intendente)
        // vamos a traer la categoria a la que adhiere. Esto en general pasa
        // cuando estamos confirmando una seleccion y hacemos click en el boton
        // modificar de esa categoria, en realidad la que queremos modificar es
        // la categoria a la que adhiere.
        categoria = _get_categoria(categoria.adhiere);
    }
    // carga los candidatos.
    if (categoria.consulta_popular) {
        _cargar_candidatos_consulta_popular(categoria);
    } else {
        _cargar_candidatos_categoria(categoria);
    }
}

/**
 * Devuelve la categoria que le pedimos o la primera si no le pedimos ninguna.
 *
 * @param {*} cod_categoria - Código de la categoria que queremos traer.
 */
function _get_categoria(cod_categoria) {
    var categoria = null;
    if (typeof cod_categoria === "undefined") {
        categoria = local_data.categorias.one();
    } else {
        categoria = local_data.categorias.one({ codigo: cod_categoria });
    }
    return categoria;
}

/**
 * Cargamos los candidatos de la categoría.
 *
 * @param {*} categoria - Categoria de la cual queremos cargar los candidatos.
 * @param {*} agrupacion - Agrupacion de la cual queremos mostrar los candidatos en caso de que estemos mostrando solo los candidatos de una agrupacion.
 */
function _cargar_candidatos_categoria(categoria, agrupacion) {
    if (typeof agrupacion === "undefined") {
        agrupacion = false;
    }
    var cod_categoria = categoria.codigo;
    // Cambiamos la categoria a la que quermos votar.
    cambiar_categoria(categoria);
    // cargamos los datos de la barra derecha de categorias.
    _cargar_datos_barra_categorias();

    var filter = {
        cod_categoria: cod_categoria,
        clase: "Candidato",
        sorted: "orden_absoluto.0",
    };


    /* En vez de traer todos los candidatos traigo solo uno por categoria en el caso de las preferencias*/
    if(categoria.max_preferencias!=="undefined"){
        //me traigo las listas
        var listas = local_data.agrupaciones.many({clase: 'Lista', sorted: "orden_absoluto.0"});
        var candidatos = [];

        //dejo solo las de la categoria actual
        if(typeof(listas) !== "undefined"){
            for (var i in listas){
                if(listas[i].id_candidatura!=="undefined"){
                    let filter = {
                        cod_lista: listas[i].id_candidatura,
                        cod_categoria: cod_categoria,
                        sorted: "orden_absoluto.0",
                    };
                    var candidato = local_data.candidaturas.one(filter);
                    if(candidato){
                        candidatos.push(candidato);
                    }
                }
            }
        }
    }else{
        var candidatos = local_data.candidaturas.many(filter);
    }

    filter.clase = "Blanco";
    // Y nos fijamos si hay algun candidato en blanco.
    var blanco = local_data.candidaturas.one(filter);
    if (blanco) {
        candidatos.push(blanco);
    }
    // Creamos el diccionario de datos.
    var data_dict = {
        categoria: categoria,
        candidatos: candidatos,
    };
    // Nos fijamos si los candidatos son mas de los que tenemos configurados
    // para mostrar en caso de que sea una PASO.
    var muchos_candidatos =
        constants.paso && candidatos.length > constants.colapsar_candidatos;

    if (!agrupacion && muchos_candidatos) {
        // Si tenemos muchos candidatos y no estamos ya mostrando una
        // agrupacion vamos a devolver las agrupaciones y cargar la pantalla
        // de agrupaciones para categoria.
        data_dict.partidos = local_data.agrupaciones.many({
            clase: constants.categoria_agrupa_por,
        });
        if (constants.asistida) {
            cargar_partidos_categoria_asistida(data_dict);
        } else {
            cargar_partidos_categoria(data_dict);
        }
    } else {
        // En caso de que esté mostrando un agrupacion y/o los candidatos sean
        // demasiados para mostrar.
        if (agrupacion) {
            // Voy a buscar todos los candidatos de este agrupacion.
            filter = {
                clase: "Candidato",
                cod_categoria: cod_categoria,
            };
            if (constants.categoria_agrupa_por == "Alianza") {
                filter.cod_alianza = agrupacion;
            } else {
                filter.cod_partido = agrupacion;
            }
            data_dict.candidatos = local_data.candidaturas.many(filter);
            if (
                data_dict.candidatos.length == 1 &&
                constants.seleccionar_candidato_unico
            ) {
                // Si esta agrupacion tiene un solo candidatos entonces lo
                // seleccionamos, en algunas elecciones nos hacen cambiar este
                // comportamiento para que el elector tenga que explicitamente
                // hacer click en el candidato o en voto en blanco.
                seleccionar_candidatos(categoria, [
                    data_dict.candidatos[0].id_umv,
                ]);
                return;
            } else {
                // Si tiene mas de un candidato para esta agrupacion entonces
                // tenemos que traer el voto en blanco para mostrarlo.
                filter = {
                    clase: "Blanco",
                    cod_categoria: cod_categoria,
                };
                blanco = local_data.candidaturas.one(filter);
                // Si tenemos voto en blanco entonces lo agregamos.
                if (blanco) {
                    data_dict.candidatos.push(blanco);
                }
            }
        }

        // Ahora que sabemos que candidatos queremos mostrar cargamos los
        // candidatos en la pantalla.
        if (constants.asistida) {
            cargar_candidatos_asistida(data_dict);
        } else {
            cargar_candidatos(data_dict);
            if (agrupacion) {
                var obj_agrupacion = local_data.agrupaciones.one({
                    codigo: agrupacion,
                });
                solapa(obj_agrupacion, categoria);
            }
        }
    }
}

/**
 * Carga los candidatos de las consultas popular.
 *
 * @param {*} categoria - Categoria que queremos mostrar.
 */
function _cargar_candidatos_consulta_popular(categoria) {
    // Traemos todas las opciones de la consulta_popular.
    var filter = {
        cod_categoria: categoria.codigo,
        clase: "Candidato",
    };
    var candidatos = local_data.candidaturas.many(filter);

    // Si hay voto en blanco en la consulta lo agregamos (en algunas consultas
    // puede no haber voto en blanco o como en la comuna 9 de CABA 2015 puede
    // ser una opcion de "no quiero participar de la consulta".
    filter.clase = "Blanco";
    var blanco = local_data.candidaturas.one(filter);
    if (blanco) {
        candidatos.push(blanco);
    }
    // Armamos el diccionario de datos.
    var data_dict = { candidatos: candidatos, categoria: categoria };
    // Y cargamos la pantalla.
    if (constants.asistida) {
        cargar_consulta_popular_asistida(data_dict);
    } else {
        cargar_consulta_popular(data_dict);
    }
}

/**
 * Carga la barra derecha de seleccion de categorías en caso de que se
 * tenga que mostrar efectivamente.
 */
function _cargar_datos_barra_categorias() {
    if (constants.mostrar_barra_seleccion) {
        // Traemos todas las categorias que queremos mostrar.
        var categorias = local_data.categorias.many({
            sorted: "posicion",
            consulta_popular: false,
            adhiere: null,
        });
        // Conctamos las categorias con los candidatos seleccionados para las
        // mismas.
        var candidatos_seleccionados = [];
        for (var i in categorias) {
            var seleccion = _seleccion[categorias[i].codigo];
            var candidato = local_data.candidaturas.one({ id_umv: seleccion });
            candidatos_seleccionados.push(candidato);
        }
        // Las cargamos en pantalla.
        cargar_categorias(categorias, candidatos_seleccionados);
    }
}

// El diccionario con todo lo que seleccionó el elector.
var _seleccion = {};

/**
 * Limpia la seleccion, borra la categoria actual.
 */
function limpiar_seleccion() {
    _seleccion = {};
    preferencias_tmp = null;
    tachas_tmp = null;
    _segmento_actual = null;
    cambiar_categoria(null);
}

/**
 * Agrega o quita un candidato del array de preferencias
 * @param {*} max
 * @param {*} boton
 * @param {*} array
 * @param {*} codigo
 */
function toggle_array_candidato(max, boton, array, codigo) {
    if (
        constants.cambiar_rapido_seleccion && max == 1
        && array.length == 1 && !array.includes(codigo)
    ) {
        let candidatos = document
            .querySelectorAll(".opcion-preferencia.seleccionado");
        candidatos.forEach(candidato => {
            candidato.classList.remove("seleccionado");
        });

        // No se puede usar array = []
        array.splice(0, array.length);
        array.push(codigo);

        boton.classList.add("seleccionado");
    } else if (array.includes(codigo)) {
        boton.classList.remove("seleccionado");
        var idx = array.indexOf(codigo);
        array.splice(idx, 1);
    } else if (array.length < max) {
        boton.classList.add("seleccionado");
        array.push(codigo);
    }
}

/**
 * Selecciona candidatos.
 *
 * @param {*} categoria - Categoria para la cual queremos seleccionar a los candidatos.
 * @param {*} codigos - Códigos de los candidatos que queremos seleccionar.
 */
function seleccionar_candidatos(categoria, codigos) {
    // Actualiza el diccionario de candidatos seleccionados.
    if(!local_data.cargando_preferencias)
        _seleccion[categoria.codigo] = codigos;
    if (codigos.length == 1) {
        var candidato = local_data.candidaturas.one({ id_umv: codigos[0] });
        for (var i in candidato.categorias_hijas) {
            var cat_hija = candidato.categorias_hijas[i];
            _seleccion[cat_hija[0]] = [cat_hija[1].id_umv];
        }
    }

    var next_cat = next_cat_vacia();

    // Esto significa que hay preferencias para esa categoria y podría ser
    // util ingresar automáticamente
     if(typeof(_seleccion.preferencias) === "undefined")
         _seleccion.preferencias = {};

    //si la categoria posee preferencias y selecciono blanco limpio
    //las preferencias de esa categoria
    if(candidato.id_candidatura == "BLC" && (typeof(categoria.max_preferencias) !== "undefined"))
        _seleccion.preferencias[categoria.codigo] = [];

    if ((typeof(categoria.max_preferencias) !== "undefined")
        && constants.preferencias_en_seleccion
        && candidato.id_candidatura != "BLC") {
        if (preferencias_tmp == null) {
            const candidato = local_data.candidaturas.one({
                id_umv: codigos[0],
            });
            const seleccionar_preferente_unico =
                candidatura_es_de_preferente_unico(candidato) &&
                categoria_es_de_preferente_unico(categoria);
            if (seleccionar_preferente_unico) {
                _seleccion.preferencias[categoria.codigo] = [];
                const fake_dom_element = document.createElement("div");
                toggle_array_candidato(
                    categoria.max_preferencias,
                    fake_dom_element,
                    _seleccion.preferencias[categoria.codigo],
                    String(candidato.id_umv)
                );
            } else {
                local_data.cargando_preferencias = true;
                _seleccion.preferencias[categoria.codigo] = [];
                if (!constants.asistida) {
                    setTimeout(function () {
                        cargar_pantalla_preferencias(candidato);
                    }, constants.tiempo_feedback);
                } else {
                    cargar_preferencias_candidato_asistida(candidato);
                }
                return;
            }
        } else {
            _seleccion.preferencias[categoria.codigo] = preferencias_tmp;
            //_seleccion[categoria.codigo] = preferencias_tmp;
            preferencias_tmp = null;
            local_data.cargando_preferencias = false;
        }
    // Esto significa que hay tachas para esa categoria y podría ser
    // util ingresar automáticamente
    } else if ((typeof(categoria.max_tachas) !== "undefined")
        && constants.tachas_en_seleccion
        && candidato.id_candidatura != "BLC") {

        if (tachas_tmp == null) {
            var candidato = local_data.candidaturas.one({"id_umv": codigos[0]});

            if (!constants.asistida) {
                setTimeout(function(){
                    // Borro todas las tachas antiguas.
                    _seleccion.tachas = [];
                    cargar_pantalla_tachas(candidato);
                }, constants.tiempo_feedback);
            } else {
                cargar_tachas_candidato_asistida(candidato);
            }
        } else {
            _seleccion.tachas = tachas_tmp;
            tachas_tmp = null;
        }
        return
    }

    if (next_cat) {
        var next_func = _cargar_candidatos_categoria;
        // si la proxima es una consulta_popular pasamos al modo consulta
        // sino seguimos cargando las categorias
        if (next_cat.consulta_popular) {
            next_func = _cargar_candidatos_consulta_popular;
        }
        setTimeout(function () {
            next_func(next_cat);
        }, constants.tiempo_feedback);
    } else {
        // Esto carga la confirmacion y le manda la seleccion al backend para,
        // en caso de usarse precache de impresion se empiece a cachear
        setTimeout(function () {
            _cargar_confirmacion();
        }, constants.tiempo_feedback);
    }
}
/**
* Indica si el candidato es la unica preferencia para el cargo
*
* @param {*} candidato
*/
function candidatura_es_de_preferente_unico(candidato) {
    return candidato.clase === 'Blanco' || (!candidato.cargo_ejecutivo && get_preferencias(candidato).length === 1);

}

/**
* Devuelve las preferencias buscando por lista y cargo
*
* @param {*} candidato
*/
function get_preferencias(candidato){
    var filter = {
        clase: "Candidato",
        cod_lista: candidato.cod_lista,
        cod_categoria: candidato.cod_categoria,
        sorted: "nro_orden"
    };
    return local_data.candidaturas.many(filter);
}

function cantidad_preferencias(candidato){
    var filter = {
        'cod_lista': candidato.cod_lista,
        'cod_categoria': candidato.cod_categoria,
    };
    var candidaturas = local_data.candidaturas.many(filter);
    return candidaturas.length;
}

function candidatura_es_especial(candidatura) {
	return candidatura.clase === "Blanco" || candidatura.clase === "Especial";
}

function categoria_es_de_preferente_unico(categoria) {
    return local_data.candidaturas._data
        .filter(
            (candidatura) =>
                candidatura.cod_categoria === categoria.codigo &&
                !candidatura_es_especial(candidatura)
        )
        .every((candidatura) =>
            candidatura_es_de_preferente_unico(candidatura)
        );
}

/**
 * Selecciona una lista y decide para donde seguir.
 *
 * @param {*} cod_lista - Código de lista seleccionado, o el id de un candidato en caso de agrupar por cargo.
 */
function seleccionar_lista(cod_lista) {
    // Buscamos la "boleta virtual" de esta lista.
    let boleta = null;
    boleta_segmentada = local_data.boletas.first().segmento !== undefined
    if (boleta_segmentada) {
        boleta = local_data.boletas.one({'id_lista': cod_lista, 'segmento': _segmento_actual});
    } else {
        boleta = local_data.boletas.one({codigo: cod_lista});
    }

    if (typeof boleta === "undefined") {
        // Si esta lista no tiene boleta virtual
        if (cod_lista == constants.cod_lista_blanco) {
            // Si la lista es una lista de voto en blanco buscamos la boleta de
            // voto en blanco.
            boleta = local_data.boletas.one({
                codigo: constants.cod_lista_blanco,
            });
            var categorias = local_data.categorias.many({
                consulta_popular: false,
            });
            // Recorremos todas las categorias que no son consultas populares y
            // las llenamos de los id_umv de esa lista en blanco.
            for (var i in categorias) {
                let categoria = categorias[i];
                var id_umv = boleta[categoria.codigo];
                _seleccion[categoria.codigo] = [id_umv];
            }
        } else if (constants.agrupar_cargo) {
            // En cambio si estamos agrupando en por cargo vamos a usar ese
            // codgio de categoria como id del candidato
            var cod_categoria = constants.agrupar_cargo;
            var filter = { lista_completa: true };
            // Busco todas las boletas que tengan ese candidato
            let candidato = local_data.candidaturas.one({ codigo: cod_lista });
            filter[cod_categoria] = candidato.id_umv;
            let data = local_data.boletas.many(filter);
            // Si hay una sola lista completa que tenga ese candidato la vamos
            // a elegir. En algunos lugares pueden quererer que este
            // comportamiento no se automatico.
            if (data.length == 1 && constants.seleccionar_lista_unica) {
                seleccionar_lista(data[0].codigo);
            } else if (data.length > constants.colapsar_listas) {
                // Si cantidad de listas es mayor a la configruacion de
                // colapsar_listas vamos a buscar los partidos los cuales
                // tienen alguna lista que lleva a ese candidato.
                var ids_partidos = [];
                var partidos = [];
                for (var k in data) {
                    var cod_partido = data[k].lista.cod_partido;
                    if (ids_partidos.indexOf(cod_partido) == "-1") {
                        ids_partidos.push(cod_partido);
                        partidos.push(get_partido_candidato(data[k].lista));
                    }
                }
                // Cargamos los partidos en pantalla.
                if (constants.asistida) {
                    cargar_partidos_completa_asistida({ partidos: partidos });
                } else {
                    cargar_partidos_completa({ partidos: partidos });
                    solapa(candidato);
                }
            } else {
                // Si la cantidad de listas entra en pantalla las cargamos
                // directamente en pantalla como una pantalla de listas.
                if (constants.asistida) {
                    cargar_listas_asistida(data);
                } else {
                    cargar_listas(data);
                    solapa(candidato);
                }
            }
            // salimos de la funcion parar que no cargue la confirmacion.
            return;
        }
    } else {
        // si la boleta está definida quiere decir que  tenemos que seleccionar
        // los candidatos de esa lista.
        var candidatos = get_candidatos_boleta(boleta);
        for (var j in candidatos) {
            let candidato = candidatos[j];
            if (typeof candidato != "undefined") {
                _seleccion[candidato.cod_categoria] = [candidato.id_umv];
            }
        }

        let categorias = local_data.categorias.many({
            consulta_popular: false,
        });
        // Si la lista no es totalmente completa vamos a rellenar con voto en
        // blanco las categorias tengan candidato para voto en Blanco.
        for (const k in categorias) {
            var categoria = categorias[k];
            var sel = _seleccion[categoria.codigo];
            if (typeof sel === "undefined") {
                var blanco = local_data.candidaturas.one({
                    cod_categoria: categoria.codigo,
                    clase: "Blanco",
                });
                if (blanco) {
                    _seleccion[categoria.codigo] = [blanco.id_umv];
                }
            }
        }
    }
    // Y ahora si salimos de este lio.
    console.log("salimos de este lio");
    setTimeout(function () {
        // Si la lista completa no es segmentada, o si lo es y en esta selección
        // se ha votado el segmento 'municipal'...
        if (!boleta_segmentada || _segmento_actual === "municipal") {
            var next_cat = next_cat_vacia();

            // Si aún se tiene alguna categoria vacía, y si esta es una consulta
            // popular...
            if (next_cat && next_cat.consulta_popular) {
                // Carga la pantalla de consulta_popular.
                _cargar_candidatos_consulta_popular(next_cat);
            } else {
                // Carga la pantalla de confirmación.
                _cargar_confirmacion();
            }
        }
        // Si la boleta es segmentada, y en esta selección se ha votado el
        // segmento 'provincial'...
        else if (_segmento_actual === "provincial") {
            // Si se ha seleccionado una opción de la pantalla de lista completa
            // del segmento 'provincial', se vuelve a cargar la pantalla de
            // 'lista completa', pero en el segmento 'municipal'.
            _segmento_actual = "municipal";
            next_cat = next_cat_vacia();
            if (next_cat && next_cat.consulta_popular) {
                _cargar_candidatos_consulta_popular(next_cat);
            } else {
                _cargar_pantalla_lista_completa_segmentada();
            }
        }
    }, constants.tiempo_feedback);
}

/**
 * Selecciona un partido. Sirve tanto para lista completa como para
 * categorias. Por lo tanto dirige el flujo del software segun el contexto
 * en el que haya sido llamado.
 *
 * @param {*} codigo - Código del partido o candidato de una categoria adherida.
 * @param {*} categoria - Categoría para la cual queremos seleccionar el partido.
 */
function seleccionar_partido(codigo, categoria) {
    /*
     * Argumentos:
     * codigo --
     * categoria -- la
     */
    if (categoria === null || typeof categoria === "undefined") {
        // Cargamos la pantalla de lista completa.
        _cargar_pantalla_lista_completa(codigo);
    } else {
        // cargamos los candidatos de la categoria que elegimos.
        _cargar_candidatos_categoria(categoria, codigo);
    }
}

/** Carga la pantalla de confirmacion. */
function _cargar_confirmacion(seleccion = _seleccion) {
    // Le decimos al backend cual es la seleccion del elector.
    _seleccion = { ...seleccion };

    //al backend le paso solo id_umv
    var seleccion_id_umv = {};
    for (var cod_categoria in _seleccion) {
        if(cod_categoria!=='preferencias'){
            if(typeof(_seleccion.preferencias) !== "undefined" &&
                typeof(_seleccion['preferencias'][cod_categoria])!== "undefined" &&
                _seleccion['preferencias'][cod_categoria].length>0)
            {
                seleccion_id_umv[cod_categoria] = _seleccion.preferencias[cod_categoria];
            }else{
                seleccion_id_umv[cod_categoria] = _seleccion[cod_categoria];
            }
        }
    }
    send("seleccionar_candidatos", seleccion_id_umv);

    // Generamos los paneles de la pagina de confirmacion.
    const paneles_confirmacion = paneles_confirmacion_from_seleccion(seleccion);

    // Cargamos confirmacion segun el modulo en el que estamos.
    if (constants.asistida) {
        setTimeout(function () {
            mostrar_confirmacion_asistida(paneles_confirmacion);
        }, 1000);
    } else {
        mostrar_confirmacion(paneles_confirmacion);
    }
}

function paneles_confirmacion_from_seleccion(seleccion) {
    const paneles_confirmacion = [];
    const filter_categorias = {};
    if (!constants.mostrar_adheridas_confirmacion) {
        filter_categorias.adhiere = null;
    }
    var categorias = local_data.categorias.many(filter_categorias);
    // Traemos los candidatos para todas las categorias.
    for (var i in categorias) {
        var categoria = categorias[i];
        var candidatos = seleccion[categoria.codigo];
        for (var j in candidatos) {
            var cod_candidato = candidatos[j];
            var filter_candidaturas = { id_umv: cod_candidato };
            var candidato = local_data.candidaturas.one(filter_candidaturas);
            var params = { categoria: categoria, candidato: candidato };
            if (typeof categoria.max_preferencias !== "undefined") {
                var preferencias = [];
                var candidatos_pre = seleccion["preferencias"][categoria.codigo];
                for(var k in candidatos_pre){
                    candidato = local_data.candidaturas.one({id_umv: candidatos_pre[k]});
                    preferencias.push(candidato);
                }
                params.preferencias = preferencias;
            }
            if (typeof(categoria.max_tachas) !== "undefined") {
                var tachas = [];
                var candidatos_tac = seleccion["tachas"];
                for(var k in candidatos_tac){
                    candidato = _crear_candidato_secundario(candidato, candidatos_pre[k]);
                    tachas.push(candidato);
                }
                params.tachas = tachas;
            }
            paneles_confirmacion.push(params);
        }
    }
    return paneles_confirmacion;
}

/**
 * Decide cual es la proxima categoria vacia y la devuelve.
 *
 * @returns {any} - Devuelve la próxima categoría si la hay, caso contrario devuelve un booleano con valor de falso.
 */
function next_cat_vacia() {
    var filter = {
        sorted: "consulta_popular",
        adhiere: null,
    };
    var categorias = local_data.categorias.many(filter);
    for (var i in categorias) {
        var cat = categorias[i];
        if (typeof _seleccion[cat.codigo] === "undefined") {
            return cat;
        }
    }
    return false;
}

/**
 * Devuelve el objeto lista de un candidato.
 *
 * @param {*} candidato - Candidato del cual se quiere generar un objeto candidato.
 * @returns {any} - Objeto lista de un candidato.
 */
function get_lista_candidato(candidato) {
    return local_data.agrupaciones.one({ id_candidatura: candidato.cod_lista });
}

/**
 * Devuelve el objeto lista para una boleta.
 *
 * @param {*} boleta - Boleta de la cual se quiere generar un objeto boleta.
 * @returns {any} - Objeto lista para una boleta.
 */
function get_lista_boleta(boleta) {
    return local_data.agrupaciones.one({ id_candidatura: boleta.codigo });
}

/**
 * Devuelve el objeto partido de un candidato.
 *
 * @param {*} candidato - Candidato a partir del cual se quiere generar un objeto partido.
 * @returns {any} - Objeto partido de un candidato.
 */
function get_partido_candidato(candidato) {
    return local_data.agrupaciones.one({
        id_candidatura: candidato.cod_partido,
    });
}

/**
 * Devuelve el objeto alianza de un candidato.
 *
 * @param {*} candidato - Candidato a partir del cual se quiere generar un objeto alianza.
 * @returns {any} - Objeto alianza de un candidato.
 */
function get_alianza_candidato(candidato) {
    return local_data.agrupaciones.one({
        id_candidatura: candidato.cod_alianza,
    });
}

/**
 * Devuelve los candidatos de una boleta ordenados por orden de categoria.
 *
 * @param {*} lista - Lista que contiene los candidatos.
 * @returns {Array} - Candidatos de una boleta ordenados por orden de categoria.
 */
function get_candidatos_boleta(boleta) {
    var ordenados = [];

    let categorias = null
    // Si la boleta está segmentada...
    if (_segmento_actual !== null) {
        // Únicamente obtiene las categorías del segmento actual.
        categorias = local_data.categorias.many({ segmento: _segmento_actual });
    } else {
        categorias = local_data.categorias.many({ consulta_popular: false });
    }

    for (var i in categorias) {
        var categoria = categorias[i];
        var candidato = local_data.candidaturas.one({
            id_umv: boleta[categoria.codigo],
        });
        if (typeof candidato === "undefined") {
            candidato = local_data.candidaturas.one({
                clase: "Blanco",
                cod_categoria: categoria.codigo,
            });
            if (typeof candidato !== "undefined") {
                candidato.es_blanco = true;
            }
        }
        if (
            typeof categoria !== "undefined" &&
            typeof candidato !== "undefined"
        ) {
            candidato.categoria = categoria;
        }
        ordenados.push(candidato);
    }

    return ordenados;
}

/**
 * Devuelve las categorías hijas de un candidato.
 *
 * @param {*} candidato - Candidato a partir del cual se obtienen las categorías hijas.
 * @returns {Array} - Categorías hijas de un candidato.
 */
function get_categorias_hijas_candidato(candidato) {
    var ret = [];

    var categorias_hijas = local_data.categorias.many({
        adhiere: candidato.cod_categoria,
    });

    if (categorias_hijas.length) {
        for (var j in categorias_hijas) {
            var categoria = categorias_hijas[j];
            if (categoria) {
                const candidato_hijo = local_data.candidaturas.one({
                    cod_categoria: categoria.codigo,
                    cod_lista: candidato.cod_lista,
                });
                if (candidato_hijo) {
                    var cat_hija = [
                        categoria.codigo,
                        candidato_hijo,
                        categoria,
                    ];
                    ret.push(cat_hija);
                }
            }
        }
    }
    return ret;
}

/**
 * Devuelve todos los partidos que tengan alguna lista completa.
 *
 * @returns {Array} - Partidos que tengan alguna lista completa.
 */
function get_partidos_con_listas() {
    var partidos = [];
    var cods_partidos = [];
    var boletas = local_data.boletas.many({ lista_completa: true });
    for (var i in boletas) {
        var boleta = boletas[i];
        if (
            typeof boleta.lista !== "undefined" &&
            cods_partidos.indexOf(boleta.lista.cod_partido) == "-1"
        ) {
            cods_partidos.push(boleta.lista.cod_partido);
        }
    }

    for (var j in cods_partidos) {
        var cod_partido = cods_partidos[j];
        var partido = local_data.agrupaciones.one({ codigo: cod_partido });
        partidos.push(partido);
    }

    return partidos;
}

/**
 * Indica si la categoria del candidato tiene preferentes
 * 
 * @param {*} candidato
 * @returns {Boolean}
 */
function es_candidato_con_preferentes(candidato){
    let categoria = local_data.categorias.one({codigo: candidato.cod_categoria});
	return categoria.max_preferencias>0;
}


/* exported cargar_datos */
/* exported cargar_pantalla_inicial */
/* exported seleccionar_partido */
/* exported es_candidato_con_preferentes */
