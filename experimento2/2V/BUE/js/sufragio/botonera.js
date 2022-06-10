/**
 * @namespace js.sufragio.botonera
 */

/* sufragio/ipc.js */
/* global constants:readonly */

/* sufragio/base.js */
/* global aceptar_clicks:writable */
/* global _votando:readonly */
/* global confirmada:writable */
/* global _consulta_actual:writable */
/* global pagina_anterior:writable */

/* sufragio/local_controller.js */
/* global local_data:readonly */
/* global _seleccion:readonly */
/* global _cambiar_categoria */
/* global seleccionar_modo */

/* sufragio/interaccion.js */
/* global desbindear_botones */
/* global bindear_botones */
/* global click_lista */
/* global click_consulta_popular */
/* global click_candidato */

/* sufragio/voto.js */
/* global _categorias:readonly */
/* global _modo:readonly */
/* global get_modo */
/* global get_categoria_actual */
/* global guardar_modo */
/* global cambiar_categoria */
/* global limpiar_data_categorias */

/* sufragio/pantallas.js */
/* global insercion_boleta */
/* global pantalla_principal */

/* sufragio/templates.js */
/* global  main_dict_candidato */
/* global  crear_item_lista */
/* global  get_template_candidatos */
/* global  crear_item_consulta_popular */
/* global  crear_item_partido */
/* global  crear_item_candidato */
/* global  get_template_confirmacion */
/* global  generar_paneles_confirmacion */

/* sufragio/show_hide */
/* global  hide_all */
/* global  update_titulo_categoria */
/* global  contenido_solapa */
/* global  show_confirmacion */

/* patio.js */
/* global patio */

/* helpers.js */
/* global fetch_template */
/* global shuffle */

/**
 * Establece el siguiente modo de votacion.
 */
function get_next_modo() {
    if (aceptar_clicks) {
        desbindear_botones();

        if (constants.interna) {
            guardar_modo(null);
            /* @warning: funcion no se encuentra declarada en ningun lado. */
            get_pantalla_partidos();
        } else if (constants.paso) {
            if (pagina_anterior !== null) {
                var modo = get_modo();
                if (modo == "BTN_CATEG") {
                    var cat_actual = get_categoria_actual();
                    _cambiar_categoria(cat_actual.codigo);
                } else {
                    seleccionar_modo(_modo);
                }
                pagina_anterior = null;
            } else {
                limpiar_data_categorias();
                pagina_anterior = null;
                pantalla_principal();
            }
        } else {
            _cargar_pantalla_categorias()
        }
    }
}

/**
 * Callback de seleccion de candidatos.
 */
function seleccion_candidatos() {
    pantalla_principal();
}

/**
 * Establece las categorias y los candidatos seleccionados a la derecha en la seleccion por categorias.
 *
 * @param {*} categorias - Categorías que se quieren mostrar.
 * @param {*} candidatos - Candidatos seleccionados.
 */
function cargar_categorias(categorias, candidatos) {
    const opciones = document.querySelector("#opciones");
    if (opciones) {
        opciones.style.display = "none";
    }
    if (!categorias) return;

    fetch_template("categoria").then((categoria_template) => {
        const elem = document.querySelector("#candidatos_seleccionados");
        let items = "";
        for (let i in categorias) {
            const categoria = categorias[i];
            if (!categoria.consulta_popular) {
                let candidato = candidatos[i];
                const id_cat = "categoria_" + categoria.codigo;
                let seleccionado = "";
                const cat_actual = get_categoria_actual();
                if (
                    cat_actual !== null &&
                    categoria.codigo == cat_actual.codigo
                ) {
                    seleccionado = "seleccionado";
                }
                let nombre = "";
                if (typeof candidato !== "undefined") {
                    nombre = candidato.nombre;
                    if (candidato.clase == "Blanco") {
                        seleccionado += " blanco";
                    }
                } else {
                    seleccionado += " no-seleccionado";
                    candidato = {};

                    nombre = constants.candidato_no_seleccionado;
                }
                const template_data = main_dict_candidato(
                    candidato,
                    id_cat,
                    "barra_lateral"
                );
                template_data.categoria = categoria;
                template_data.seleccionado = seleccionado;

                const item = categoria_template(template_data);
                items += item;
            }
        }
        elem.innerHTML = items;
        bindear_botones();
    });
}

