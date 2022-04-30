/**
 * @namespace js.sufragio.templates
 */

/* global constants */
/* global _categorias */
/* global _lista_seleccionada */
/* global _seleccion */
/* global local_data */
/* global Handlebars */

/* sufragio/local_controller.js */
/* global get_candidatos_boleta */

/* sufragio/voto.js */
/* global get_modo */
/* global get_categoria_actual */

/* imagenes.js */
/* global get_path_partido */

/* popup.js */
/* global promise_popup */

/* helpers.js */
/* global fetch_template */
/* global get_template_desde_cache */

let _templates_precargados;

/**
 * Rellena el template de "encabezado".
 */
function popular_html() {
    return new Promise((resolve, reject) => {
        fetch_template("encabezado", "partials")
            .then((template_header) => {
                var html_header = template_header({ voto: true });
                document.querySelector("#encabezado").innerHTML = html_header;
                resolve();
            })
            .catch((error) => reject(error));
    });
}

/**
 * Función que devuelve un nombre de clase css de acuerdo a la cantidad de candidatos.
 * El nombre de la clase se arma con el prefijo más el sufijo correspondiente.
 * El sufijo correspondiente es el primer sufijo de ``sufijos_existentes`` que es igual o
 * mayor al valor de ``cantidad_candidatos``. Si no hay ningún sufijo que cumpla con
 * esa condición se devuelve el ultimo sufijo de la lista de ``sufijos_candidatos``.
 * Ejemplos: Si la lista de sufijos es [2, 3, 4, 6, 9, 12, 16, 20, 24, 30, 36] y el
 * prefijo es "max", si la cantidad de candidatos es 24 la salida de la función es
 * "max24"; si es 25, "max30"; si es 31, "max36" y si es 42, "max36".
 * @param {number} cantidad_candidatos - Cantidad de candidatos a mostrar en pantalla.
 * @param {string} prefijo - prefijo de la clase css.
 * @param {number[]} sufijos_existentes - Sufijos existentes de clases css.
 */
const classname_segun_candidatos = (
    cantidad_candidatos,
    prefijo,
    sufijos_existentes
) =>
    prefijo +
    (sufijos_existentes
        .slice() // genera una copia (para no mutar el arreglo original)
        .sort((a, b) => a - b) // ordena el arreglo de menor a mayor
        .find((i) => i >= cantidad_candidatos) ||
        sufijos_existentes.slice(-1)[0]);
// toma el primer elemento que satisface la condicion, de
// no encontrar uno, devuelve el último elemento del arreglo.

/**
 * Devuelve el nombre de la clase de CSS para establecer el tamaño de las
 * tarjetas de candidatos en selección, segun la cantidad de tarjetas en
 * pantalla.
 *
 * @param {*} tarjetas - Cantidad de tarjetas a mostrar.
 * @returns {String} Nombre de una clase CSS.
 */
function get_template_candidatos(tarjetas) {
    return classname_segun_candidatos(
        tarjetas,
        "max",
        constants.numeros_templates
    );
}

/**
 * Devuelve el nombre de la clase de CSS para establecer el tamaño de las
 * tarjetas de candidatos en confirmación, segun la cantidad de tarjetas en
 * pantalla.
 *
 * @param {*} tarjetas - Cantidad de tarjetas a mostrar.
 * @returns {String}
 */
function get_template_confirmacion(tarjetas) {
    return classname_segun_candidatos(
        tarjetas,
        "confirmacion",
        constants.numeros_templates_confirmacion
    );
}

/**
 * Crea el boton para una lista.
 *
 * @param {*} boleta - un objeto con la informacion de la lista para la que se quiere crear el item de lista.
 * @param {Boolean} normal - Si el id de candidatura está en la boleta o dentro de la lista de la boleta.
 * @returns {*}
 */
function crear_item_lista(boleta, normal) {
    var id_lista = "lista_";
    if (normal) {
        id_lista += boleta.lista.id_candidatura;
    } else {
        id_lista += boleta.id_candidatura;
    }
    var candidatos = get_candidatos_boleta(boleta);

    var modo = get_modo();
    var seleccionado = "";
    if (modo == "BTN_COMPLETA" && _categorias !== null) {
        if (_lista_seleccionada == boleta.lista.codigo) {
            seleccionado = "seleccionado";
        }
    }
    let template_data = main_dict_base(id_lista);
    template_data.lista = normal ? boleta.lista : boleta;
    template_data.normal = normal;
    template_data.seleccionado = seleccionado;
    template_data.candidatos = candidatos;
    template_data.cantidad_candidatos = candidatos.length;

    const template = get_template_desde_cache("lista");
    var item = template(template_data);

    return item;
}
/**
 * Crea el boton para una consulta popular.
 *
 * @param {*} candidato - un objeto con la informacion de la consulta popular para la que se quiere crear el boton.
 * @returns {*}
 */
