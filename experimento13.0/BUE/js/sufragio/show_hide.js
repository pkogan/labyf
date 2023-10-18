/**
 * 
 * @namespace js.sufragio.show_hide
 */

/**
* Muestra la pantalla de seleccion de idioma.
*/
function show_pantalla_idiomas(callback){
    document.getElementById('pantalla_idiomas').style.display = 'block';
    callback();
}

/**
* Oculta la pantalla de seleccion de idioma.
*/
function hide_pantalla_idiomas(callback){
    document.getElementById('pantalla_idiomas').style.display = 'none';
    callback();
}

/**
* Muestra la pantalla de confirmacion.
*/
function show_confirmacion(){
    patio.pantalla_confirmacion.only();
    window.setTimeout(function(){
        prepara_impresion();
    }, 50);
}

/**
 * Muestra menú de salida.
 */
function mostrar_menu_salida(){
    var elem = document.querySelector('body');
    if(elem.getAttribute('data-state') == 'alto-contraste') {
        elem.setAttribute('data-state', 'normal');
    }
    setTimeout(
        function(){
            patio.pantalla_menu.only();
            unico_modo = true;
            if(unico_modo){
                document.querySelector('#btn_regresar').style.display = 'flex';
            }
            en_menu_salida = true
            document.querySelector('#accesibilidad #btn_regresar').removeEventListener("click", get_next_modo);
            document.querySelector('#accesibilidad #btn_regresar').addEventListener("click", insercion_boleta);
        }, 200);
}

/**
 * Cambia la pantalla de normal a alto contraste o viceversa.
 */
function toggle_alto_contraste(){
    var elem = document.querySelector("body");
    if(elem.getAttribute('data-state') == 'alto-contraste') {
        elem.setAttribute('data-state', 'normal');
    } else {
        elem.setAttribute('data-state', 'alto-contraste');
        /**
        * Se inserta un "cambio" con un time out para que se refresquen los estilos
        * El problema viene por webkit o zaguan
        */
        setTimeout(function() {
            var element = document.querySelector('.seleccion_lista_completa-numero-lista');
            var element_cat = document.querySelector('.candidato_categoria-nombre_partido')
            if (element !== null){
                element.textContent = element.textContent + '';
            }
            if (element_cat !== null){
                element_cat.textContent = element_cat.textContent + '';
            }
          }, 25);
    }
}

/**
 * Prepara el contenedor para proceder con el voto por categorias.
 *
 * @param {*} cod_categoria - codigo de la categoria seleccionada. 
 */
function actualizar_ui_voto_categorias(cod_categoria){
    cambiar_categoria(cod_categoria);
    update_titulo_categoria();
}

/*
 * Actualiza la solapa que contiene el nombre de la categoria que se estanvotando.
 */
function update_titulo_categoria(){
    var categoria_actual = get_categoria_actual()
    if(categoria_actual !== undefined){
      contenido_solapa(categoria_actual.nombre);
    }
}

/** Cambia el contenido de la solapa del titulo. */
function contenido_solapa(html){
    patio.categoria_votada.html(html);
    patio.categoria_votada.show();
}

/**
 * Muestra la solapa.
 */
function mostrar_template_solapa(template, datos){
    fetch_template(template).then((template_solapa) => {
        const html = template_solapa(datos);
        contenido_solapa(html);
    });
}

/**
 * Llama a la función :func:`<js.sufragio.show_hide.mostrar_template_solapa>`.
 */
function solapa(candidatura, categoria){
    if(constants.solapa_inteligente && typeof(candidatura) !== "undefined"){
        mostrar_template_solapa("solapa", {candidatura: candidatura,
                                           categoria: categoria});
    }
}