/**
 * Carga las listas completas en pantalla.
 *
 * @param {Array} boletas - Arreglo de jsons donde cada uno contiene datos de la lista.
 */
function cargar_listas(boletas) {
    if (!constants.shuffle.por_sesion && constants.shuffle.boletas) {
        boletas = shuffle(boletas);
    }

    if (constants.agrupar_por_partido) {
        boletas = agrupar_candidatos_por_partido(boletas);
    }

    var html = "";
    var blanco = 0;
    for (var m in boletas) {
        var boleta = boletas[m];

        if (boleta.clase == "Candidato" || boleta.clase == "Blanco") {
            if (boleta.clase != "Blanco") {
                let item = crear_item_lista(boleta, false);
                html += item;
            } else {
                blanco = 1;
            }
        } else {
            var codigo_lista = boletas[m].codigo;
            if (codigo_lista != constants.cod_lista_blanco) {
                let item = crear_item_lista(boleta, true);
                html += item;
            } else {
                blanco = 1;
            }
        }
    }
    html += '<div class="clear"></div>';

    var pantalla = patio.pantalla_listas;
    pantalla.only();
    document.querySelector(pantalla.id).classList.value = "";
    const clase_listas = get_template_candidatos(boletas.length - blanco);
    document
        .querySelector(pantalla.id)
        .classList.add("pantalla", "opciones", "sinbarra");
    document.querySelector(pantalla.id).classList.add(clase_listas);

    if (_votando) {
        pantalla.html(html);
        if (blanco) {
            patio.voto_blanco.show();
            document.querySelector("#voto_blanco").onclick = click_lista;
            document
                .querySelector("#voto_blanco")
                .classList.remove("seleccionado");
        }
    } else {
        insercion_boleta();
    }
    bindear_botones();
}

/**
 * Carga los candidatos de Consulta Popular.
 *
 * @param {*} data - Data que contiene la categoria y los candidatos.
 */
function cargar_consulta_popular(data) {
    var categoria = data.categoria;
    var candidatos = data.candidatos;
    if (!constants.shuffle.por_sesion && constants.shuffle.consultas) {
        candidatos = shuffle(candidatos);
    }
    _consulta_actual = categoria;

    var pantalla = patio.consulta_popular_container;

    var html = "";
    var blanco = 0;
    for (var i in candidatos) {
        if (candidatos[i].clase != "Blanco") {
            var item = crear_item_consulta_popular(candidatos[i]);
            let codigo_lista = candidatos[i].codigo;
            codigo_lista = codigo_lista.split("_")[1];
            item.imagen_agrupacion = false;
            html += item;
        } else {
            blanco = 1;
        }
    }
    html += '<div class="clear"></div>';
    var clase_candidatos = get_template_candidatos(candidatos.length - blanco);
    document.querySelector(pantalla.id).classList.value = "";
    document
        .querySelector(pantalla.id)
        .classList.add("pantalla", "opciones", "sinbarra");
    document.querySelector(pantalla.id).classList.add(clase_candidatos);
    pantalla.html(html);

    if (!constants.asistida) {
        document.querySelector("#categoria_votada").textContent =
            "Referéndum Popular";
    }

    pantalla.only();

    bindear_botones();

    if (blanco) {
        patio.voto_blanco.show();
        document.querySelector("#voto_blanco").onclick = click_consulta_popular;
        document.querySelector("#voto_blanco").classList.remove("seleccionado");
        if (_categorias !== null) {
            try {
                /* @warning: funcion no esta definida en ningun lado. */
                var data_categoria = get_data_categoria(
                    // @warning: variable no está declarada en ningun lado.
                    listas[0].candidatos[0].cod_categoria
                );
                if (
                    data_categoria.cod_candidato !== null &&
                    data_categoria.cod_candidato.split("_")[1] ==
                        constants.cod_lista_blanco
                ) {
                    document.querySelector("#voto_blanco").add("seleccionado");
                }
            } catch (e) {
                /* y si no nada... */
            }
        }
    }
}