function crear_item_consulta_popular(candidato) {
    var template = get_template_desde_cache("consulta_popular");
    var id_candidato = "candidato_" + candidato.id_umv;

    var seleccionado = "";

    //Me fijo si el candidato está seleccionado
    for (var l in _seleccion) {
        for (var m in _seleccion[l]) {
            if (candidato.id_umv == parseInt(_seleccion[l][m])) {
                seleccionado = true;
            }
        }
    }

    var template_data = {
        candidato: candidato,
        id_boton: id_candidato,
        seleccionado: seleccionado,
    };

    var item = template(template_data);
    return item;
}

/**
 * Crea el boton para un partido.
 *
 * @param {*} partido - Objeto con los datos del partido para el que se quiere crear el boton.
 * @param {Boolean} seleccionado - Si el partido está seleccionado o no.
 * @returns {*}
 */
function crear_item_partido(partido, seleccionado) {
    var template = get_template_desde_cache("partido");
    var extra_classes = "";

    var id_lista = "partido_" + partido.codigo;
    var path_imagen_agrupacion = get_path_partido(partido.imagen);
    var img_cand = [];

    if (constants.mostrar_fotos_candididatos_boton_partido) {
        var filtro = { cod_alianza: partido.codigo };
        if (get_modo() == "BTN_CATEG") {
            filtro.cod_categoria = get_categoria_actual().codigo;
        }
        var candidaturas = local_data.candidaturas.many(filtro);
        for (var i in candidaturas) {
            var candidato = candidaturas[i];
            img_cand.push(candidato.codigo);
        }
    }

    if (seleccionado) {
        extra_classes += " seleccionado";
    }

    var template_data = {
        id_boton: id_lista,
        partido: partido,
        path_imagen_agrupacion: path_imagen_agrupacion,
        imagenes_candidatos: img_cand,
        extra_classes: extra_classes,
    };

    var item = template(template_data);
    return item;
}

/**
 * Crea el contenido del boton de un candidato.
 *
 * @param {*} candidato - El candidato a crearle el botón.
 * @param {*} seleccionado - Si el candidato está seleccionado o no.
 * @param {*} template_name - Nombre del template que se quiere renderizar.
 */
function crear_item_candidato(candidato, seleccionado, template_name) {
    var extra_html = "";
    var extra_classes = "";
    var id_candidato = "candidato_" + candidato.id_umv;

    var template = get_template_desde_cache(template_name);

    //Si el partido y la lista se llaman igual no muestro la lista esto fue
    //agregado en Salta y puede ser que en otros lados no quieran este
    //comportamiento
    const tiene_nombre_lista = !(
        constants.no_repetir_lista_partido_iguales &&
        typeof candidato.partido !== "undefined" &&
        typeof candidato.lista !== "undefined" &&
        candidato.lista.nombre == candidato.partido.nombre
    );
    const nombre_lista = tiene_nombre_lista ? candidato.lista.nombre : false;

    if (
        candidato.categorias_hijas !== undefined &&
        candidato.categorias_hijas.length
    ) {
        extra_classes += " hijos_" + candidato.categorias_hijas.length;
        extra_html += crear_categorias_hijas(candidato.categorias_hijas);
    }

    if (seleccionado) {
        extra_classes += " seleccionado";
    }

    //Armo el template con los datos del candidato
    var template_data = main_dict_candidato(
        candidato,
        id_candidato,
        "boton_candidato"
    );
    template_data.extra_classes = extra_classes;
    template_data.extra_html = extra_html;
    template_data.nombre_lista = nombre_lista;
    var rendered = template(template_data);

    return rendered;
}

/**
 * Crea los templates de categorias_hijas para un boton.
 *
 * @param {*} categorias_hijas - Categorías hijas a mostrar
 * @param {*} vista - Lugar donde se van a mostrar tales candidatos. Pueden ser: "barra_lateral", "boton_candidato", "confirmacion", "verificacion"
 * @returns {String} Html en formato de cadena de caracteres.
 */
function crear_categorias_hijas(categorias_hijas, vista) {
    var html = "";
    var template_hija = get_template_desde_cache("candidato_hijo");
    for (var l in categorias_hijas) {
        var cat_hija = categorias_hijas[l];
        var candidato = cat_hija[1];
        var categoria = local_data.categorias.one({ codigo: cat_hija[0] });
        var data_hija = { categoria: categoria, candidato: candidato };
        data_hija.secundarios = construir_candidatos(
            candidato,
            "secundarios",
            vista
        );
        data_hija.suplentes = construir_candidatos(
            candidato,
            "suplentes",
            vista
        );
        html += template_hija(data_hija);
    }
    return html;
}

