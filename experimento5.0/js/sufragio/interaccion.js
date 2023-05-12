/**
 * @namespace js.sufragio.interaccion
 */

/* sufragio/ipc.js */
/* global constants:readonly */
/* global seleccionar_idioma */
/* global sonido_tecla */

/* sufragio/base.js */
/* global aceptar_clicks:writable */
/* global _votando:readonly */
/* global _consulta_actual:readonly */
/* global pagina_anterior:writable */

/* sufragio/local_controller.js */
/* global local_data:readonly */
/* global preferencias_tmp */
/* global tachas_tmp */
/* global _cambiar_categoria */
/* global seleccionar_candidatos */
/* global seleccionar_lista */
/* global seleccionar_partido */
/* global seleccionar_modo */
/* global cargar_pantalla_inicial */

/* sufragio/voto.js */
/* global revisando:writable */
/* global _lista_seleccionada:writable */
/* global get_categoria_actual */
/* global guardar_modo */

/* sufragio/show_hide.js */
/* global toggle_alto_contraste */

/* sufragio/botonera.js */
/* global get_next_modo */

/* sufragio/pantallas.js */
/* global insercion_boleta */
/* global agradecimiento */

/* patio.js */
/* global patio */

/* zaguan.js */
/* global send */

/**
 * Cambia el estilo de toda la pagina y lo pone como Alto Contraste.
 */
function click_alto_contraste() {
    toggle_alto_contraste();
}

/**
 * Bindea los botones de la interfaz.
 */
function bindear_botones() {
    desbindear_botones();
    aceptar_clicks = true;
    if (document.querySelector("#accesibilidad #btn_regresar")) {
        document
            .querySelector("#accesibilidad #btn_regresar")
            .addEventListener("click", get_next_modo);
    }
    if (
        document.querySelectorAll("#opciones_idioma .opciom-idioma").length > 0
    ) {
        document
            .querySelectorAll("#opciones_idioma .opcion-idioma")
            .forEach((idioma) => {
                idioma.addEventListener("click", click_idioma);
            });
    }
    document
        .querySelectorAll("#candidatos_seleccionados .candidato")
        .forEach((cand) => {
            cand.addEventListener("click", click_cat);
        });
    document
        .querySelectorAll("#contenedor_pantallas .candidato")
        .forEach((cand) => {
            cand.addEventListener("click", click_opcion);
        });
}

/**
 * Desbindea los botones de la interfaz.
 */
function desbindear_botones() {
    aceptar_clicks = false;
    if (document.querySelector("#accesibilidad #btn_regresar")) {
        document
            .querySelector("#accesibilidad #btn_regresar")
            .removeEventListener("click", get_next_modo);
        document
            .querySelector("#accesibilidad #btn_regresar")
            .removeEventListener("click", insercion_boleta);
    }
    if (
        document.querySelectorAll("#opciones_idioma .opcion-idioma").length > 0
    ) {
        document
            .querySelectorAll("#opciones_idioma .opcion-idioma")
            .forEach((idioma) => {
                idioma.removeEventListener("click", click_idioma);
            });
    }
    document
        .querySelectorAll("#candidatos_seleccionados .candidato")
        .forEach((cand) => {
            cand.removeEventListener("click", click_cat);
        });
    document
        .querySelectorAll("#contenedor_pantallas .candidato")
        .forEach((cand) => {
            cand.removeEventListener("click", click_opcion);
        });
}

/**
 * Callback que se ejecuta cuando se hace click en una opcion.
 *
 * @param {*} evento - Evento que contiene la opción que fue cliqueada.
 */
function click_opcion(evento) {
    if (aceptar_clicks && _votando) {
        var callback = null;
        var boton = evento.currentTarget;
        if (boton.classList.contains("candidato-persona")) {
            callback = click_candidato;
        } else if (boton.classList.contains("partido")) {
            callback = click_partido;
        } else if (boton.classList.contains("boton-lista-js")) {
            callback = click_lista;
        } else if (boton.classList.contains("modificable")) {
            callback = click_candidato_seleccionado;
        } else if (boton.classList.contains("opcion-consulta-js")) {
            callback = click_consulta_popular;
        } else if (boton.classList.contains("tachas")) {
            callback = click_pantalla_tachas;
        } else if (boton.classList.contains("preferencias")) {
            callback = click_pantalla_preferencias;
        } else if (boton.classList.contains("opcion-preferencia")) {
            callback = click_preferencia_candidato;
        } else if (boton.classList.contains("opcion-tacha")) {
        callback = click_tacha_candidato;
        }
        if (callback !== null) {
            callback(evento);
        }
    } else if (!_votando) {
        insercion_boleta();
    }
}

