/**
 * @namespace js.popup
 */

'use strict';

/**
 * Funcion que muestra un dialogo, llamando al
 * callback para generar el contenido html del mismo
 *
 * @memberOf js.popup
 * @param {string} callback_template - Nombre de la función que devuelve el html contenido del popup
 * @returns {Promise} Promise que al resolverse muestra el popup en pantalla
 *
 */
function cargar_dialogo(callback_template){
    return new Promise((resolve, reject) => {
        const html_popup_call = window[callback_template];
        /**
         * html_popup_call puede ser:
         * a) un string: es el html del popup listo para ser cargado en el dom.
         * b) una funcion que devuelve un string: se debe llamar a esta función para obtener
         * el string html.
         * c) una funcion que devuelve una promise: sucede cuando el template del popup tiene que ser traido de disco.
         * Al resolverse devuelve el string html.
         * A continuación se usa Promise.resolve ya que nos permite trabajar los tres casos
         * de la misma manera. Promise.resolve recibe un valor o una promise y devuelve una promise.
         */
        const es_funcion = typeof(html_popup_call) === "function";
        const valor_o_promise = (es_funcion)? html_popup_call() : html_popup_call;
        Promise.resolve(valor_o_promise).then((html_popup) => {
            init_dialogo(html_popup)
            resolve();  
        }).catch(error => reject(error));
    });
}

/**
 * Funcion que muestra un dialogo, usando el template default de popup
 * que se encuentra en partials/popup/popup.html
 *
 * @param {object} mensaje - objeto json que se utiliza para renderizar el template html y contiene datos del popup.
 * @returns {Promise} Promise que al resolverse muestra el popup en pantalla
 */
function cargar_dialogo_default(mensaje){
    return new Promise((resolve, reject) => {
        fetch_template("popup", "partials/popup").then((template_popup) => {
            const html = template_popup(mensaje);
            init_dialogo(html);
            resolve();
        }).catch((error) => {
            reject(error);
        });
    })
}

/**
 * 
 * @param {string} template_name - Nombre del template. Ejemplo: "popup".
 * @param {string} template_dir - Path relativo al template. Ejemplo: "partials/popup".
 * @param {function} generador_html - Función que recibe el template especificado y genera el string html del popup.
 *  
 * @returns {Promise} Promise que al resolverse devuelve el html del popup generado.
 */
const promise_popup = (template_name, template_dir, generador_html) => {
    return new Promise((resolve, reject) => {
        fetch_template(template_name, template_dir).then((template) => {
            const html = generador_html(template);
            resolve(html);        
        }).catch((error) => {
            reject(error);
        });
    });
}

const init_dialogo = (html) => {
    const popup = document.querySelector('.popup-box');
    popup.innerHTML = html;
    const botones_popup = Array.from( popup.querySelectorAll(".btn") )
    botones_popup.forEach( 
        (btn) => btn.addEventListener("click", click_boton_popup) 
    );
    popup.style.display = "block";
    place_text(constants.i18n);
}

/**
 * Oculta el popup.
 * Cuidado: el argumento event puede ser nulo. Esto sucede cuando esta función 
 * es llamada por el backend a traves de zaguan.
 * 
 * @param {object|null} event - Evento del dom que dispara esta acción.
 * 
 *
 * @memberOf js.popup
 */
function hide_dialogo(event){
    const popup = document.querySelector('.popup-box');
    if (!popup) return;
    popup.style.display = "none";
    popup.dispatchEvent(
        new Event("hideDialogo")
    );
}

/**
 * Se ejecuta cuando se apreta un boton en el popup y determina
 * si la respuesta es positiva o no
 */
function click_boton_popup(event){
    hide_dialogo();
    event.currentTarget.dispatchEvent(
        new Event("clickBtnPopup")
    );
    const respuesta = event.currentTarget.classList.contains("btn-aceptar")
    const on_timeout_factory = (respuesta) => () => procesar_dialogo(respuesta);
    const on_timeout = on_timeout_factory(respuesta);
    /**@todo averiguar por qué se usa un timer para lanzar la llamada al server. */
    setTimeout(on_timeout, 100);
}


/**
 * Hace foco en el primer input que sea inválido. Acción ejecutada generalmente
 * cuando se dispara el evento custom ```hideDialogo```.
 */
function restaurar_foco_invalido(){
    const input_es_invalido = (input) => input.checkValidity() == false
    const primer_input_invalido = Array.from(
        document.querySelectorAll("input")
    ).find(input_es_invalido);
    if (primer_input_invalido){
        primer_input_invalido.focus() ;
    }
}


/**
 * Accion tomada cuando se presiona el boton aceptar. Oculta el mensaje y llama a :func:`~procesar_dialogo`
 *
 */
function click_boton_confirmacion(event){
    document.querySelector("#mensaje").style.display = "none";
    const respuesta = event.currentTarget.classList.contains("btn-aceptar")
    const on_timeout_factory = (respuesta) => () => procesar_dialogo(respuesta);
    const on_timeout = on_timeout_factory(respuesta);
    /**@todo averiguar por qué se usa un timer para lanzar la llamada al server. */
    setTimeout(on_timeout, 100);
}


/**
 * Llama a :meth:`modulos.base.actions.BaseActionController.respuesta_dialogo` con los datos de la respuesta.
 * @param {boolean} respuesta - tipo de respuesta
 */
function procesar_dialogo(respuesta){
    send('respuesta_dialogo', respuesta);
}
