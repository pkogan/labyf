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
/* global es_candidato_con_preferentes */

/* sufragio/voto.js */
/* global get_modo */

/* imagenes.js */
/* global get_path_partido */

/* popup.js */
/* global promise_popup */

/* helpers.js */
/* global fetch_template */
/* global get_template_desde_cache */

let _templates_precargados;
let templateClass;

/**
 * Rellena el template de "encabezado".
 */
function popular_html() {
    return new Promise((resolve, reject) => {
        fetch_template("encabezado", "partials")
            .then((template_header) => {
                const html_header = template_header({voto: true, mostrar_ubicacion: constants.mostrar_ubicacion});
                document.querySelector("#encabezado").innerHTML = html_header;
                resolve();
            })
            .catch((error) => reject(error));
    });
}

/**
 * dependencias externas:
 *      - get_template_desde_cache (de helpers.js)
 *      - get_path_partido (de imagenes.js)
 *      - local_data (de local_controller.js)
 *      - _categorias (de voto.js)
 *      - _lista_seleccionada (de voto.js)
 *      - es_candidato_con_preferentes ()
 */
class Templates {
    constructor(modo, constants) {
        this.__modo = modo;
        this.__constants = constants;
    }

    set_modo(modo) {
        this.__modo = modo;
    }

    /**
     * Devuelve el nombre de la clase de CSS para establecer el tamaño de las
     * tarjetas de candidatos en selección, segun la cantidad de tarjetas en
     * pantalla.
     *
     * @param {*} tarjetas - Cantidad de tarjetas a mostrar.
     * @returns {String} Nombre de una clase CSS.
     */
    get_template_candidatos(tarjetas) {
        return this.__classname_segun_candidatos(
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
    get_template_confirmacion(tarjetas) {
        return this.__classname_segun_candidatos(
            tarjetas,
            "confirmacion",
            constants.numeros_templates_confirmacion
        );
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
    __classname_segun_candidatos(
        cantidad_candidatos,
        prefijo,
        sufijos_existentes
    ) {
        return prefijo +
            (sufijos_existentes
                    .slice() // genera una copia (para no mutar el arreglo original)
                    .sort((a, b) => a - b) // ordena el arreglo de menor a mayor
                    .find((i) => i >= cantidad_candidatos) ||
                sufijos_existentes.slice(-1)[0]);
    }

    /**
     * Crea el boton para una lista.
     *
     * @param {*} boleta - un objeto con la informacion de la lista para la que se quiere crear el item de lista.
     * @param {Boolean} normal - Si el id de candidatura está en la boleta o dentro de la lista de la boleta.
     * @returns {String} Html en formato de cadena de caracteres.
     */
    crear_item_lista(boleta, normal) {
        let template_name = this.__get_template_name_lista();
        let template_data = this.__get_template_data_lista(boleta, normal);
        const template = get_template_desde_cache(template_name);
        var item = template(template_data);
        return item;
    }

    /**
     * Devuelve el nombre del template para las listas
     *
     * @returns {String} Nombre del template que usa la lista
     */
    __get_template_name_lista() {
        return "lista";
    }

    /**
     * Devuelve los datos que necesita el template de lista
     *
     * @param {*} boleta - un objeto con la informacion de la lista para la que se quiere crear el item de lista.
     * @param {Boolean} normal - Si el id de candidatura está en la boleta o dentro de la lista de la boleta.
     * @returns {*}
     */
    __get_template_data_lista(boleta, normal) {
        var id_lista = "lista_";
        if (normal) {
            id_lista += boleta.lista.id_candidatura;
        } else {
            id_lista += boleta.id_candidatura;
        }

        var seleccionado = "";
        if (this.__modo == "BTN_COMPLETA" && _categorias !== null) {
            if (_lista_seleccionada == boleta.lista.codigo) {
                seleccionado = "seleccionado";
            }
        }
        var candidatos = get_candidatos_boleta(boleta);
        let template_data = this.__main_dict_base(id_lista);
        template_data.lista = normal ? boleta.lista : boleta;
        template_data.normal = normal;
        template_data.seleccionado = seleccionado;
        template_data.candidatos = candidatos;
        template_data.cantidad_candidatos = candidatos.length;
        return template_data;
    }

    /**
     * Crea el boton para una consulta popular.
     *
     * @param {*} candidato - un objeto con la informacion de la consulta popular para la que se quiere crear el boton.
     * @returns {String} Html en formato de cadena de caracteres.
     */
    crear_item_consulta_popular(candidato) {
        let template_name = this.__get_template_name_consulta_popular();
        let template_data = this.__get_template_data_consulta_popular(candidato);
        var template = get_template_desde_cache(template_name);
        var item = template(template_data);
        return item;
    }

    /**
     * Devuelve el nombre del template para consulta popular
     *
     * @returns {String} Nombre del template que usa consulta popular
     */
    __get_template_name_consulta_popular() {
        return "consulta_popular";
    }

    /**
     * Devuelve los datos que necesita el template de consulta popular
     *
     * @param {*} candidato - un objeto con la informacion de la consulta popular para la que se quiere crear el boton.
     * @returns {*}
     */
    __get_template_data_consulta_popular(candidato) {
        var id_candidato = "candidato_" + candidato.id_umv;

        //Me fijo si el candidato está seleccionado
        var seleccionado = "";
        for (var l in _seleccion) {
            for (var m in _seleccion[l]) {
                if (candidato.id_umv == parseInt(_seleccion[l][m])) {
                    seleccionado = true;
                }
            }
        }
        let template_data = {
            candidato: candidato,
            id_boton: id_candidato,
            seleccionado: seleccionado,
        };
        return template_data;
    }

    /**
     * Crea el boton para un partido.
     *
     * @param {*} partido - Objeto con los datos del partido para el que se quiere crear el boton.
     * @param {Boolean} seleccionado - Si el partido está seleccionado o no.
     * @param {*} categoria_actual - Objeto categoria que esta actualmente seleccionado
     * @returns {String} Html en formato de cadena de caracteres.
     */
    crear_item_partido(partido, seleccionado, categoria_actual) {
        let template_name = this.__get_template_name_partido();
        let template_data = this.__get_template_data_partido(partido, seleccionado, categoria_actual);
        var template = get_template_desde_cache(template_name);
        var item = template(template_data);
        return item;
    }


    /**
     * Devuelve el nombre del template para los partidos
     *
     * @returns {String} Nombre del template que usa el partido
     */
    __get_template_name_partido() {
        return "partido";
    }

    /**
     * Devuelve los datos que necesita el template los partidos
     *
     * @param {*} partido - Objeto con los datos del partido para el que se quiere crear el boton.
     * @param {Boolean} seleccionado - Si el partido está seleccionado o no.
     * @returns {*}
     */
    __get_template_data_partido(partido, seleccionado, categoria_actual) {
        var extra_classes = "";

        var id_lista = "partido_" + partido.codigo;
        var path_imagen_agrupacion = get_path_partido(partido.imagen);
        var img_cand = [];

        if (constants.mostrar_fotos_candididatos_boton_partido) {
            var filtro = {cod_alianza: partido.codigo};
            if (this.__modo == "BTN_CATEG") {
                filtro.cod_categoria = categoria_actual.codigo;
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
        return template_data;
    }

    /**
     * Crea el contenido del boton de un candidato.
     *
     * @param {*} candidato - El candidato a crearle el botón.
     * @param {*} seleccionado - Si el candidato está seleccionado o no.
     * @param {*} candidatos - Candidatos que se muestran en la misma pantalla
     * @returns {String} Html en formato de cadena de caracteres.
     */
    crear_item_candidato(candidato, seleccionado, candidatos) {
        let template_name = this.__get_template_name_candidato(candidato, candidatos);
        var template = get_template_desde_cache(template_name);
        let template_data = this.__get_template_data_candidato(candidato, seleccionado);
        var item = template(template_data);
        return item;
    }

    /**
     * Devuelve el nombre del template para un candidato
     *
     * @param {*} candidato - El candidato a crearle el botón.
     * @param {*} candidatos - Candidatos que se muestran en la misma pantalla
     * @returns {String} Nombre del template que usa el candidato
     */
    __get_template_name_candidato(candidato, candidatos) {
        return (candidato.blanco) ? "candidato_blanco"
            : "candidato_categoria";
    }

    /**
     * Devuelve los datos que necesita el template de candidato
     *
     * @param {*} candidato - El candidato a crearle el botón.
     * @param {*} seleccionado - Si el candidato está seleccionado o no.
     * @returns {*}
     */
    __get_template_data_candidato(candidato, seleccionado) {
        var extra_html = "";
        var extra_classes = "";
        var id_candidato = "candidato_" + candidato.id_umv;
        //Si el partido y la lista se llaman igual no muestro la lista esto fue
        //agregado en Salta y puede ser que en otros lados no quieran este
        //comportamiento
        const tiene_nombre_lista = !(
            constants.no_repetir_lista_partido_iguales &&
            typeof candidato.partido !== "undefined" &&
            typeof candidato.lista !== "undefined" &&
            candidato.lista.nombre == candidato.partido.nombre
        );
        const nombre_lista = tiene_nombre_lista && typeof candidato.lista !== "undefined" ? candidato.lista.nombre : false;

        if (
            candidato.categorias_hijas !== undefined &&
            candidato.categorias_hijas.length
        ) {
            extra_classes += " hijos_" + candidato.categorias_hijas.length;
            extra_html += this.__crear_categorias_hijas(candidato.categorias_hijas);
        }

        if (seleccionado) {
            extra_classes += " seleccionado";
        }

        //Armo el template con los datos del candidato
        var template_data = this.main_dict_candidato(
            candidato,
            id_candidato,
            "boton_candidato"
        );
        template_data.candidato.es_pcf = template_data.candidato.cod_categoria == 'PCF' ? true : false;
        template_data.candidato.es_vice_int = template_data.candidato.cod_categoria == 'INT' && template_data.candidato.suplentes[0] ? true : false;
        template_data.extra_classes = extra_classes;
        template_data.extra_html = extra_html;
        template_data.nombre_lista = nombre_lista;
        return template_data;
    }

    /**
     * Crea los templates de categorias_hijas para un boton.
     *
     * @param {*} categorias_hijas - Categorías hijas a mostrar
     * @param {*} vista - Lugar donde se van a mostrar tales candidatos. Pueden ser: "barra_lateral", "boton_candidato", "confirmacion", "verificacion"
     * @returns {String} Html en formato de cadena de caracteres.
     */
    __crear_categorias_hijas(categorias_hijas, vista) {
        var html = "";
        var template_hija = get_template_desde_cache("candidato_hijo");
        for (var l in categorias_hijas) {
            var cat_hija = categorias_hijas[l];
            var candidato = cat_hija[1];
            var categoria = local_data.categorias.one({codigo: cat_hija[0]});
            var data_hija = {categoria: categoria, candidato: candidato};
            data_hija.secundarios = this.__construir_candidatos(
                candidato,
                "secundarios",
                vista
            );
            data_hija.suplentes = this.__construir_candidatos(
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
     *
     * @param {*} categorias - Categorías a mostrar.
     * @returns {String} Html en formato de cadena de caracteres.
     */
    generar_paneles_confirmacion(categorias) {
        var html =
            '<div class="barra-titulo"><p>' +
            constants.i18n.sus_candidatos +
            "</p></div>";
        for (var i in categorias) {
            var categoria = categorias[i].categoria;
            var candidato = categorias[i].candidato;
            categoria = cambio_tittle_cod_dato(categoria);
            html += this.__crear_item_confirmacion(candidato, categoria, categorias.length);
        }
        html += '<div class="clear"></div>';
        return html;
    }

    /**
     * Crea el contenido del boton de confirmacion.
     *
     * @param {*} candidato - El candidato a crearle el botón.
     * @param {*} categoria - La categoria a crearle el botón.
     * @param {number} cantidad_categorias - Total de categorias a mostrar
     * @returns {String} Html en formato de cadena de caracteres.
     */
    __crear_item_confirmacion(candidato, categoria, cantidad_categorias) {
        let template_name = this.__get_template_name_confirmacion(candidato, categoria);
        var template = get_template_desde_cache(template_name);
        let template_data = this.__get_template_data_confirmacion(candidato, categoria, cantidad_categorias);
        var item = template(template_data);
        return item;
    }

    /**
     * Devuelve el nombre del template de la tarjeta de confirmacion
     *
     * @param {*} candidato - El candidato a crearle el botón.
     * @param {*} categoria - La categoria a crearle el botón.
     * @returns {String} Nombre del template que se usa en la confirmacion
     */
    __get_template_name_confirmacion(candidato, categoria) {
        //registra partial que usa el template de confirmacion confirmacion_tarjeta
        Handlebars.registerPartial(
            "componenteConfirmacion",
            get_template_desde_cache(
                template_name_componente_confirmacion(candidato, categoria)
            )
        );
        return "confirmacion_tarjeta";


        function template_name_componente_confirmacion(candidato, categoria) {
            if (candidato.blanco || candidato.clase === "Blanco")
                return "confirmacion_candidato_blanco";
            if (categoria.consulta_popular) return "confirmacion_consulta_popular";

            const tiene_preferentes = es_candidato_con_preferentes(candidato);
            if (tiene_preferentes) return "confirmacion_con_preferentes";

            return "confirmacion_candidato_elegido";
        }
    }

    /**
     * Indica si el botón modificar está habilitado para la pantalla de
     * confirmación.
     * @param {*} categoria 
     * @param {*} cantidad_categorias 
     * @returns 
     */
    __boton_modificar_esta_activado(categoria, cantidad_categorias) {
        const es_modificar_en_lista_completa =
            constants.boton_modificar_en_lista_completa &&
            this.__modo == "BTN_COMPLETA";
        const es_modificar_en_categorias =
            constants.boton_modificar_en_categorias && this.__modo == "BTN_CATEG";
        const es_consulta_popular = categoria.consulta_popular;
        const no_modificar_por_categoria_unica =
            cantidad_categorias == 1 &&
            !constants.boton_modificar_con_una_categoria;

        return (
            (es_modificar_en_lista_completa ||
                es_modificar_en_categorias ||
                es_consulta_popular) &&
            !no_modificar_por_categoria_unica
        );
    }

    /**
     * Devuelve los datos que necesita el template de la tarjeta de confirmacion
     *
     * @param {*} candidato - El candidato a crearle el botón.
     * @param {*} categoria - La categoria a crearle el botón.
     * @param {number} cantidad_categorias - Total de categorias a mostrar
     * @returns {*}
     */
    __get_template_data_confirmacion(candidato, categoria, cantidad_categorias) {
        var nombre_partido = "";
        if (candidato.partido !== null && candidato.partido !== undefined) {
            nombre_partido = candidato.partido.nombre;
        }

        var id_confirmacion = "confirmacion_" + categoria.codigo;
        var template_data = this.main_dict_candidato(
            candidato,
            id_confirmacion,
            "confirmacion"
        );
        template_data.candidato.es_vice_int = template_data.candidato.cod_categoria == 'INT' && template_data.candidato.suplentes[0] ? true : false;
        template_data.modificar = this.__boton_modificar_esta_activado(categoria, cantidad_categorias);
        template_data.consulta_popular = categoria.consulta_popular
            ? "consulta_popular"
            : "";
        template_data.categoria = categoria;
        template_data.nombre_partido = template_data.blanco
            ? ""
            : nombre_partido;
        return template_data;
    }

    /**
     * Genera los paneles de verificación.
     *
     * @param {*} candidatos - Candidatos a mostrar.
     * @returns {String} Html en formato de cadena de caracteres.
     */
    generar_paneles_verificacion(candidatos) {
        return new Promise((resolve, reject) => {
            var html = "";
            let template_name = this.__get_template_name_verificacion();
            fetch_template(template_name).then((template_candidato_verificacion) => {
                for (var i in candidatos) {
                    let datos_candidato = candidatos[i];
                    let candidato = this.__crear_candidato_verificacion(datos_candidato);
                    let categoria = local_data.categorias.one({codigo: candidato.cod_categoria});
                    if (categoria.adhiere == null)
                        html += this.__crear_item_verificacion(candidato, categoria, template_candidato_verificacion);
                }
                resolve(html);
            });
        });
    }

    /**
     * Genera un candidato para la tarjeta de verificación.
     *
     * @param {*} datos_candidato - Datos necesarios para crear el candidato.
     * @returns {*}
     */
    __crear_candidato_verificacion(datos_candidato) {
        let candidato;
        if (datos_candidato.constructor === Array) {
            //tomo el primer candidato y obtengo la categoria
            candidato = local_data.candidaturas.one({id_umv: datos_candidato[0]});
            let categoria = local_data.categorias.one({codigo: candidato.cod_categoria});

            if (datos_candidato.length > 1) {
                //si la categoria tiene preferentes armo un array con todos los candidatos preferentes
                if (typeof (categoria.max_preferencias) !== "undefined") {
                    //TODO: cargar todas las preferencias, no solamente la primera
                } else {
                    let candidato_principal = local_data.candidaturas.one({id_umv: datos_candidato[0]});
                    let id_candidatura_secundario = datos_candidato[1];

                    if (id_candidatura_secundario != null
                        && id_candidatura_secundario != candidato_principal.id_candidatura
                    ) {
                        candidato = buscar_secundario(candidato_principal, datos_candidato[1]);
                        candidato.cod_categoria = candidato_principal.cod_categoria;
                        candidato.lista = candidato_principal.lista;
                        candidato.imagenes = [];
                        candidato.imagenes[0] = candidato.imagen;
                    }
                }
            }
        } else {
            candidato = local_data.candidaturas.one({id_umv: datos_candidato});
        }
        return candidato;
    }

    /**
     * Crea el contenido del boton de verificacion.
     *
     * @param {*} candidato - El candidato a crearle el botón.
     * @param {*} template - Template de verificacion (Handlebars).
     * @returns {String} Html en formato de cadena de caracteres.
     */
    __crear_item_verificacion(candidato, categoria, template) {
        let template_data = this.__get_template_data_verificacion(candidato, categoria);
        let item = template(template_data);
        return item;
    }

    /**
     * Devuelve el nombre del template de la tarjeta de confirmacion
     *
     * @returns {String} Nombre del template que se usa en la confirmacion
     */
    __get_template_name_verificacion() {
        return "candidato_verificacion";
    }

    /**
     * Devuelve los datos que necesita el template de la tarjeta de confirmacion
     *
     * @param {*} candidato - datos del candidato a crearle el panel de verificación.
     * @param {*} categoria - La categoria a crearle el botón.
     * @returns {*}
     */
    __get_template_data_verificacion(candidato, categoria) {
        var id_boton = "categoria_" + candidato.cod_categoria;
        var template_data = this.main_dict_candidato(
            candidato,
            id_boton,
            "verificacion"
        );
        template_data.es_consulta = (categoria.consulta_popular
            && !data_template.blanco);
        template_data.categoria = categoria;
        template_data.cant_cargos = local_data.categorias.many().length;
        return template_data;
    }

    /**
     * Diccionario base de los items de un boton.
     *
     * @param {*} id_boton - Identificador unívoco del botón.
     */
    __main_dict_base(id_boton) {
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
    __traer_candidatos_template(candidato, campo, vista) {
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
    __construir_candidatos(candidato, campo, vista) {
        var candidatos = this.__traer_candidatos_template(candidato, campo, vista);
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
    main_dict_candidato(candidato, id_boton, vista) {
        var data = this.__main_dict_base(id_boton);
        data.candidato = candidato;
        data.blanco = candidato.clase == "Blanco";

        let candidatos_confirmacion = [];
        if (typeof (candidato.secundarios) !== "undefined") {
            if (!candidato.cargo_ejecutivo && candidato.codigo !== "BLC") {
                var filter = {
                    clase: "Candidato",
                    cod_lista: candidato.cod_lista,
                    cod_categoria: candidato.cod_categoria,
                };
                candidatos_confirmacion = local_data.candidaturas.many(filter);
                data.secundarios = this.__construir_candidatos(candidato, "secundarios", vista);
            }
        }

        if (typeof (candidato.suplentes) !== "undefined") {
            data.suplentes = this.__construir_candidatos(candidato, "suplentes", vista);
        }

        // si no es un cargo ejecutivo, inserto el 1er candidato adelante
        // de todo, excepto BLC
        if (!candidato.cargo_ejecutivo && candidato.codigo !== "BLC") {
            let candidato_principal = {
                nombre: candidato.nombre,
                nro_orden: candidato.nro_orden,
                id_candidatura: candidato.id_candidatura
            };

            if (typeof (candidato.imagenes) !== "undefined")
                candidato_principal.imagen = candidato.imagenes[0];

            data.candidatos_confirmacion = candidatos_confirmacion;
        }
        return data;
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

/**
 * Indica si el candidato es para un cargo ejecutivo o es el unico preferente.
 *
 * @param {*} candidato - objeto candidato.
 * @returns {Boolean}
 */
function es_cargo_ejecutivo_o_preferente_unico(candidato) {
    return candidato.cargo_ejecutivo || get_preferencias(candidato).length === 0;
}

/**
 * Indica si tiene que mostrar datos del candidato.
 *
 * @param {*} candidato - objeto candidato.
 * @returns {Boolean}
 */
function if_mostrar_data_candidato(candidato, opts) {
    return es_cargo_ejecutivo_o_preferente_unico(candidato) ? opts.fn(this) : opts.inverse(this);
}

/** Helper de handlebars para determinar si tienen que mostrar datos del candidato */
function registrar_helper_mostrar_data_candidato() {
    Handlebars.registerHelper(
        "if_mostrar_data_candidato",
        if_mostrar_data_candidato
    );
}

function if_tacha(id_candidatura, opts) {
    if (typeof (_seleccion.tachas) !== "undefined") {
        if (_seleccion.tachas.includes(id_candidatura)) {
            return opts.fn(this);
        }
    }
    return opts.inverse(this);
}

/** Helper de handlebars para determinar si un candidato tiene tachas */
function registrar_helper_estado_tacha() {
    Handlebars.registerHelper("if_tacha", if_tacha);
}

/**
 * Indica si el candidato es para un cargo ejecutivo o es el unico preferente.
 *
 * @param {*} candidato - objeto candidato.
 * @returns {Boolean}
 */
function if_preferencia(id_umv, categoria, opts) {
    if (typeof (_seleccion.preferencias[categoria]) !== "undefined") {
        if (_seleccion.preferencias[categoria].includes(id_umv.toString())) {
            return opts.fn(this);
        }
    }
    return opts.inverse(this);
}

/** Helper de handlebars para determinar si un candidato tiene preferencia */
function registrar_helper_estado_preferencia() {
    Handlebars.registerHelper("if_preferencia", if_preferencia);
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

function lighten_darken_color(percent, color_array) {
    if (color_array) {
        var color = color_array[0];
        var f = parseInt(color.slice(1), 16), t = percent < 0 ? 0 : 255, p = percent < 0 ? percent * -1 : percent,
            R = f >> 16, G = f >> 8 & 0x00FF, B = f & 0x0000FF;
        return "#" + (0x1000000 + (Math.round((t - R) * p) + R) * 0x10000 + (Math.round((t - G) * p) + G) * 0x100 + (Math.round((t - B) * p) + B)).toString(16).slice(1);
    }
}

/** Helper de handlebars para aplicar colores */
function registrar_helper_colores() {
    Handlebars.registerHelper("colores", crear_div_colores);
    Handlebars.registerHelper("mod_color", lighten_darken_color);
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
/* exported generar_paneles_verificacion */
/* exported msg_error_grabar_boleta */
/* exported crear_div_colores */
/* exported registrar_helper_colores */
/* exported registrar_helper_imagenes */
/* exported registrar_helper_i18n */
/* exported registrar_helper_mostrar_data_candidato */
/* exported registrar_helper_estado_tacha */
/* exported registrar_helper_estado_preferencia */

