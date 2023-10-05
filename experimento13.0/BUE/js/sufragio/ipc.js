/**
 * @namespace js.sufragio.ipc
 */

var constants = {};


/**
* Envia la señal "document_ready" al backend.
*/
function load_ready_msg(){
    send('document_ready');
}

/* Manda la señal de inicializar la interfaz de votacion. */
function inicializar_interfaz(){
    send('inicializar_interfaz');
}

/* Manda la señal de cargar el cache. */
function cargar_cache(){
    send('cargar_cache');
}

/**
 * Establece las constantes que llegan desde el backend.
 * 
 * @param {*} data - un objeto con las constantes.
 * @returns {Promise}
 */
 function set_constants(data){
    constants = data;
    return new Promise((resolve, reject) => {

       /**
        * Para cargar patio primero es necesario cargar el encabezado, por lo tanto, 
        * se debe llamar primero a la promise de ``popular_html``.
        */
        const promise_popular_html = popular_html()

        /** 
         * Para que el simulador funcione es necesario cargar primero los templates 
         * de sufragio y luego cargar patio. Esto es así porque el simulador no guarda 
         * localmente los templates por separado sino todos juntos en un archivo 'sufragio.html'.
         */ 
        const promise_templates_sufragio = load_templates_sufragio(constants.templates);

        Promise.all([
            promise_popular_html, 
            promise_templates_sufragio
        ]).then(() => {
            const promise_patio = load_patio();
            const promise_colores = fetch_template("colores");
            const promise_extension_js = load_extension_js(constants.flavor);
            Promise.all([
                promise_colores,
                promise_extension_js,
                promise_patio
            ]).then(([
                template_colores,
                data_extension_js,
                data_patio
            ]) => {
                mostrar_loader();
                registrar_helper_colores(template_colores);
                var body = document.body;
                if(!constants.mostrar_cursor){
                    body.style.cursor = "none";
                }
                body.classList.add(constants.flavor);
                load_css(constants.flavor);
                body.setAttribute('data-ubicacion', constants.ubicacion);
                if(constants.mostrar_indicador_capacitacion){
                    document.querySelector("#barra_opciones .cinta").style.display = 'block';
                    document.querySelector("#encabezado .cinta-capacitacion").style.display = 'block';
                }
                place_text(data.i18n);
                place_text(data.encabezado); 
                resolve()   
            })
        }).catch((error) => reject(error))
    })
}

/**
 * Carga todos los templates de sufragio en memoria. 
 * Para esto toma el archivo "sufragio.html", el cual contiene todos los templates juntos, 
 * y luego llama a la función ```cargar_templates_en_dom``` la cual los agrega al DOM y a una
 * variable local que hace de caché de templates. 
 * Esto se hace con el objetivo de que la aplicación, al solicitar la carga de un template 
 * en particular, pueda accederlo desde la memoria y no haga falta leerlo de disco.
 * Además esta función es importante para el simulador, ya que este no posee los templates de sufragio 
 * por separado, sino que solo guarda un archivo que los contiene a todos juntos: "sufragio.html".
 * 
 * @param {*} templates - Templates del módulo de sufragio.
 * @returns {Promise}
 */
function load_templates_sufragio(templates){
    return new Promise((resolve, reject) => {
        if(constants.templates_compiladas){
            const url_templates_flavor = 
                constants.PATH_TEMPLATES_FLAVORS + constants.flavor + "/sufragio/templates.html";
            const url_templates_sufragio = constants.PATH_TEMPLATES_VAR + "sufragio.html";
            Promise.all([
                load_template_comp(url_templates_flavor),
                load_template_comp(url_templates_sufragio)
            ]).then(() => {
                cargar_templates_en_dom();
                resolve();
            }).catch((error) => reject(error));
        } else {
            load_templates(templates).then(() => resolve());
        }
    });
}

/**
 * Selecciona un idioma dado.
 * 
 * @param {*} modo - El idioma seleccionado.
 */
function seleccionar_idioma(modo){
    send('seleccionar_idioma', modo);
}

/**
 * Recibe la pantalla a la que se debe cambiar y los parametros con los que esa pantalla debe ser llamada.
 * 
 * @param {*} pantalla - Nueva pantalla.
 */
function change_screen(pantalla){
    func = window[pantalla[0]];
    func(pantalla[1]);
}

/**
* Envia la señal para preparar la impresion.
*/
function prepara_impresion(){
    send('prepara_impresion');
}

/** 
 * Envia la señal avisandole al backend que queremos previsualizar el voto.
*/
function previsualizar_voto(){
    send("previsualizar_voto");
}

/** 
 * Envia la señal avisandole al backend que queremos confirmar la seleccion.
*/
function confirmar_seleccion(){
    send('confirmar_seleccion');
}

/**
 * Avisa al backend que fue presionado el asterisco de asistida.
 * 
 * @param {*} numero - El número seleccionado.
 */
function asterisco(numero){
    send('asterisco', numero);
}

/**
 * Avisa al backend que apretamos el numeral de asistida. 
 * 
 * @param {*} numero - El número seleccionado.
 */
function numeral(numero){
    send('numeral', numero);
}

/** 
 * Avisa al backend que tiene que lanzar el sonido de tecla apretada. 
*/
function sonido_tecla(){
    send("sonido_tecla");
}

/** 
 * Avisa al backend que tiene que lanzar el sonido de alerta. 
*/
function sonido_warning(){
    send("sonido_warning");
}