/**
 * Muestra la pantalla de seleccion de partidos.
 *
 * @param {*} partidos - Los partidos a mostrar
 */
function seleccion_partido(partidos) {
    document.querySelector("#boleta_insertada").style.display = "none";
    /* @warning: funcion no esta definida en ningun lado. */
    hide_pestana();
    hide_all();
    /* @warning: funcion no esta definida en ningun lado. */
    show_contenedor_opciones();
    var modo = get_modo();
    /* @warning: funcion no esta definida en ningun lado. */
    show_listas_container();
    document
        .querySelector("#voto_blanco")
        .addEventListener("click", click_lista);
    /* @warning: funcion no esta definida en ningun lado. */
    hide_contenedor_der();
    document.querySelector("#opciones").style.display = "none";
    var pantalla = document.querySelector("#opciones");
    pantalla.innerHTML = "";
    var html = "";
    for (var i in partidos) {
        var item = crear_item_partido(partidos[i]);
        html += item;
    }
    /* @warning: funcion no esta definida en ningun lado. */
    show_voto_blanco();
    html += '<div class="clear"></div>';
    pantalla.classList.value = "";
    document.querySelector("#opciones").style.display = "block";
    const clase_listas = get_template_candidatos(partidos.length);
    pantalla.classList.add("pantalla opciones");
    pantalla.classList.add(clase_listas);
    if (
        constants.interna ||
        modo == "BTN_COMPLETA" ||
        !constants.mostrar_barra_seleccion
    ) {
        pantalla.classList.add("sinbarra");
    } else {
        pantalla.classList.add("conbarra");
    }
    pantalla.innerHTML(html);
    bindear_botones();
}

/**
 * Genera los botones de las agrupaciones para votacion por categorias.
 *
 * @param {*} data - Contiene partidos, candidatos y categorías.
 */
function generar_botones_partido_categorias(data) {
    var html = "";
    var partidos = data.partidos;
    if (!constants.shuffle.por_sesion && constants.shuffle.partidos) {
        partidos = shuffle(partidos);
    }
    var candidatos = data.candidatos;
    var cantidad_partidos = 0;
    var sel = _seleccion[data.categoria.codigo];
    var candidato_seleccionado = null;
    if (typeof sel != "undefined") {
        candidato_seleccionado = local_data.candidaturas.one({
            id_umv: sel[0],
        });
    }

    for (var i in partidos) {
        var encontrado = false;
        var partido = partidos[i];
        for (var j in candidatos) {
            var candidato = candidatos[j];
            if (constants.categoria_agrupa_por == "Alianza") {
                if (candidato.cod_alianza == partido.codigo) {
                    encontrado = true;
                    break;
                }
            } else {
                if (candidato.cod_partido == partido.codigo) {
                    encontrado = true;
                    break;
                }
            }
        }
        if (encontrado) {
            var seleccionado = false;
            if (constants.categoria_agrupa_por == "Alianza") {
                if (
                    candidato_seleccionado &&
                    candidato_seleccionado.cod_alianza == partido.codigo
                ) {
                    seleccionado = true;
                }
            } else {
                if (
                    candidato_seleccionado &&
                    candidato_seleccionado.cod_partido == partido.codigo
                ) {
                    seleccionado = true;
                }
            }
            var item = crear_item_partido(partido, seleccionado);
            html += item;
            cantidad_partidos++;
        }
    }
    if (candidato_seleccionado && candidato_seleccionado.clase == "Blanco") {
        document.querySelector("#voto_blanco").classList.add("seleccionado");
    }
    html += '<div class="clear"></div>';
    return [html, cantidad_partidos];
}

/**
 * Genera los botones de los partidos cuando lista completa colapsa por partidos.
 *
 * @param {*} data - Contiene los partidos.
 */
function generar_botones_partido_completa(data) {
    var html = "";
    var partidos = data.partidos;
    if (!constants.shuffle.por_sesion && constants.shuffle.partidos) {
        partidos = shuffle(partidos);
    }
    var cantidad_partidos = 0;

    for (var i in partidos) {
        var seleccionado = false;
        var item = crear_item_partido(partidos[i], seleccionado);
        html += item;
        cantidad_partidos++;
    }
    html += '<div class="clear"></div>';
    return [html, cantidad_partidos];
}