/**
 * Callback que se ejecuta cuando se hace click en la categoria.
 */
function click_cat(evento) {
    desbindear_botones();
    pagina_anterior = null;
    const parts = evento.currentTarget.id.split("_");
    evento.currentTarget.classList.add("seleccionado");
    _cambiar_categoria(parts[1]);
}

/**
 * Callback que se ejecuta cuando se hace click en un candidato.
 */
function click_candidato(evento) {
    desbindear_botones();
    var parts = evento.currentTarget.id.split("_");
    var codigo = parts[1];
    var categoria = get_categoria_actual();
    var es_blanco = false;
    if (codigo == "blanco") {
        const candidato = local_data.candidaturas.one({
            cod_categoria: categoria.codigo,
            clase: "Blanco",
        });
        codigo = candidato.id_umv;
        es_blanco = true;
    }
    if (categoria.max_selecciones == 1) {
        document
            .querySelectorAll(".candidato-persona.seleccionado")
            .forEach((cand) => {
                cand.classList.remove("seleccionado");
            });
        if (es_blanco) {
            document
                .querySelector("#voto_blanco")
                .classList.toggle("seleccionado");
        } else {
            evento.currentTarget.classList.add("seleccionado");
        }

        if (parts[0] == "partido") {
            document
                .querySelector("#categoria_" + categoria)
                .classList.add("seleccionado");

            // @warning: esta función no está definida en ningun lado
            get_candidatos(categoria, false, codigo);

            pagina_anterior = categoria;
        } else {
            const candidato = local_data.candidaturas.one({ id_umv: codigo });
            if (candidato) {
                seleccionar_candidatos(categoria, [codigo]);
                if (
                    candidato.clase == "Candidatura" &&
                    candidato.categorias_hijas.length
                ) {
                    for (var i in candidato.categorias_hijas) {
                        var data_hijo = candidato.categorias_hijas[i];
                        var cat_hija = local_data.categorias.one({
                            codigo: data_hijo[0],
                        });
                        var cand_hijo = data_hijo[1];
                        seleccionar_candidatos(cat_hija, [cand_hijo.id_umv]);
                    }
                }
            }
        }
    } else {
        var boton = evento.currentTarget;
        document
            .querySelector("#confirmar_seleccion")
            .classList.remove("seleccionado");
        if (boton.classList.contains("seleccionado")) {
            boton.removeClass("seleccionado");
        } else {
            if (
                document.querySelectorAll(".candidato-persona.seleccionado")
                    .length < categoria.max_selecciones
            ) {
                boton.classList.add("seleccionado");
            }
        }
        var candidatos_seleccionados = document.querySelectorAll(
            ".candidato-persona.seleccionado"
        );
        if (candidatos_seleccionados.length == categoria.max_selecciones) {
            patio.confirmar_seleccion.show();
            bindear_botones();
        } else {
            patio.confirmar_seleccion.hide();
            bindear_botones();
        }
    }
    revisando = false;
}

/**
 * Callback de hacer click en el boton de confirmar seleccion cuando en una categoría se elije mas de una opcion.
 */
function click_confirmar_seleccion() {
    var candidatos_seleccionados = [];
    document
        .querySelectorAll(".candidato-persona.seleccionado")
        .forEach((cand) => {
            var parts = cand.getAttribute("id").split("_");
            candidatos_seleccionados.push(parts[1]);
        });
    var categoria = get_categoria_actual();
    document
        .querySelector("#confirmar_seleccion")
        .classList.add("seleccionado");
    setTimeout(function () {
        seleccionar_candidatos(categoria, candidatos_seleccionados);
    }, 120);
}

/*
 * Callback que se ejecuta cuando se hace click en una lista.
 */
