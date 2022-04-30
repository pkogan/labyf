/**
 * @namespace js.sufragio.voto
 */
var _categoria_actual = null;
var _categorias = null;
var _candidatos_seleccionados = null;
var _modo = null;
var revisando = false;
var _lista_seleccionada = null;

/**
* Cambia la categoria actual.
*/
function cambiar_categoria(categoria){
    _categoria_actual = categoria;
}

/**
 * Limpia el recuadro de la seleccion de los candidatos.
*/
function limpiar_categorias(){
    document.querySelector('#candidatos_seleccionados .candidato').classList.remove('seleccionado');
}

/**
 * Limpia la informacion de las categorias que se estan votando actualmente.
*/
function limpiar_data_categorias(){
    _categorias = null;
}

/**
 * Devuelve el codigo de la categoria actual.
*/
function get_categoria_actual(){
    return _categoria_actual;
}

/**
 * Guarda el modo actual de votacion.
*/
function guardar_modo(modo){
    _modo = modo;
}

/**
 * Devuelve el modo actual de votacion.
*/
function get_modo(){
    return "BTN_CATEG";
}