/**
 * Muestra en pantalla los partidos en caso de que tengan que aparecer dentro de voto por categorias en las PASO.
 *
 * @param {*} data - Contiene las categorías y candidatos.
 */
function cargar_partidos_categoria(data) {
    pagina_anterior = null;
    update_titulo_categoria();
    var pantalla = patio.pantalla_partidos_categoria;
    document.querySelector("#voto_blanco").classList.remove("seleccionado");
    var data_botones = generar_botones_partido_categorias(data);
    document.querySelector(pantalla.id).classList.value = "";
    const clase_listas = get_template_candidatos(data_botones[1]);
    if (constants.mostrar_barra_seleccion) {
        pantalla.addClass("conbarra");
    } else {
        pantalla.addClass("sinbarra");
    }
    pantalla.addClass("opciones", "pantalla");
    pantalla.addClass(clase_listas);
    pantalla.html(data_botones[0]);

    var blanco = false;
    for (var i in data.candidatos) {
        var candidato = data.candidatos[i];
        if (candidato.clase == "Blanco") {
            blanco = true;
            break;
        }
    }

    pantalla.only();
    bindear_botones();

    if (blanco) {
        patio.voto_blanco.show();
        document.querySelector("#voto_blanco").onclick = click_candidato;
    } else {
        patio.voto_blanco.hide();
    }
}

/**
 * Muestra en pantalla los partidos en caso de que tengan que aparecer dentro de voto por lista completa en las PASO.
 *
 * @param {*} data - Contiene las categorías y candidatos.
 */
function cargar_partidos_completa(data) {
    pagina_anterior = null;
    var pantalla = patio.pantalla_partidos_completa;
    var data_botones = generar_botones_partido_completa(data);

    document.querySelector(pantalla.id).classList.value = "";
    const clase_listas = get_template_candidatos(data_botones[1]);
    pantalla.addClass("opciones", "pantalla", "sinbarra");
    pantalla.addClass(clase_listas);
    pantalla.html(data_botones[0]);
    document.querySelector("#voto_blanco").classList.remove("seleccionado");
    document.querySelector("#voto_blanco").onclick = click_lista;
    pantalla.only();
    bindear_botones();
}

/**
 * Agrupa por partido los candidatos, como piden en Salta. Tanto los partidos como los candidatos aparecen al azar pero todos los candidatos del mismo partido aparecen juntos.
 *
 * @param {*} candidatos - Candidatos que se van a agrupar por partidos.
 */
function agrupar_candidatos_por_partido(candidatos) {
    var candidatos_ordenados = [];
    var partidos = [];

    //Busco todos los partidos que hay
    for (var i in candidatos) {
        if (partidos.indexOf(candidatos[i].cod_partido) == -1) {
            partidos.push(candidatos[i].cod_partido);
        }
    }

    //Mezclo los partidos para evitar que los partidos que tienen mas listas
    //Tengan mas probabilidades de estar primeros
    if (!constants.shuffle.por_sesion && constants.shuffle.partidos) {
        partidos = shuffle(partidos);
    }

    //Busco todo los candidato para cada partido
    for (var l in partidos) {
        for (var j in candidatos) {
            if (partidos[l] == candidatos[j].cod_partido) {
                candidatos_ordenados.push(candidatos[j]);
            }
        }
    }

    return candidatos_ordenados;
}

/**
 * Crea los botones de los candidatos.
 *
 * @param {*} candidatos - Candidatos a los cuales se le crearán los botones.
 */
function crear_botones_candidatos(candidatos) {
    var elem = "";
    var blanco = 0;

    //Recorro los candidatos y armo los botones
    for (var k in candidatos) {
        var candidato = candidatos[k];
        var seleccionado = false;

        //Me fijo si el candidato está seleccionado
        for (var l in _seleccion) {
            for (var m in _seleccion[l]) {
                if (candidato.id_umv == _seleccion[l][m]) {
                    seleccionado = true;
                }
            }
        }

        //si es voto en blanco no armamos el boton
        if (candidato.clase == "Blanco") {
            blanco = 1;
            if (seleccionado) {
                document
                    .querySelector("#voto_blanco")
                    .classList.add("seleccionado");
            } else {
                document
                    .querySelector("#voto_blanco")
                    .classList.remove("seleccionado");
            }
        } else {
            elem += crear_item_candidato(candidato, seleccionado, "candidato");
        }
    }
    elem += '<div class="clear"></div>';
    return [elem, blanco];
}