function click_lista(evento) {
    var parts = evento.currentTarget.id.split("_");
    var codigo = parts[1];
    if (codigo == "blanco") {
        codigo = constants.cod_lista_blanco;
    }
    document
        .querySelectorAll(".candidato-lista-completa.seleccionado,#voto_blanco")
        .forEach((opcion) => {
            opcion.classList.remove("seleccionado");
        });
    evento.currentTarget.classList.add("seleccionado");
    _lista_seleccionada = codigo;
    seleccionar_lista(codigo);
}

function click_agrupaciones_municipales(evento) {
    /*
     * Callback que se ejecuta cuando se hace click en el boton de listas municipales.
     */
    document
        .querySelectorAll(
            ".candidato-lista-completa-js.seleccionado,#voto_blanco"
        )
        .forEach((cand) => {
            cand.classList.remove("seleccionado");
        });
    evento.currentTarget.classList.add("seleccionado");
    seleccionar_lista(null);
}

/**
 * Callback que se ejecuta cuando se hace click en una consulta popular.
 */
function click_consulta_popular(evento) {
    var parts = evento.currentTarget.id.split("_");
    var codigo = parts[1];
    if (codigo == "blanco") {
        var candidato = local_data.candidaturas.one({
            cod_categoria: _consulta_actual.codigo,
            clase: "Blanco",
        });
        codigo = candidato.id_umv;
    }
    document.querySelectorAll(".candidato").forEach((cand) => {
        cand.classList.remove("seleccionado");
    });
    evento.currentTarget.classList.add("seleccionado");

    setTimeout(function () {
        seleccionar_candidatos(_consulta_actual, [codigo]);
    }, constants.tiempo_feedback);
}

/**
 * Callback que se ejecuta cuando se hace click en una tacha.
 */
 function click_pantalla_tachas(evento) {
    var parts = evento.currentTarget.id.split("_");
    var codigo = parts[1];
    // buscamos el id_umv de la categoría actualmente seleccionada
    var _id_umv = _seleccion[codigo][0];
    var candidato = local_data.candidaturas.one({id_umv: _id_umv});

    document.querySelectorAll(".candidato").forEach((cand) => {
        cand.classList.remove("seleccionado");
    });
    evento.currentTarget.classList.add("seleccionado");

    setTimeout(function(){
        cargar_pantalla_tachas(candidato);
    }, constants.tiempo_feedback);
}

/**
 * Callback que se ejecuta cuando se hace click en una preferencia.
 */
function click_pantalla_preferencias(evento){
    var parts = evento.currentTarget.id.split("_");
    var codigo = parts[1];
    // buscamos el id_umv de la categoría actualmente seleccionada
    var _id_umv = _seleccion[codigo][0];
    var candidato = local_data.candidaturas.one({id_umv: _id_umv});

    document.querySelectorAll(".candidato").forEach((cand) => {
        cand.classList.remove("seleccionado");
    });
    evento.currentTarget.classList.add("seleccionado");

    setTimeout(function(){
        cargar_pantalla_preferencias(candidato);
    }, constants.tiempo_feedback);
}

/**
 * Callback que se ejecuta cuando se hace click en un partido.
 *
 * @param {*} evento - Evento que contiene el partido cliqueado.
 */
function click_partido(evento) {
    document.querySelectorAll(".candidato").forEach((cand) => {
        cand.classList.remove("seleccionado");
    });
    evento.currentTarget.classList.add("seleccionado");
    var parts = evento.currentTarget.id.split("_");
    var codigo = parts[1];
    var categoria = get_categoria_actual();
    setTimeout(function () {
        seleccionar_partido(codigo, categoria);
        pagina_anterior = codigo;
    }, constants.tiempo_feedback);
}

/**
 * Callback que se ejecuta cuando se hace click en un idioma.
 */
function click_idioma(evento) {
    const parts = evento.currentTarget.id.split("_");
    const codigo = `${parts[1]}_${parts[2]}`;
    seleccionar_idioma(codigo);
}

/**
 * Callback que se ejecuta cuando se hace click en un modo de votacion.
 *
 * @param {*} boton - Botón seleccionado.
 */
