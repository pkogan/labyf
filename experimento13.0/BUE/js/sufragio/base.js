/**
 * @namespace js.sufragio.base
 */
var get_url = null;
var patio = null;

var confirmada = false;
var pagina_anterior = null;
var unico_modo = false;
var _categoria_adhesion = null;
var _candidatos_adhesion = null;
var _es_ultima_adhesion = null;
var _consulta_actual = null;
var aceptar_clicks = true;
var _votando = false;
var en_menu_salida = false;

/**
 * Crea el objeto Patio si no fue ya creado.
 * @returns {Promise} 
*/
function load_patio(){
    if (patio !== null) {
        return Promise.resolve();
    }
    let context_tiles;
    if(constants.confirmacion_lateral) {
        context_tiles = confirmacion_barra_vertical.concat(contexto);
    } else {
        context_tiles = confirmacion_barra_horizontal.concat(contexto);
    }
    patio = new Patio(
        document.querySelector("#contenedor_pantallas"),
        pantallas,
        context_tiles,
        "pantallas/sufragio"
    );
    return new Promise((resolve, reject) => {
        patio.load().then(() => {
            if(!constants.mostrar_barra_seleccion){
                var tiles = patio.pantalla_candidatos.context_tiles;
                tiles.splice(tiles.indexOf("contenedor_der"), 1);
            }
            if(constants.confirmacion_lateral) {
                var tiles = patio.pantalla_confirmacion.context_tiles;
                tiles.splice(tiles.indexOf("barra_opciones"), 1);
                tiles.splice(tiles.indexOf("alto_contraste"), 1);
            }
            resolve();
        }).catch((error) => reject(error));
    });
}

/** 
 * Carga el CSS del flavor. 
 */
function load_css(flavor){
    var elem = document.createElement('link');
    elem.rel= 'stylesheet';
    elem.href= constants.PATH_TEMPLATES_FLAVORS + flavor +  '/sufragio/flavor.css';
    document.getElementsByTagName('head')[0].appendChild(elem);
}

/** 
 * Carga las extensiones js del flavor. 
 */
function load_extension_js(flavor){
    return new Promise((resolve) => {
        const extensiones_js = [
            "template-"+ flavor +".js"
        ];
        const promises_extensiones_js = extensiones_js.map(
            (file) => load_js(constants.PATH_EXTENSION_JS_MODULO + "/" + file)
        );
        Promise.all(promises_extensiones_js).then(() => {
            resolve();
        });
    });
}

/*
* Funcion que se ejecuta una vez que se carga la pagina.
*/
ready(() => {
    preparar_eventos();
    get_url = get_url_function("voto");
    document.addEventListener("dragstart", function(event){event.target.click();});
    load_ready_msg();
    bindear_botones();
    registrar_helper_imagenes();
    registrar_helper_i18n();
    registrar_helper_mostrar_data_candidato();
    registrar_helper_estado_tacha();
    registrar_helper_estado_preferencia();
    evitar_clics_seguidos();
});

/** 
 * Muestra el loader. 
 */
function mostrar_loader(){
    setTimeout(cargar_cache, 300);
    patio.loading.only();
}

/** Oculta el loader. */
function ocultar_loader(){
    setTimeout(inicializar_interfaz, 300);
}

/*
* Establece la variable ``unico modo`` que marca que se vota siempre porlista completa.
*/
function set_unico_modo(estado){
    patio.btn_regresar.show = function(){};
    unico_modo = estado;
}

/**
 * Pollyfill de Startswith
 * https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/String/startsWith#Polyfill
 */
if (!String.prototype.startsWith) {
    String.prototype.startsWith = function(searchString, position){
        position = position || 0;
        return this.substr(position, searchString.length) === searchString;
    };
}

function evitar_clics_seguidos() {
    // Función que registra un listener para cancelar los clics muy seguidos en el mismo lugar.
    // Cancela los clics realizados en a menos de 50px en x o y, y a menos de 5 segundos del clic anterior.
    var last_click = null;
    document.body.addEventListener('click', function (event) {
        if (last_click === null) {
            last_click = {
                timeStamp: event.timeStamp,
                x: event.x,
                y: event.y
            };
        } else {
            var dx = Math.abs(last_click.x - event.x);
            var dy = Math.abs(last_click.y - event.y);
            var timeDiff = event.timeStamp - last_click.timeStamp;
            let minTimeDiff = 2500;
            let minYDiff = 50;
            let minXDiff = 50;
            if(constants.asistida){
                minTimeDiff = 1500;
                minYDiff = 40;
                minXDiff = 40;
            }
            if ((event.x <= 0 && event.y <= 0) || (dx < minXDiff && dy < minYDiff && timeDiff < minTimeDiff)) {
                event.preventDefault();
                event.stopImmediatePropagation();
            } else {
                last_click = {
                    timeStamp: event.timeStamp,
                    x: event.x,
                    y: event.y
                };
            }
        }
    }, true);
}