/**
 * Genera los paneles de confirmacion.
 * @param {*} categorias - Categorías a mostrar.
 * @returns {String} Html en formato de cadena de caracteres.
 */
function generar_paneles_confirmacion(categorias) {
    var modo = get_modo();

    var html =
        '<div class="barra-titulo"><p>' +
        constants.i18n.sus_candidatos +
        "</p></div>";
    for (var i in categorias) {
        var categoria = categorias[i].categoria;
        var candidato = categorias[i].candidato;

        var nombre_partido = "";
        if (candidato.partido !== null && candidato.partido !== undefined) {
            nombre_partido = candidato.partido.nombre;
        }

        var id_confirmacion = "confirmacion_" + categoria.codigo;
        var template_data = main_dict_candidato(
            candidato,
            id_confirmacion,
            "confirmacion"
        );
        template_data.modificar = boton_modificar_esta_activado();
        template_data.consulta_popular = categoria.consulta_popular
            ? "consulta_popular"
            : "";
        template_data.categoria = categoria;
        template_data.nombre_partido = template_data.blanco
            ? ""
            : nombre_partido;

        html += tarjeta_confirmacion_html(template_data, candidato, categoria);
    }
    html += '<div class="clear"></div>';
    return html;

    function boton_modificar_esta_activado() {
        const es_modificar_en_lista_completa =
            constants.boton_modificar_en_lista_completa &&
            modo == "BTN_COMPLETA";
        const es_modificar_en_categorias =
            constants.boton_modificar_en_categorias && modo == "BTN_CATEG";
        const es_consulta_popular = categoria.consulta_popular;
        const no_modificar_por_categoria_unica =
            categorias.length == 1 &&
            !constants.boton_modificar_con_una_categoria;

        return (
            (es_modificar_en_lista_completa ||
                es_modificar_en_categorias ||
                es_consulta_popular) &&
            !no_modificar_por_categoria_unica
        );
    }

    function tarjeta_confirmacion_html(template_data, candidato, categoria) {
        Handlebars.registerPartial(
            "componenteConfirmacion",
            get_template_desde_cache(
                template_name_componente_confirmacion(candidato, categoria)
            )
        );
        const confirmacion_tarjeta_template = get_template_desde_cache(
            "confirmacion_tarjeta"
        );
        return confirmacion_tarjeta_template(template_data);
    }

    function template_name_componente_confirmacion(candidato, categoria) {
        if (candidato.blanco || candidato.clase === "Blanco")
            return "confirmacion_candidato_blanco";
        if (categoria.consulta_popular) return "confirmacion_consulta_popular";
        return "confirmacion_candidato_elegido";
    }
}

/** Genera el mensaje de error de grabación de la boleta. */
function msg_error_grabar_boleta() {
    const generador_html = (template_popup) => {
        var template_data = {
            pregunta: constants.i18n.error_grabar_boleta_alerta,
            aclaracion: constants.i18n.error_grabar_boleta_aclaracion,
            btn_aceptar: true,
            btn_cancelar: false,
        };
        var html_contenido = template_popup(template_data);
        return html_contenido;
    };

    return promise_popup("popup", "partials/popup", generador_html);
}

/**
 * Diccionario base de los items de un boton.
 *
 * @param {*} id_boton - Identificador unívoco del botón.
 */
function main_dict_base(id_boton) {
    var data = {
        id_boton: id_boton,
    };
    return data;
}

/**
 * Devuelve la cantidad de candidatos para mostrar en el template segun el campo y la vista.
 *
 * @param {*} candidato - Candidato del que queremos mostrar los "subcandidatos".
 * @param {*} campo - Campo dentro del objeto candidato. Puede ser "secundarios" o "suplentes".
 * @param {*} vista - Lugar donde se van a mostrar tales candidatos. Pueden ser: "barra_lateral", "boton_candidato", "confirmacion", "verificacion".
 * @returns {*} Candidatos del campo.
 */
function traer_candidatos_template(candidato, campo, vista) {
    // Traigo los candidatos del campo en cuestion
    var candidatos = candidato[campo];

    //Traigo las settings de limitacion de candidatos para ese campo
    var dict_campo = constants.limitar_candidatos[campo];
    // Si las settings existen
    if (dict_campo != undefined) {
        // Averiguamos la cantidad.
        var cantidad = dict_campo[vista];
        // si hay una cantidad establecida en el Diccionario.
        if (cantidad != null) {
            var vista_cat = cantidad[candidato.cod_categoria];
            if (typeof vista_cat !== "undefined") {
                cantidad = vista_cat;
            }
        }
        cantidad = parseInt(cantidad);
    }

    if (
        typeof candidatos !== "undefined" &&
        typeof cantidad != "undefined" &&
        !isNaN(cantidad)
    ) {
        candidatos = candidatos.slice(0, cantidad);
    }
    return candidatos;
}