function click_modo(boton) {
    if (aceptar_clicks) {
        desbindear_botones();
        boton.classList.add("seleccionado");
        var parts = boton.id.split("-");
        templateClass.set_modo(parts[1]);
        setTimeout(function () {
            seleccionar_modo(parts[1]);
        }, constants.tiempo_feedback);
    }
}

/**
 * Callback que se ejecuta cuando se hace click en el boton "SI" de la confirmacion.
 */
function click_si() {
    document.querySelector("#si_confirmar_voto").classList.add("seleccionado");
    document.querySelector("#img_previsualizacion").innerHTML = "";
    window.setTimeout(sonido_tecla, 50);
    setTimeout(function () {
        document
            .querySelector("#si_confirmar_voto")
            .classList.remove("seleccionado");
        setTimeout(agradecimiento, 50);
    }, 120);
}

/**
 * Callback que se ejecuta cuando se hace click en el boton "NO" de la confirmacion.
 */
function click_no() {
    document.querySelector("#no_confirmar_voto").classList.add("seleccionado");
    revisando = true;
    pagina_anterior = null;
    window.setTimeout(cargar_pantalla_inicial, 50);
    setTimeout(function () {
        document
            .querySelector("#no_confirmar_voto")
            .classList.remove("seleccionado");
    }, 120);
}

function click_preferencia_candidato(evento){
    /*
     * Callback que se ejecuta cuando se hace click en un candidato
     * en la pantalla de preferencias
     */
    var parts = evento.currentTarget.id.split("_");
    var codigo = parts[1];
    var categoria = get_categoria_actual();

    var boton = evento.currentTarget;
    toggle_array_candidato(categoria.max_preferencias, boton, preferencias_tmp, codigo);

    // Si es una sola preferencia y no se usa el botón de confirmar, se va directamente a confirmar.
    if(categoria.max_preferencias == 1 && !constants.mostrar_confirmar_seleccion){
        var candidatos_seleccionados = [];
        document
            .querySelectorAll(".preferente_candidato.seleccionado")
            .forEach((cand) => {
                var parts = cand.getAttribute("id").split("_");
                candidatos_seleccionados.push(parts[1]);
                seleccionar_candidatos(categoria, candidatos_seleccionados);
            });
    } else {
        if(preferencias_tmp.length >= categoria.min_preferencias){
            patio.confirmar_seleccion.removeClass('deshabilitado');
            patio.confirmar_seleccion.show();
            bindear_botones();
        } else {
            // Si la constante está en true se quiere mostrar si o si el botón confirmar,
            // por ende se le agrega solamente la clase de deshabilitado.
            if (constants.mostrar_confirmar_seleccion) {
                patio.confirmar_seleccion.addClass('deshabilitado');
            } else {
                patio.confirmar_seleccion.hide();
            }

            bindear_botones();
        }
    }
    revisando = false;
}

/**
 * Callback que se ejecuta cuando se hace click en un candidato
 * en la pantalla de tachas
 *
 * @param {*} evento - Evento js que contiene la opción cliqueada.
 */
 function click_tacha_candidato(evento){
    var parts = evento.currentTarget.id.split("_");
    var codigo = parts[1];
    var categoria = get_categoria_actual();

    var boton = $(evento.currentTarget);
    toggle_array_candidato(Infinity, boton,
                           tachas_tmp, codigo);
}

/**
 * Callback que se ejecuta cuando se hace click en un candidato seleccionada.
 *
 * @param {*} evento - Evento js que contiene la opción cliqueada.
 */
function click_candidato_seleccionado(evento) {
    desbindear_botones();
    evento.currentTarget
        .querySelector(".btn-modificar-voto-js")
        .classList.add("boton-seleccionado");
    var parts = evento.currentTarget.id.split("_");
    setTimeout(function () {
        _cambiar_categoria(parts[1]);
        revisando = true;
    }, constants.tiempo_feedback);
}

/**
 * Callback de click del boton de Salir.
 *
 * @param {*} boton - Botón cliqueado.
 */
function click_salir(boton) {
    var parts = boton.id.split("_");
    send("salir_a_modulo", parts[2]);
}

/* exported click_alto_contraste */
/* exported click_confirmar_seleccion */
/* exported click_modo */
/* exported click_si */
/* exported click_no */
/* exported click_salir */