/**
 * Carga los candidatos en pantalla.
 *
 * @param {*} data - Una lista de objetos con los datos del candidato.
 */
function cargar_candidatos(data) {
    var candidatos = data.candidatos;

    if (!constants.shuffle.por_sesion && constants.shuffle.candidatos) {
        candidatos = shuffle(candidatos);
    }

    var pantalla = patio.pantalla_candidatos;

    cambiar_categoria(data.categoria);
    contenido_solapa(data.categoria.nombre);

    //Me fijo si tengo que agrupar o no a los candidatos en las categorias en
    //PASO
    if (constants.agrupar_por_partido) {
        candidatos = agrupar_candidatos_por_partido(candidatos);
    }

    var data_elem = crear_botones_candidatos(candidatos);
    var elem = data_elem[0];
    var blanco = data_elem[1];

    var clase_candidatos = get_template_candidatos(candidatos.length - blanco);
    var clase_categria = "cat_" + data.categoria.codigo;
    var clase_barra = constants.mostrar_barra_seleccion
        ? "conbarra"
        : "sinbarra";

    var clases = [
        "pantalla",
        "opciones",
        clase_candidatos,
        clase_categria,
        clase_barra,
    ];
    document.querySelector(pantalla.id).classList.value = "";
    document.querySelector(pantalla.id).classList.value = clases.join(" ");
    pantalla.html(elem);
    bindear_botones();

    if (_votando) {
        pantalla.only();

        if (
            data.categoria.max_selecciones > 1 &&
            document.querySelectorAll(".candidato-persona.seleccionado")
                .length == data.categoria.max_selecciones
        ) {
            patio.confirmar_seleccion.removeClass("seleccionado");
            patio.confirmar_seleccion.show();
        }

        if (blanco) {
            patio.voto_blanco.show();
            document.querySelector("#voto_blanco").onclick = click_candidato;
        }
    } else {
        insercion_boleta();
    }
}

/**
 * Muestra la pantalla de confirmacion de voto.
 *
 * @param {*} paneles
 */
function mostrar_confirmacion(paneles) {
    confirmada = false;

    show_confirmacion();
    const pantalla = patio.pantalla_confirmacion;
    pantalla.addClass(get_template_confirmacion(paneles.length));
    var html = generar_paneles_confirmacion(paneles);
    if (_votando) {
        pantalla.html(html);
        homogeneizar_tarjetas_confirmacion();
    } else {
        insercion_boleta();
    }
    bindear_botones();
}

function homogeneizar_tarjetas_confirmacion() {
    const tarjetas_confirmacion = Array.from(
        document.getElementsByClassName("confirmacion_tarjeta")
    );
    mismo_alto_de_header(tarjetas_confirmacion);

    function mismo_alto_de_header(tarjetas) {
        const headers = tarjetas.map((t) => header(t));
        inicializar_alto(headers);
        const alto_header = mayor_alto(headers);
        headers.forEach((h) => set_alto(h, alto_header));

        function inicializar_alto(headers) {
            headers.forEach((h) => set_alto(h, "auto", ""));
        }
        function mayor_alto(headers) {
            return Math.max(...headers.map((h) => alto(h)));
        }
        function header(tarjeta) {
            return tarjeta.getElementsByClassName(
                "confirmacion_tarjeta-header"
            )[0];
        }
        function alto(elemento) {
            return elemento.getBoundingClientRect().height;
        }
        function set_alto(elemento, alto, medida = "px") {
            elemento.style.minHeight = `${alto}${medida}`;
        }
    }
}

/* exported get_next_modo */
/* exported seleccion_candidatos */
/* exported cargar_categorias */
/* exported cargar_listas */
/* exported cargar_consulta_popular */
/* exported seleccion_partido */
/* exported cargar_partidos_categoria */
/* exported cargar_partidos_completa */
/* exported cargar_candidatos */
/* exported mostrar_confirmacion */