/**
 * Renderiza template "candidatos_adicionales".
 *
 * @param {*} candidato - Candidato del que queremos mostrar los "subcandidatos".
 * @param {*} campo - Campo dentro del objeto candidato. Puede ser "secundarios" o "suplentes".
 * @param {*} vista - Lugar donde se van a mostrar tales candidatos. Pueden ser: "barra_lateral", "boton_candidato", "confirmacion", "verificacion".
 */
function construir_candidatos(candidato, campo, vista) {
    var candidatos = traer_candidatos_template(candidato, campo, vista);
    var data = {
        candidatos: candidatos,
    };

    var template = get_template_desde_cache("candidatos_adicionales");
    return template(data);
}

/**
 * Genera un diccionario de candidatos.
 *
 * @param {*} candidato - Candidato del que queremos mostrar los "subcandidatos".
 * @param {*} id_boton - Identificador del botón.
 * @param {*} vista Lugar donde se van a mostrar tales candidatos. Pueden ser: "barra_lateral", "boton_candidato", "confirmacion", "verificacion".
 * @returns {Object} Datos del candidato.
 */
function main_dict_candidato(candidato, id_boton, vista) {
    var data = main_dict_base(id_boton);
    data.candidato = candidato;
    data.blanco = candidato.clase == "Blanco";
    data.secundarios = construir_candidatos(candidato, "secundarios", vista);
    data.suplentes = construir_candidatos(candidato, "suplentes", vista);
    return data;
}

/**
 * Genera Html de un elemento que muestra colores.
 *
 * @param {*} colores - Colores que se desean renderizar.
 * @returns {String} Html en formato de cadena de caracteres y sin caracteres de escape.
 */
function crear_div_colores(colores) {
    var item = "";
    if (colores) {
        var template = get_template_desde_cache("colores");
        var template_data = {
            num_colores: colores.length,
            colores: colores,
        };

        item = template(template_data);
    }
    return new Handlebars.SafeString(item);
}

/**
 * Genera Html de un elemento que muestra colores.
 *
 * @param {*} colores - Colores que se desean renderizar.
 * @returns {String} Html en formato de cadena de caracteres y sin caracteres de escape.
 */
const crear_div_colores_helper = (template) => (colores) => {
    var item = "";
    if (colores) {
        var template_data = {
            num_colores: colores.length,
            colores: colores,
        };
        item = template(template_data);
    }
    return new Handlebars.SafeString(item);
};

/**
 * Helper de handlebars para generar elementos html de colores.
 */
function registrar_helper_colores(template_colores) {
    const crear_div_colores = crear_div_colores_helper(template_colores);
    Handlebars.registerHelper("colores", crear_div_colores);
}

/**
 * Genera un path hacia la imagen dada.
 *
 * @param {String} imagen
 * @returns {String} Path hacia una imagen.
 */
function path_imagen(imagen) {
    var nombre_imagen = imagen + "." + constants.ext_img_voto;
    if (imagen == "BLC") {
        nombre_imagen = "BLC.svg";
    }
    var img_path =
        constants.path_imagenes_candidaturas + constants.juego_de_datos + "/";
    var src = img_path + nombre_imagen;
    return src;
}

/**
 * Genera la cadena de caracteres de un tag html de la imagen recibida.
 *
 * @param {String} imagen - Path relativo hacia una imagen.
 * @returns {String} Cadena de caracteres de un tag html de la imagen recibida.
 */
function crear_img(imagen) {
    var src = path_imagen(imagen);
    var tag = '<img src="' + src + '" />';
    return new Handlebars.SafeString(tag);
}

/**
 * Helper de handlebars para generar elemento html de una imagen.
 */
function registrar_helper_imagenes() {
    Handlebars.registerHelper("imagen_candidatura", crear_img);
}

/**
 * Devuelve el valor de la clave "key".
 *
 * @param {*} key - Clave del diccionario "constants.i18n".
 */
function _i18n(key) {
    return constants.i18n[key];
}

/** Helper de handlebars para generar constantes "i18n" */
function registrar_helper_i18n() {
    Handlebars.registerHelper("i18n", _i18n);
}

/* exported _templates_precargados */
/* exported popular_html */
/* exported get_template_candidatos */
/* exported get_template_confirmacion */
/* exported crear_item_lista */
/* exported crear_item_consulta_popular */
/* exported crear_item_partido */
/* exported crear_item_candidato */
/* exported generar_paneles_confirmacion */
/* exported msg_error_grabar_boleta */
/* exported crear_div_colores */
/* exported registrar_helper_colores */
/* exported registrar_helper_imagenes */
/* exported registrar_helper_i18n */
